import { createLoader } from './helpers/load-module.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('构建代码和版本文件使用同一个版本', () => {
  const plugin = createLoader()('build/plugins/version.ts').versionUpdatePlugin();
  const defined = JSON.parse(plugin.config().define['import.meta.env.VITE_BUILD_VERSION']);
  let emitted;
  plugin.generateBundle.call({
    emitFile: (asset) => {
      emitted = asset;
    },
  });
  assert.equal(emitted.fileName, 'version.json');
  assert.equal(JSON.parse(emitted.source).version, defined);
});

test('旧构建首次打开即刷新，保留地址且同一目标版本不循环跳转', async () => {
  const originalWindow = globalThis.window;
  const originalTimeout = globalThis.setTimeout;
  const timers = [];
  let navigated;
  globalThis.window = {
    location: {
      href: 'https://example.test/?tenant=one#/login?redirect=%2Fdashboard',
      replace: (url) => {
        navigated = url;
      },
    },
  };
  globalThis.setTimeout = (callback) => timers.push(callback);
  try {
    const page = () =>
      createLoader(
        {
          '@/utils/config': {},
          axios: {
            get: async (url) => {
              assert.equal(url, '/console/version.json');
              return { data: { version: 'v2' } };
            },
          },
        },
        (source) =>
          source
            .replaceAll('import.meta.env.MODE', "'production'")
            .replaceAll('import.meta.env.VITE_BUILD_VERSION', "'v1'")
            .replaceAll('import.meta.env.BASE_URL', "'/console/'"),
      )('src/layouts/utils/helper.ts');
    await page().versionCheck((key) => key, { info() {} });
    assert.equal(timers.length, 1);
    timers[0]();
    const target = new URL(navigated);
    assert.equal(target.searchParams.get('tenant'), 'one');
    assert.equal(target.searchParams.get('__app_version'), 'v2');
    assert.equal(target.hash, '#/login?redirect=%2Fdashboard');
    window.location.href = navigated;
    await page().versionCheck((key) => key, { info() {} });
    assert.equal(timers.length, 1);
  } finally {
    globalThis.window = originalWindow;
    globalThis.setTimeout = originalTimeout;
  }
});
