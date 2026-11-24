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
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
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
    const isOldPage = new URL(page.url()).searchParams.get('__app_version') !== version;
    if (isOldPage && body.includes(version)) oldChunks++;
    await route.fulfill({
      response,
      body: isOldPage ? body.replaceAll(version, 'cached-old-build') : body,
    });
  });
  await page.route('**/version.json?*', async (route) => {
    if (new URL(page.url()).searchParams.get('__app_version') === version) checks.push(Date.now());
    await route.fulfill({ json: { version } });
  });
  await page.goto('http://127.0.0.1:5197/?tenant=one#/login?redirect=%2Fdashboard');
  await page.waitForURL((url) => url.searchParams.get('__app_version') === version, {
    timeout: 15000,
  });
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  assert.ok(oldChunks > 0, '必须实际运行旧构建版本的代码');
  assert.equal(new URL(page.url()).searchParams.get('tenant'), 'one');
  assert.equal(new URL(page.url()).hash, '#/login?redirect=%2Fdashboard');
  await expect.poll(() => checks.length, { timeout: 10000 }).toBeGreaterThanOrEqual(3);
  assert.equal(documents, 2, '旧页应只自动导航一次');
  assert.ok(checks[2] - checks[1] >= 1700, '轮询不能早于约 2 秒');
  mkdirSync('.codex-temp/evidence', { recursive: true });
  await page.screenshot({ path: '.codex-temp/evidence/version-refresh-login.png' });
  console.log(
    JSON.stringify({ passed: true, oldChunks, documents, pollIntervalMs: checks[2] - checks[1] }),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
