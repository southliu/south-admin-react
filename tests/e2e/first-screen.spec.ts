import { test, expect } from '@playwright/test';

test('首屏使用图标子集，图表慢加载不阻塞统计，弹窗首次点击才下载', async ({ page }) => {
  const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
  const permissions = ['/dashboard'];
  const requests: string[] = [];
  const charts = Promise.withResolvers<void>();
  const search = Promise.withResolvers<void>();
  const password = Promise.withResolvers<void>();
  page.on('request', (request) => requests.push(new URL(request.url()).pathname));
  await page.route(/\/src\/pages\/dashboard\/components\/(Line|Bar)\.tsx/, async (route) => {
    await charts.promise;
    await route.continue();
  });
  await page.route('**/src/components/GlobalSearch/components/SearchModal.tsx*', async (route) => {
    await search.promise;
    await route.continue();
  });
  await page.route('**/src/layouts/components/UpdatePassword.tsx*', async (route) => {
    await password.promise;
    await route.continue();
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user, permissions };
    else if (path.endsWith('/menu/list'))
      data = [
        { key: '/dashboard', label: '仪表盘', rule: '/dashboard', icon: 'la:tachometer-alt' },
      ];
    await route.fulfill({ json: { code: 200, data } });
  });

  try {
    await page.goto('/login');
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(requests.filter((path) => /\/pages\/(forget\/|404\.)/.test(path))).toEqual([]);
    expect(requests.filter((path) => /^\/icons\//.test(path))).toEqual([]);
    await page.locator('input[autocomplete="username"]').fill('tester');
    await page.locator('input[type="password"]').fill('Testpass1');
    await page.getByRole('button', { name: /登.*录/ }).click();

    const content = page.locator('#layout-content');
    const loading = content.getByRole('status', { name: '加载中' });
    await expect(content.getByText('用户数', { exact: true })).toBeVisible();
    await expect(loading).toHaveCount(2);
    await expect(loading.first()).toHaveCSS('height', '550px');
    await expect(loading.first().locator('.ant-spin-spinning')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    expect(requests.filter((path) => /SearchModal\.tsx|UpdatePassword\.tsx/.test(path))).toEqual(
      [],
    );
    charts.resolve();
    await expect(page.locator('canvas')).toHaveCount(2);
    await expect(loading).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    expect(requests.filter((path) => /^\/icons\//.test(path))).toEqual([]);

    await page.getByRole('banner').getByRole('button', { name: '搜索', exact: true }).click();
    await expect.poll(() => requests.some((path) => path.includes('/SearchModal.tsx'))).toBe(true);
    await expect(page.locator('.ant-spin-fullscreen')).toBeVisible();
    search.resolve();
    const searchInput = page.getByRole('dialog').getByRole('textbox');
    await expect(searchInput).toBeFocused();
    await searchInput.fill('仪表盘');
    await expect(page.getByRole('dialog').getByText('仪表盘', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('banner').getByRole('button', { name: '搜索', exact: true }).click();
    await expect(searchInput).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('banner').getByText('测试用户', { exact: true }).hover();
    await page.getByRole('menuitem', { name: '修改密码' }).click();
    await expect
      .poll(() => requests.some((path) => path.includes('/UpdatePassword.tsx')))
      .toBe(true);
    await expect(page.locator('.ant-spin-fullscreen')).toBeVisible();
    password.resolve();
    await expect(page.getByRole('dialog', { name: '修改密码' })).toBeVisible();
    await page.getByRole('dialog').locator('input[type="password"]').first()
.fill('Testpass1');
    const strengthBars = page.getByRole('dialog').locator('.h-5px');
    await expect(strengthBars).toHaveCount(5);
    await page.getByRole('dialog').locator('input[type="password"]').first()
.fill('');
    await expect(strengthBars).toHaveCount(0);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /取.*消/ })
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('banner').getByText('测试用户', { exact: true }).hover();
    await page.getByRole('menuitem', { name: '修改密码' }).click();
    await expect(page.getByRole('dialog').locator('input[type="password"]').first()).toHaveValue(
      '',
    );
  } finally {
    charts.resolve();
    search.resolve();
    password.resolve();
  }
});

test('重置密码页面延迟下载时显示加载动画', async ({ page }) => {
  const forget = Promise.withResolvers<void>();
  await page.route('**/src/pages/forget/index.tsx*', async (route) => {
    await forget.promise;
    await route.continue();
  });
  try {
    await page.goto('/login');
    await page.getByText('忘记密码?', { exact: true }).click();
    await expect(page.getByRole('status', { name: '加载中' })).toBeVisible();
    forget.resolve();
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expect(page.getByRole('status', { name: '加载中' })).toHaveCount(0);
  } finally {
    forget.resolve();
  }
});
