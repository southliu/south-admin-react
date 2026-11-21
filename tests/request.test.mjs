import { createLoader } from './helpers/load-module.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';

const tick = () => new Promise(setImmediate);

test('未登录时的 HTTP/业务 401 显示后端错误或国际化兜底，不触发过期跳转', async () => {
  const messages = [];
  let redirects = 0;
  let removals = 0;
  const { creteRequest } = createLoader({
    '@south/utils': { getLocalInfo: () => '', removeLocalInfo: () => removals++ },
    '@south/message': { message: { error: ({ content }) => messages.push(content) } },
  })('packages/request/src/index.ts');
  const client = creteRequest('/api', 'token', {
    getNetworkErrorMessage: () => '网络异常，请稍后重试',
    onAuthExpired: () => redirects++,
  });
  for (const http of [true, false]) {
    for (const message of ['账号或密码错误', undefined]) {
      client.instance.defaults.adapter = async (config) => {
        const response = {
          status: http ? 401 : 200,
          headers: {},
          config,
          data: { code: 401, message },
        };
        if (http)
          throw new axios.AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, response);
        return response;
      };
      if (http) await assert.rejects(client.post('/login'));
      else await client.post('/login');
      assert.equal(messages.at(-1), message || '网络异常，请稍后重试');
    }
  }
  assert.equal(redirects, 0);
  assert.equal(removals, 0);
});

test('优先展示后端 message/detail，没有有效内容时使用当前语言的网络异常兜底', async () => {
  const messages = [];
  const load = createLoader({
    '@south/utils': { getLocalInfo: () => '', removeLocalInfo: () => {} },
    '@south/message': { message: { error: (payload) => messages.push(payload.content) } },
  });
  const { creteRequest, resolveErrorMessage } = load('packages/request/src/index.ts');
  const zh = load('src/locales/zh/public.ts').default.networkError;
  const en = load('src/locales/en/public.ts').default.networkError;
  assert.equal(zh, '网络异常，请稍后重试');
  let fallback = zh;
  const client = creteRequest('/api', 'token', { getNetworkErrorMessage: () => fallback });
  for (const [body, expected] of [
    [{ code: 500, message: '后端错误', detail: '后端详情' }, '后端错误'],
    [{ code: 500, message: '  ', detail: '后端详情' }, '后端详情'],
    [{ code: 500 }, zh],
    [{ code: 500, message: {}, detail: '' }, zh],
  ]) {
    client.instance.defaults.adapter = async (config) => ({
      status: 200,
      headers: {},
      config,
      data: body,
    });
    await client.get('/error');
    assert.equal(messages.at(-1), expected);
    assert.equal(resolveErrorMessage(body, zh), expected);
  }
  client.instance.defaults.adapter = async (config) => {
    throw new axios.AxiosError('browser network failure', 'ERR_NETWORK', config);
  };
  fallback = en;
  await assert.rejects(client.get('/network'));
  assert.equal(messages.at(-1), en);
  client.instance.defaults.adapter = async (config) => {
    const response = { status: 500, headers: {}, config, data: { detail: '服务暂时不可用' } };
    throw new axios.AxiosError('http error', 'ERR_BAD_RESPONSE', config, undefined, response);
  };
  await assert.rejects(client.get('/http-error'));
  assert.equal(messages.at(-1), '服务暂时不可用');
});
test('连续同请求只保留最新请求，旧取消响应不删除新控制器', async () => {
  const { default: Request } = createLoader()('packages/request/src/request.ts');
  const pending = [];
  const client = new Request({
    adapter: (config) =>
      new Promise((resolve, reject) => {
        pending.push({ config, resolve });
        config.signal.addEventListener('abort', () =>
          reject(new axios.CanceledError('cancelled', config)),
        );
      }),
  });
  const requests = [];
  for (let i = 0; i < 3; i++) {
    requests.push(client.get('/same').catch((error) => error));
    await tick();
    assert.equal(client.abortControllerMap.size, 1);
  }
  assert.deepEqual(
    pending.map(({ config }) => config.signal.aborted),
    [true, true, false],
  );
  const last = pending[2];
  last.resolve({
    status: 200,
    headers: {},
    config: last.config,
    data: { code: 200, data: ['latest'] },
  });
  const results = await Promise.all(requests);
  assert.ok(axios.isCancel(results[0]));
  assert.ok(axios.isCancel(results[1]));
  assert.deepEqual(results[2].data, ['latest']);
  assert.equal(client.abortControllerMap.size, 0);
});

test('网络失败保留 rejection 并释放控制器', async () => {
  const { default: Request } = createLoader()('packages/request/src/request.ts');
  const client = new Request({
    adapter: async (config) => {
      throw new axios.AxiosError('offline', 'ERR_NETWORK', config);
    },
  });
  await assert.rejects(client.get('/failure'), /offline/);
  assert.equal(client.abortControllerMap.size, 0);
});

test('相同地址的不同 JSON 提交不会互相取消', async () => {
  const { default: Request } = createLoader()('packages/request/src/request.ts');
  const pending = [];
  const client = new Request({
    adapter: (config) => new Promise((resolve) => pending.push({ config, resolve })),
  });
  const requests = [client.post('/submit', { id: 1 }), client.post('/submit', { id: 2 })];
  await tick();
  assert.equal(client.abortControllerMap.size, 2);
  assert.deepEqual(
    pending.map(({ config }) => config.signal.aborted),
    [false, false],
  );
  for (const { config, resolve } of pending)
    resolve({ status: 200, headers: {}, config, data: { code: 200 } });
  await Promise.all(requests);
  assert.equal(client.abortControllerMap.size, 0);
});

test('外部 AbortSignal 和按 URL 取消均生效', async () => {
  const { default: Request } = createLoader()('packages/request/src/request.ts');
  const client = new Request({
    adapter: (config) =>
      new Promise((_, reject) => {
        config.signal.addEventListener('abort', () =>
          reject(new axios.CanceledError('cancelled', config)),
        );
      }),
  });
  const signal = new AbortController();
  const first = client.get('/external', { signal: signal.signal }).catch((error) => error);
  await tick();
  signal.abort();
  assert.ok(axios.isCancel(await first));
  const second = client.get('/by-url', { params: { page: 1 } }).catch((error) => error);
  await tick();
  client.cancelRequest('/by-url');
  assert.ok(axios.isCancel(await second));
  assert.equal(client.abortControllerMap.size, 0);
});

test('HTTP 401 与业务 401 均清理会话一次，旧账号响应不清除新账号', async () => {
  for (const http of [true, false]) {
    const storage = new Map([['token', 'first']]);
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    globalThis.localStorage = {
      getItem: (key) => storage.get(key),
      setItem: (key, value) => storage.set(key, value),
    };
    let redirects = 0;
    const { creteRequest } = createLoader({
      '@south/utils': {
        getLocalInfo: (key) => storage.get(key),
        removeLocalInfo: (key) => storage.delete(key),
      },
      '@south/message': { message: { error: () => {} } },
    })('packages/request/src/index.ts');
    const client = creteRequest('/api', 'token', { onAuthExpired: () => redirects++ });
    client.instance.defaults.adapter = async (config) => {
      const response = {
        status: http ? 401 : 200,
        headers: {},
        config,
        data: { code: 401, message: '登录状态已失效' },
      };
      if (http)
        throw new axios.AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, response);
      return response;
    };
    try {
      await client.get('/auth').catch(() => {});
      assert.equal(redirects, 1);
      assert.equal(storage.has('token'), false);
      storage.set('token', 'second');
      client.instance.defaults.adapter = async (config) => {
        storage.set('token', 'third');
        return { status: 200, headers: {}, config, data: { code: 401 } };
      };
      await client.get('/stale');
      assert.equal(storage.get('token'), 'third');
      assert.equal(redirects, 1);
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else delete globalThis.localStorage;
    }
  }
});
