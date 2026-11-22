import { createLoader } from './helpers/load-module.mjs';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import test from 'node:test';

test('URL 参数完整解码，登录回跳保留多参数并拒绝外部地址与循环', () => {
  const { getUrlAllParam, getUrlParam, getLoginRedirect } = createLoader({
    '@/utils/config': {},
  })('src/utils/helper.ts');
  const values = { name: '张三 空格', query: 'a=b&c+d', empty: '' };
  assert.deepEqual(getUrlAllParam(`?${new URLSearchParams(values)}`), values);
  assert.equal(getUrlParam('?id=a%3Db&other=2', 'id'), 'a=b');
  const target = `/system/user?${new URLSearchParams(values)}`;
  assert.equal(getLoginRedirect(`?${new URLSearchParams({ redirect: target })}`), target);
  for (const redirect of [
    '//evil.test',
    '/\\evil.test',
    'https://evil.test',
    '/login?redirect=/',
    '/forget',
  ])
    assert.equal(getLoginRedirect(`?${new URLSearchParams({ redirect })}`), '');
});

test('未配置 rule 的菜单在显示、搜索、默认跳转和面包屑中使用相同规则', () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => 'zh' };
  try {
    const { filterMenus, getFirstMenu, getMenuByKey, searchMenuValue } = createLoader({
      '@/router/utils/helper': { isRouteExist: () => true },
      '@/utils/config': { LANG: 'lang' },
    })('src/menus/utils/helper.ts');
    const menus = [
      { key: '/public', label: '公共页面', labelEn: 'Public' },
      { key: '/private', label: '私有页面', labelEn: 'Private', rule: '/private' },
    ];
    assert.deepEqual(
      filterMenus(menus, []).map((item) => item.key),
      ['/public'],
    );
    assert.equal(getFirstMenu(menus, []), '/public');
    assert.equal(getMenuByKey({ menus, permissions: [], key: '/public' }).key, '/public');
    assert.equal(searchMenuValue({ menus, permissions: [], value: '公共' })[0].key, '/public');
  } finally {
    globalThis.localStorage = previous;
  }
});

test('新版本只提示，保存后主动刷新才更新版本，不安排强制刷新', async () => {
  const original = new Map();
  const cache = new Map([['version', 'old']]);
  let reloads = 0;
  let timers = 0;
  for (const [key, value] of Object.entries({
    localStorage: {
      getItem: (key) => cache.get(key),
      setItem: (key, value) => cache.set(key, value),
    },
    window: { location: { reload: () => reloads++ } },
    setTimeout: () => timers++,
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    const { versionCheck } = createLoader(
      {
        '@/utils/config': { LANG: 'lang', VERSION: 'version' },
        axios: { get: async () => ({ data: { version: 'new' } }) },
      },
      (source) => source.replaceAll('import.meta.env.MODE', "'production'"),
    )('src/layouts/utils/helper.ts');
    let notice;
    await versionCheck((key) => key, {
      info: (options) => {
        notice = options;
      },
    });
    assert.equal(notice.duration, 0);
    assert.equal(cache.get('version'), 'old');
    assert.equal(reloads, 0);
    assert.equal(timers, 0);
    assert.equal(notice.content.type, 'button');
    notice.content.props.onClick();
    assert.equal(cache.get('version'), 'new');
    assert.equal(reloads, 1);
  } finally {
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('按需 store 订阅不响应无关字段；请求序号在替换、关闭和卸载后失效', async () => {
  const dom = new JSDOM('<div id="root"></div>');
  const original = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const stores = {
    useUserStore: create(() => ({
      permissions: [],
      userInfo: { id: 1, roles: [], username: 'test', name: 'Test' },
    })),
    useTabsStore: create(() => ({ isMaximize: false, nav: [], tabs: [] })),
    useMenuStore: create(() => ({
      isPhone: false,
      isCollapsed: false,
      openKeys: [],
      selectedKeys: '',
      menuList: [],
    })),
    usePublicStore: create(() => ({ isRefresh: false, isFullscreen: false, theme: 'light' })),
  };
  const load = createLoader({ '@/stores': stores });
  const { useCommonStore } = load('src/hooks/useCommonStore.ts');
  const { useRequestSequence } = load('src/hooks/useRequestSequence.ts');
  let renders = 0;
  let sequence;
  function Probe() {
    const { isPhone } = useCommonStore(['isPhone']);
    sequence = useRequestSequence();
    renders++;
    return React.createElement('span', null, String(isPhone));
  }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(Probe)));
    const initial = renders;
    await act(async () => {
      stores.useTabsStore.setState({ tabs: [{ key: '/new' }] });
      stores.useMenuStore.setState({ openKeys: ['/system'] });
    });
    assert.equal(renders, initial);
    await act(async () => stores.useMenuStore.setState({ isPhone: true }));
    assert.equal(document.querySelector('span').textContent, 'true');
    const old = sequence.begin();
    const latest = sequence.begin();
    assert.equal(old(), false);
    assert.equal(latest(), true);
    sequence.invalidate();
    assert.equal(latest(), false);
    const beforeUnmount = sequence.begin();
    await act(async () => root.unmount());
    assert.equal(beforeUnmount(), false);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
