import { createLoader } from './helpers/load-module.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';

test('菜单 API 直接返回请求，恢复逻辑保留后端错误消息', async () => {
  const errorResponse = { code: 500, message: '后端菜单临时异常' };
  const raw = Promise.resolve(errorResponse);
  const api = createLoader({ '@/utils/request': { request: { get: () => raw } } })(
    'src/servers/system/menu.ts',
  );
  assert.equal(api.getMenuList(), raw);
  for (const failure of [errorResponse, new Error('网络异常')]) {
    let calls = 0;
    const { loadMenuList } = createLoader({
      '@/servers/system/menu': {
        getMenuList: async () => {
          calls++;
          if (calls > 1) return { code: 200, data: [] };
          if (failure instanceof Error) throw failure;
          return failure;
        },
      },
    })('src/menus/utils/load.ts');
    assert.equal((await loadMenuList()).code, 200);
    assert.equal(calls, 2);
  }
  const failed = createLoader({ '@/servers/system/menu': { getMenuList: () => raw } })(
    'src/menus/utils/load.ts',
  );
  assert.equal(await failed.loadMenuList(), errorResponse);
});

test('菜单取消和认证失败不重试', async () => {
  for (const error of [
    new axios.CanceledError('cancelled'),
    new axios.AxiosError('unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, { status: 401 }),
  ]) {
    let calls = 0;
    const { loadMenuList } = createLoader({
      '@/servers/system/menu': {
        getMenuList: async () => {
          calls++;
          throw error;
        },
      },
    })('src/menus/utils/load.ts');
    await assert.rejects(loadMenuList(), (actual) => actual === error);
    assert.equal(calls, 1);
  }
});
