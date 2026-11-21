import { createLoader } from './helpers/load-module.mjs';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import test from 'node:test';

const pause = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

test('多参数下拉保留原始值参数且不修改对象参数', async () => {
  const { fetchOptions } = createLoader()('src/components/Selects/utils/apiOptions.ts');
  const filter = Object.freeze({ status: 1 });
  const params = Object.freeze([0, 'active', null, filter]);
  let received;
  await fetchOptions(
    async (...args) => {
      received = args;
      return { code: 200, data: [] };
    },
    params,
    { page: 2 },
  );
  assert.deepEqual(received, [0, 'active', null, { status: 1, page: 2 }]);
  assert.deepEqual(filter, { status: 1 });
});
async function mount(file) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
  const globals = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    globals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, value });
  }
  let props;
  const Select = (next) => {
    props = next;
    return React.createElement(
      'div',
      { id: 'options' },
      JSON.stringify(next.options || next.treeData),
    );
  };
  const Component = createLoader({
    antd: { Select, TreeSelect: Select, Spin: () => null },
    'react-i18next': { useTranslation: () => ({ t: (key) => key }) },
    './index': { MAX_TAG_COUNT: 'responsive' },
    './components/Loading': { default: () => null },
  })(file).default;
  const root = createRoot(document.getElementById('root'));
  return {
    props: () => props,
    text: () => document.getElementById('options').textContent,
    render: async (next) =>
      act(async () => {
        root.render(React.createElement(Component, next));
        await pause();
      }),
    close: async () => {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, value] of globals) {
        if (value) Object.defineProperty(globalThis, key, value);
        else delete globalThis[key];
      }
    },
  };
}

test('普通/树下拉响应参数、disabled 和 fieldNames 更新，忽略过期结果', async () => {
  for (const name of ['ApiSelect', 'ApiTreeSelect']) {
    const ui = await mount(`src/components/Selects/${name}.tsx`);
    const pending = [];
    const api = (params) => new Promise((resolve) => pending.push({ params, resolve }));
    try {
      await ui.render({ api, params: { department: 'a' }, value: 0 });
      await ui.render({
        api,
        params: { department: 'b' },
        value: 0,
        disabled: true,
        fieldNames: { label: 'name', value: 'id' },
      });
      assert.equal(pending.length, 2);
      assert.equal(ui.props().disabled, true);
      assert.equal(ui.props().fieldNames.label, 'name');
      await act(async () => pending[1].resolve({ code: 200, data: [{ id: 2, name: 'new' }] }));
      await act(async () => pending[0].resolve({ code: 200, data: [{ id: 1, name: 'old' }] }));
      assert.match(ui.text(), /new/);
      assert.doesNotMatch(ui.text(), /old/);
    } finally {
      await ui.close();
    }
  }
});

test('已有选中值时下拉加载失败，再次展开能够恢复', async () => {
  for (const name of ['ApiSelect', 'ApiTreeSelect']) {
    const ui = await mount(`src/components/Selects/${name}.tsx`);
    let calls = 0;
    const api = async () =>
      ++calls === 1
        ? { code: 500, message: '临时失败' }
        : { code: 200, data: [{ value: 0, label: '恢复成功' }] };
    try {
      await ui.render({ api, value: 0 });
      await act(async () => ui.props().onOpenChange(true));
      assert.equal(calls, 2);
      assert.match(ui.text(), /恢复成功/);
    } finally {
      await ui.close();
    }
  }
});

test('分页下拉不会修改参数，参数切换重置页码，快速搜索不会混入旧结果', async () => {
  const ui = await mount('src/components/Selects/ApiPageSelect.tsx');
  const pending = [];
  const api = (params) => new Promise((resolve) => pending.push({ params, resolve }));
  const params = Object.freeze({ department: 'a' });
  try {
    await ui.render({ api, params, value: 0, pageSize: 2 });
    await act(async () => pause(10));
    await act(async () => pending[0].resolve({ code: 200, data: [{ value: 1 }, { value: 2 }] }));
    await act(async () => {
      ui.props().onPopupScroll({
        currentTarget: { scrollTop: 100, clientHeight: 20, scrollHeight: 120 },
      });
    });
    await act(async () => pause(10));
    assert.equal(pending[1].params.page, 2);
    await ui.render({ api, params: Object.freeze({ department: 'b' }), value: 0, pageSize: 2 });
    await act(async () => pause(10));
    assert.equal(pending[2].params.page, 1);
    assert.equal(pending[2].params.department, 'b');
    await act(async () =>
      pending[2].resolve({ code: 200, data: [{ value: 3, label: 'new department' }] }),
    );
    await act(async () =>
      pending[1].resolve({ code: 200, data: [{ value: 2, label: 'old page' }] }),
    );
    assert.doesNotMatch(ui.text(), /old page/);
    await act(async () => ui.props().onSearch('alpha'));
    await act(async () => pause(220));
    const alpha = pending.at(-1);
    await act(async () => ui.props().onSearch('beta'));
    await act(async () => pause(220));
    const beta = pending.at(-1);
    assert.equal(beta.params.query, 'beta');
    assert.equal(beta.params.page, 1);
    await act(async () => beta.resolve({ code: 200, data: [{ value: 'beta' }] }));
    await act(async () => alpha.resolve({ code: 200, data: [{ value: 'alpha' }] }));
    assert.match(ui.text(), /beta/);
    assert.doesNotMatch(ui.text(), /alpha/);
    assert.deepEqual(params, { department: 'a' });
  } finally {
    await ui.close();
  }
});
