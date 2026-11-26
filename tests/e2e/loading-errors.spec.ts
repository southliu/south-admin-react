import { test, expect } from '@playwright/test';

test('模块下载失败展示错误页，由用户手动刷新后恢复', async ({ page }) => {
  let isBlocked = true;
  let navigations = 0;
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigations++;
  });
  await page.route('**/src/pages/forget/index.tsx*', (route) =>
    isBlocked ? route.abort() : route.continue(),
  );
  await page.route('**/api/**', (route) => route.fulfill({ json: { code: 200, data: {} } }));
  await page.goto('/login');
  await page.getByText('忘记密码?', { exact: true }).click();
  await expect(page.getByText('页面出现错误', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /刷新页面/ })).toBeVisible();
  expect(navigations).toBe(1);
  isBlocked = false;
  await page.getByRole('button', { name: /刷新页面/ }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(2);
  await expect(page.getByText('页面出现错误', { exact: true })).toHaveCount(0);
  expect(navigations).toBe(2);
});

test('错误页切换路由后恢复，首屏 loading 在应用挂载后才关闭', async ({ page }) => {
  await page.addInitScript(() => {
    const observations: boolean[] = [];
    Object.assign(window, { loadingObservations: observations });
    new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.target instanceof HTMLElement &&
          record.target.id === 'first' &&
          record.target.style.display === 'none'
        )
          observations.push(Boolean(document.getElementById('root')?.hasChildNodes()));
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.route('**/src/pages/404.tsx*', (route) => route.abort());
  await page.route('**/api/**', (route) => route.fulfill({ json: { code: 200, data: {} } }));
  await page.goto('/login');
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  const observations = await page.evaluate(() => Reflect.get(window, 'loadingObservations'));
  expect(observations.length).toBeGreaterThan(0);
  expect(observations.every(Boolean)).toBe(true);
  await page.evaluate(() => {
    window.history.pushState(null, '', '/missing-page');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByText('页面出现错误', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  await expect(page.getByText('页面出现错误', { exact: true })).toHaveCount(0);
});
