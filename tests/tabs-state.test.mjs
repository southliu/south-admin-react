import { createLoader } from './helpers/load-module.mjs';
import { shallow } from 'zustand/shallow';
import assert from 'node:assert/strict';
import test from 'node:test';

function createStore() {
  return createLoader({
    'zustand/middleware': {
      devtools: (config) => config,
      persist: (config) => config,
      createJSONStorage: () => undefined,
    },
  })('src/stores/tabs.ts').useTabsStore;
}

function frozenTabs() {
  return Object.freeze(
    ['/a', '/b', '/c'].map((key) =>
      Object.freeze({ key, label: key, labelZh: key, labelEn: `EN${key}`, nav: [] }),
    ),
  );
}

test('标签参数、语言和新增操作更新引用，不修改先前快照或传入对象', () => {
  const store = createStore();
  const original = frozenTabs();
  store.setState({ tabs: original });
  store.getState().setTabs('/b', '?email=a%2Bb%40example.com');
  const updated = store.getState().tabs;
  assert.equal(original[1].urlParams, undefined);
  assert.equal(updated[1].urlParams, '?email=a%2Bb%40example.com');
  assert.equal(shallow({ tabs: original }, { tabs: updated }), false);
  assert.equal(updated[0], original[0]);
  store.getState().switchTabsLang('en');
  assert.equal(store.getState().tabs[1].label, 'EN/b');
  assert.equal(updated[1].label, '/b');

  const payload = Object.freeze({ key: '/d', label: '/d', nav: [] });
  store.getState().addTabs(payload);
  assert.equal(store.getState().tabs.length, 4);
  assert.equal(store.getState().tabs[0].closable, true);
  const beforeDuplicate = store.getState().tabs;
  store.getState().addTabs(payload);
  assert.equal(store.getState().tabs, beforeDuplicate);

  store.getState().sortTabs(Object.freeze([payload]));
  assert.equal(store.getState().tabs[0].closable, false);
  assert.equal(payload.closable, undefined);
});

test('关闭标签只销毁被移除页面的缓存，保留页面快照不被修改', () => {
  for (const [action, remaining, destroyed, active] of [
    ['closeTabs', ['/a', '/c'], ['/b'], '/c'],
    ['closeTabGoNext', ['/a', '/c'], ['/b'], '/next'],
    ['closeLeft', ['/b', '/c'], ['/a'], '/b'],
    ['closeRight', ['/a', '/b'], ['/c'], '/b'],
    ['closeOther', ['/b'], ['/a', '/c'], '/b'],
  ]) {
    const store = createStore();
    const original = frozenTabs();
    const removed = [];
    store.setState({ tabs: original, activeKey: '/b' });
    const destroy = (key) => removed.push(key);
    if (action === 'closeTabGoNext')
      store.getState()[action]({ key: '/b', nextPath: '/next', dropScope: destroy });
    else store.getState()[action]('/b', destroy);
    const result = store.getState();
    assert.deepEqual(
      result.tabs.map((tab) => tab.key),
      remaining,
      action,
    );
    assert.deepEqual(removed, destroyed, action);
    assert.equal(result.activeKey, active, action);
    assert.equal(result.tabs[0].closable, remaining.length > 1, action);
    assert.equal(original[0].closable, undefined, action);
    assert.deepEqual(
      original.map((tab) => tab.key),
      ['/a', '/b', '/c'],
      action,
    );
  }
});

test('关闭不存在的标签不修改当前状态，也不清理其他页面缓存', () => {
  const store = createStore();
  const tabs = frozenTabs();
  store.setState({ tabs, activeKey: '/b' });
  for (const action of ['closeTabs', 'closeLeft', 'closeRight', 'closeOther']) {
    store.getState()[action]('/missing', () => assert.fail(action));
    assert.equal(store.getState().tabs, tabs);
    assert.equal(store.getState().activeKey, '/b');
  }
});

test('标签关闭只在关闭当前页面时跳转，并保留目标页完整查询参数', () => {
  const tabs = [
    { key: '/a', urlParams: '?email=a%2Bb%40example.com' },
    { key: '/b', urlParams: '?page=2' },
    { key: '/c' },
  ];
  function run(type, key, current = '/b') {
    const navigations = [];
    const closed = [];
    const selected = [];
    const { useDropdownMenu } = createLoader({
      '@ant-design/icons': {},
      'react-router-dom': {
        useLocation: () => ({ pathname: current }),
        useNavigate: () => (path) => navigations.push(path),
      },
      '@/hooks/useCommonStore': { useCommonStore: () => ({ tabs }) },
      '@/stores/public': { usePublicStore: (selector) => selector({ aliveRef: { current: {} } }) },
      'react-i18next': { useTranslation: () => ({ t: (value) => value }) },
      'zustand/shallow': { useShallow: (selector) => selector },
      '@/stores': {
        useTabsStore: (selector) =>
          selector({
            closeTabs: (value) => closed.push(value),
            closeLeft: (value) => closed.push(value),
            closeRight: (value) => closed.push(value),
            closeOther: (value) => closed.push(value),
            setActiveKey: (value) => selected.push(value),
          }),
      },
    })('src/layouts/hooks/useDropdownMenu.tsx');
    const [, onClick] = useDropdownMenu({ activeKey: current, handleRefresh: () => {} });
    onClick(type, key);
    return { navigations, closed, selected };
  }
  assert.deepEqual(run('close_current', '/c'), { navigations: [], closed: ['/c'], selected: [] });
  assert.deepEqual(run('close_current', '/b'), {
    navigations: ['/a?email=a%2Bb%40example.com'],
    closed: ['/b'],
    selected: ['/a'],
  });
  assert.deepEqual(run('close_current', '/a', '/a'), {
    navigations: ['/b?page=2'],
    closed: ['/a'],
    selected: ['/b'],
  });
  for (const type of ['close_left', 'close_right', 'close_other'])
    assert.deepEqual(run(type, '/b').navigations, ['/b?page=2']);
});
