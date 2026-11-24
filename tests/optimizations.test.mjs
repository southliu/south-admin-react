import { createLoader } from './helpers/load-module.mjs';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import test from 'node:test';

const versionSource = (source, mode = 'production', buildVersion = 'v1') =>
  source
    .replaceAll('import.meta.env.MODE', JSON.stringify(mode))
    .replaceAll('import.meta.env.VITE_BUILD_VERSION', JSON.stringify(buildVersion))
    .replaceAll('import.meta.env.BASE_URL', JSON.stringify('/'));

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

test('当前构建发现新版本，在 1～3 秒自动刷新且只安排一次', async () => {
  const original = new Map();
  const random = Math.random;
  const timers = [];
  let reloads = 0;
  for (const [key, value] of Object.entries({
    window: {
      location: { href: 'https://example.test/?tenant=one#/dashboard', replace: () => reloads++ },
    },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    for (const [sample, seconds] of [
      [0, 1],
      [0.5, 2],
      [0.999999, 3],
    ]) {
      Math.random = () => sample;
      timers.length = 0;
      reloads = 0;
      let version = 'v1';
      const notices = [];
      const { versionCheck } = createLoader(
        {
          '@/utils/config': { LANG: 'lang' },
          axios: { get: async () => ({ data: { version } }) },
        },
        versionSource,
      )('src/layouts/utils/helper.ts');
      const translate = (key, values) => `${key}:${values.seconds}`;
      const message = { info: (options) => notices.push(options) };
      await Promise.all([versionCheck(translate, message), versionCheck(translate, message)]);
      assert.equal(notices.length, 0);
      assert.equal(timers.length, 0);
      version = 'v2';
      await Promise.all([versionCheck(translate, message), versionCheck(translate, message)]);
      await versionCheck(translate, message);
      assert.equal(notices.length, 1);
      assert.equal(notices[0].content, `public.reloadPageMsg:${seconds}`);
      assert.equal(notices[0].duration, seconds);
      assert.equal(reloads, 0);
      assert.equal(timers.length, 1);
      assert.equal(timers[0].delay, seconds * 1000);
      timers[0].callback();
      assert.equal(reloads, 1);
    }
  } finally {
    Math.random = random;
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('停留同一页面也会检测更新，慢请求不重叠，停止监控后清理定时器', async () => {
  const original = new Map();
  const timers = [];
  const notices = [];
  let tick;
  let complete;
  let requests = 0;
  let reloads = 0;
  let cleared = 0;
  for (const [key, value] of Object.entries({
    window: {
      location: { href: 'https://example.test/?tenant=one#/dashboard', replace: () => reloads++ },
    },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    setInterval: (callback, delay) => {
      assert.equal(delay, 2000);
      tick = callback;
      return 42;
    },
    clearInterval: (id) => {
      assert.equal(id, 42);
      cleared++;
    },
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    const { startVersionCheck } = createLoader(
      {
        '@/utils/config': { LANG: 'lang' },
        axios: {
          get: () => {
            requests++;
            return new Promise((resolve) => {
              complete = resolve;
            });
          },
        },
      },
      versionSource,
    )('src/layouts/utils/helper.ts');
    const stop = startVersionCheck((key) => key, { info: (notice) => notices.push(notice) });
    assert.equal(requests, 1);
    tick();
    assert.equal(requests, 1);
    complete({ data: { version: 'v1' } });
    await Promise.resolve();
    tick();
    assert.equal(requests, 2);
    complete({ data: { version: 'v2' } });
    await Promise.resolve();
    assert.equal(notices.length, 1);
    assert.equal(timers.length, 1);
    assert.ok(timers[0].delay >= 1000 && timers[0].delay <= 3000);
    tick();
    assert.equal(requests, 2);
    timers[0].callback();
    assert.equal(reloads, 1);
    stop();
    assert.equal(cleared, 1);
  } finally {
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('新标签忽略旧缓存，旧标签仍能独立发现更新，刷新后的页面不会再次刷新', async () => {
  const original = new Map();
  const timers = [];
  const notices = [];
  const cache = new Map([['admin_version', 'legacy-version']]);
  let version = 'v1';
  let reloads = 0;
  for (const [key, value] of Object.entries({
    localStorage: {
      getItem: (key) => cache.get(key),
      setItem: (key, value) => cache.set(key, value),
    },
    window: {
      location: { href: 'https://example.test/?tenant=one#/dashboard', replace: () => reloads++ },
    },
    setTimeout: (callback) => timers.push(callback),
  })) {
    original.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try {
    const newPage = () =>
      createLoader(
        {
          '@/utils/config': { LANG: 'lang', VERSION: 'admin_version' },
          axios: { get: async () => ({ data: { version } }) },
        },
        (source) => versionSource(source, 'production', version),
      )('src/layouts/utils/helper.ts').versionCheck;
    const message = { info: (notice) => notices.push(notice) };
    const oldPage = newPage();
    await oldPage((key) => key, message);
    assert.equal(timers.length, 0);
    version = 'v2';
    const freshPage = newPage();
    await freshPage((key) => key, message);
    assert.equal(timers.length, 0);
    assert.equal(notices.length, 0);
    await oldPage((key) => key, message);
    assert.equal(timers.length, 1);
    await freshPage((key) => key, message);
    assert.equal(timers.length, 1);
    timers[0]();
    assert.equal(reloads, 1);
    await newPage()((key) => key, message);
    assert.equal(timers.length, 1);
    assert.equal(notices.length, 1);
  } finally {
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('首次检查无效后仍保持构建版本，开发环境不检查版本', async () => {
  let version;
  let requests = 0;
  const load = (mode) =>
    createLoader(
      {
        '@/utils/config': { LANG: 'lang' },
        axios: {
          get: async () => {
            requests++;
            return { data: { version } };
          },
        },
      },
      (source) => versionSource(source, mode),
    )('src/layouts/utils/helper.ts').versionCheck;
  const message = { info: () => assert.fail('不应出现更新提示') };
  const check = load('production');
  await check((key) => key, message);
  version = 'v1';
  await check((key) => key, message);
  await check((key) => key, message);
  assert.equal(requests, 3);
  await load('development')((key) => key, message);
  assert.equal(requests, 3);
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
