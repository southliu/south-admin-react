import { createLoader } from './helpers/load-module.mjs';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import test from 'node:test';

async function withDom(run) {
  const dom = new JSDOM('<div id="root"></div>');
  const previous = new Map();
  const frames = new Map();
  let frameId = 0;
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame: (callback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const root = createRoot(document.getElementById('root'));
  try {
    await run({
      root,
      frames,
      step: async (timestamp) => {
        const callbacks = [...frames.values()];
        frames.clear();
        await act(async () => callbacks.forEach((callback) => callback(timestamp)));
      },
    });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test('数字动画按时间递增或递减，参数变化重启，完成或卸载后停止请求帧', async () => {
  const Count = createLoader({ '@/utils/helper': { amountFormatter: String } })(
    'src/components/Count/index.tsx',
  ).default;
  await withDom(async ({ root, frames, step }) => {
    const render = (start, end) =>
      act(async () =>
        root.render(React.createElement(Count, { start, end, prefix: '￥', className: 'counter' })),
      );
    const value = () => document.querySelector('span').textContent;
    await render(0, 100);
    await step(0);
    await step(1000);
    assert.equal(value(), '￥50');
    await step(2000);
    assert.equal(value(), '￥100');
    assert.equal(frames.size, 0);
    assert.equal(document.querySelector('span').className, 'counter');

    await render(100, 0);
    await step(3000);
    await step(4000);
    assert.equal(value(), '￥50');
    await step(5000);
    assert.equal(value(), '￥0');
    assert.equal(frames.size, 0);

    await render(5, 5);
    await step(6000);
    assert.equal(value(), '￥5');
    assert.equal(frames.size, 0);
    await render(0, 3.5);
    await step(7000);
    await step(9000);
    assert.equal(value(), '￥3.5');
    await render(0, 100);
    await step(10000);
    await render(10, 200);
    assert.equal(frames.size, 1);
    await step(11000);
    assert.equal(value(), '￥10');
    await act(async () => root.unmount());
    assert.equal(frames.size, 0);
  });
});

test('全局搜索只处理停止输入后的最新值，关闭和卸载时取消待处理搜索', async () => {
  const calls = [];
  const permissions = [];
  const menuList = [];
  let inputProps;
  let modalProps;
  const load = createLoader({
    '@/menus/utils/helper': {
      searchMenuValue: ({ value }) => {
        calls.push(value);
        return value ? [{ key: value, label: value }] : [];
      },
    },
    '@/hooks/useCommonStore': { useCommonStore: () => ({ permissions, menuList }) },
    '@/stores': {
      useTabsStore: (selector) => selector({}),
      useMenuStore: (selector) => selector({}),
    },
    'react-router-dom': { useNavigate: () => () => {} },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    '@iconify/react': { Icon: () => null },
    antd: {
      Input: (props) => {
        inputProps = props;
        return React.createElement('input', { ref: props.ref, value: props.value, readOnly: true });
      },
      Modal: (props) => {
        modalProps = props;
        return props.open ? props.children : null;
      },
    },
    './SearchResult': {
      __esModule: true,
      default: ({ list }) =>
        React.createElement('output', null, list.map((item) => item.key).join(',')),
    },
    './SearchFooter': { __esModule: true, default: () => null },
  });
  const SearchModal = load('src/components/GlobalSearch/components/SearchModal.tsx').default;
  await withDom(async ({ root }) => {
    const render = (isOpen) =>
      act(async () =>
        root.render(
          React.createElement(SearchModal, {
            isOpen,
            onClose: () =>
              root.render(React.createElement(SearchModal, { isOpen: false, onClose: () => {} })),
          }),
        ),
      );
    const wait = (ms) => act(async () => new Promise((resolve) => setTimeout(resolve, ms)));
    await render(true);
    await act(async () => inputProps.onChange({ target: { value: 'a' } }));
    await wait(60);
    await act(async () => inputProps.onChange({ target: { value: 'ab' } }));
    await wait(250);
    assert.deepEqual(calls, ['ab']);
    assert.equal(document.querySelector('output').textContent, 'ab');

    await act(async () => inputProps.onChange({ target: { value: 'closed' } }));
    await act(async () => modalProps.onCancel());
    await wait(250);
    assert.deepEqual(calls, ['ab']);
    await render(true);
    assert.equal(document.querySelector('input').value, '');
    assert.equal(document.querySelector('output').textContent, '');
    await act(async () => inputProps.onChange({ target: { value: 'unmounted' } }));
    await act(async () => root.unmount());
    await wait(250);
    assert.deepEqual(calls, ['ab']);
  });
});

test('密码强度支持受控重置和普通输入，清空后立即隐藏强度条', async () => {
  let inputProps;
  const PasswordStrength = createLoader({
    '@/utils/fieldLimits': { USER_LENGTH: { password: 72 } },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    antd: {
      Input: {
        Password: (props) => {
          inputProps = props;
          return null;
        },
      },
    },
    './components/StrengthBar': {
      __esModule: true,
      default: ({ strength }) => React.createElement('output', null, strength),
    },
  })('src/components/PasswordStrength/index.tsx').default;
  await withDom(async ({ root }) => {
    const render = (props) =>
      act(async () => root.render(React.createElement(PasswordStrength, props)));
    await render({ value: 'Testpass1' });
    assert.equal(document.querySelector('output').textContent, '3');
    await render({ value: '' });
    assert.equal(document.querySelector('output'), null);
    await render({ value: 'Testpass1' });
    await render({ value: undefined });
    assert.equal(document.querySelector('output'), null);

    await render({});
    await act(async () => inputProps.onChange({ target: { value: 'Testpass1' } }));
    assert.equal(document.querySelector('output').textContent, '3');
    await act(async () => inputProps.onChange({ target: { value: '' } }));
    assert.equal(document.querySelector('output'), null);
  });
});
