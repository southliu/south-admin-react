import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { preview } from 'vite';
import assert from 'node:assert/strict';

// 先 pnpm build，再 node tests/version-refresh.browser.mjs；不访问实际业务接口。
const { version } = JSON.parse(readFileSync('dist/version.json', 'utf8'));
const server = await preview({
  configFile: false,
  preview: { host: '127.0.0.1', port: 5197, strictPort: true, open: false },
});
/**
 * 读取当前路由中的版本参数，兼容两种路由模式
 * @param url - 当前页面地址
 */
function getVersion(url) {
  const route = url.hash.startsWith('#/') ? new URL(url.hash.slice(1), url.origin) : url;
  return route.searchParams.get('__app_version');
}
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  for (const hashRouter of [false, true]) {
    const page = await browser.newPage({ locale: 'zh-CN' });
    let documents = 0;
    let oldChunks = 0;
    const checks = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'document') documents++;
    });
    await page.route('**/assets/js/*.js', async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      const isOldPage = getVersion(new URL(page.url())) !== version;
      if (isOldPage && body.includes(version)) oldChunks++;
      await route.fulfill({
        response,
        body: isOldPage ? body.replaceAll(version, 'cached-old-build') : body,
      });
    });
    await page.route('**/version.json?*', async (route) => {
      if (getVersion(new URL(page.url())) === version) checks.push(Date.now());
      await route.fulfill({ json: { version } });
    });
    await page.goto(
      hashRouter
        ? 'http://127.0.0.1:5197/login?tenant=one&__app_version=legacy#/login?redirect=%2Fconfig%2Frule'
        : 'http://127.0.0.1:5197/login?tenant=one&redirect=%2Fconfig%2Frule',
    );
    await page.waitForURL((url) => getVersion(url) === version, {
      timeout: 15000,
    });
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    assert.ok(oldChunks > 0, '必须实际运行旧构建版本的代码');
    assert.equal(new URL(page.url()).searchParams.get('tenant'), 'one');
    const target = new URL(page.url());
    const route = hashRouter ? new URL(target.hash.slice(1), target.origin) : target;
    assert.equal(target.searchParams.has('__app_version'), !hashRouter);
    assert.equal(route.searchParams.get('redirect'), '/config/rule');
    await expect.poll(() => checks.length, { timeout: 10000 }).toBeGreaterThanOrEqual(3);
    assert.equal(documents, 2, '旧页应只自动导航一次');
    assert.ok(checks[2] - checks[1] >= 1700, '轮询不能早于约 2 秒');
    mkdirSync('.codex-temp/evidence', { recursive: true });
    await page.screenshot({
      path: `.codex-temp/evidence/version-refresh-${hashRouter ? 'hash' : 'browser'}.png`,
    });
    console.log(
      JSON.stringify({
        hashRouter,
        passed: true,
        oldChunks,
        documents,
        pollIntervalMs: checks[2] - checks[1],
      }),
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
