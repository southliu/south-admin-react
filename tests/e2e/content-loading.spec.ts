import { test, expect } from '@playwright/test';

test('内容模块慢加载时显示动画，完成后恢复页面并保留标签缓存', async ({ page }) => {
  const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
  const permissions = ['/dashboard', '/authority/user'];
  const menus = [
    { key: '/dashboard', label: '仪表盘', labelEn: 'Dashboard', rule: '/dashboard' },
    { key: '/system/user', label: '用户管理', labelEn: 'Users', rule: '/authority/user' },
  ];
  const dashboard = Promise.withResolvers<void>();
  const users = Promise.withResolvers<void>();
  await page.route('**/src/pages/dashboard/index.tsx*', async (route) => {
    await dashboard.promise;
    await route.continue();
  });
  await page.route('**/src/pages/system/user/index.tsx*', async (route) => {
    await users.promise;
    await route.continue();
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user, permissions };
    else if (path.endsWith('/menu/list')) data = menus;
    else if (path.endsWith('/user/page')) data = { items: [user], total: 1 };
    else if (path.endsWith('/role/list')) data = [];
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto('/#/login');
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();

  const loading = page.locator('#layout-content').getByRole('status', { name: '加载中' });
  await expect(loading).toBeVisible();
  await expect(loading.locator('.ant-spin-spinning')).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
  await page.screenshot({ path: '.codex-temp/evidence/content-loading.png', fullPage: true });
  dashboard.resolve();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(loading).toHaveCount(0);

  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click();
  await expect(loading).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
  users.resolve();
  await expect(page.locator('.ant-table-tbody').getByText('tester', { exact: true })).toBeVisible();
  await expect(loading).toHaveCount(0);
  const email = page.getByRole('textbox', { name: '邮箱 :' });
  await email.fill('saved@example.com');

  await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(loading).toHaveCount(0);
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click();
  await expect(email).toHaveValue('saved@example.com');
  await expect(loading).toHaveCount(0);
});
