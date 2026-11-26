import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

async function openUsers(page: Page) {
  const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
  const permissions = ['/dashboard', '/authority/user', '/authority/role'];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user, permissions };
    else if (path.endsWith('/menu/list'))
      data = [
        { key: '/system/user', label: '用户管理', rule: '/authority/user' },
        { key: '/dashboard', label: '仪表盘', rule: '/dashboard' },
        { key: '/system/role', label: '角色管理', rule: '/authority/role' },
      ].map((item) => ({
        ...item,
        titleEn: 'Menu title',
        parentId: 0,
        permissionId: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }));
    else if (path.endsWith('/user/page')) data = { items: [user], total: 1 };
    else if (path.endsWith('/role/page')) data = { items: [{ id: 1, name: '管理员' }], total: 1 };
    else if (path.endsWith('/role/list')) data = [];
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto('/login');
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();
  await expect(page.locator('.ant-table-tbody').getByText('tester', { exact: true })).toBeVisible();
}

test('切换标签恢复最新查询参数，刷新可完成并再次执行', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/does not recognize|Unknown event handler|not a valid prop/.test(message.text()))
      warnings.push(message.text());
  });
  await openUsers(page);
  const email = page.getByRole('textbox', { name: '邮箱 :' });
  await email.fill('query+tag@example.com');
  await page
    .locator('#searches')
    .getByRole('button', { name: /搜.*索/ })
    .click();
  await expect(page).toHaveURL(/email=query%2Btag%40example.com/);
  await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(2);
  await page.getByRole('tab', { name: '用户管理', exact: true }).click();
  await expect(page).toHaveURL(/email=query%2Btag%40example.com/);
  await expect(email).toHaveValue('query+tag@example.com');

  const refresh = page.locator('.ant-tabs-extra-content .iconify--ant-design').first();
  await refresh.click();
  await expect(page.getByText('刷新成功', { exact: true })).toBeVisible();
  await expect(refresh).not.toHaveClass(/animate-spin/);
  await page.waitForTimeout(1500);
  await refresh.click();
  await expect(refresh).toHaveClass(/animate-spin/);
  await expect(page.getByText('刷新成功', { exact: true })).toBeVisible();
  await expect(refresh).not.toHaveClass(/animate-spin/);
  expect(warnings).toEqual([]);
  await expect(
    page.locator(
      '#layout-menu [parentid], #layout-menu [titleen], #layout-menu [permissionid], #layout-menu [createdat], #layout-menu [updatedat]',
    ),
  ).toHaveCount(0);
});

for (const direction of ['关闭左侧', '关闭右侧']) {
  test(`${direction}保留其他标签内未提交的输入`, async ({ page }) => {
    await openUsers(page);
    const email = page.getByRole('textbox', { name: '邮箱 :' });
    await email.fill('user-draft@example.com');
    await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(2);
    await page.getByRole('menuitem', { name: '角色管理', exact: true }).click();
    const roleName = page.getByRole('textbox', { name: '名称 :' });
    await roleName.fill('role-draft');
    await page.getByRole('tab', { name: '仪表盘', exact: true }).click({ button: 'right' });
    const closeAction = page.getByRole('menuitem', { name: new RegExp(`${direction}$`) });
    await expect(closeAction).toBeVisible();
    await closeAction.click();
    const removed = direction === '关闭左侧' ? '用户管理' : '角色管理';
    const retained = direction === '关闭左侧' ? '角色管理' : '用户管理';
    await expect(page.getByRole('tab', { name: removed, exact: true })).toHaveCount(0);
    await page.getByRole('tab', { name: retained, exact: true }).click();
    if (direction === '关闭左侧') await expect(roleName).toHaveValue('role-draft');
    else await expect(email).toHaveValue('user-draft@example.com');
  });
}

test('关闭非当前标签保持当前位置，关闭当前标签恢复相邻标签查询', async ({ page }) => {
  await openUsers(page);
  const email = page.getByRole('textbox', { name: '邮箱 :' });
  await email.fill('close+tag@example.com');
  await page
    .locator('#searches')
    .getByRole('button', { name: /搜.*索/ })
    .click();
  await expect(page).toHaveURL(/email=close%2Btag%40example.com/);
  await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(2);
  await page.getByRole('menuitem', { name: '角色管理', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '名称 :' })).toBeVisible();
  await page.getByRole('tab', { name: '仪表盘', exact: true }).click();
  await page.getByRole('tab', { name: '角色管理', exact: true }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /关闭标签$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('tab', { name: '角色管理', exact: true })).toHaveCount(0);
  await page
    .locator('.ant-tabs-tab')
    .filter({ has: page.getByRole('tab', { name: '仪表盘', exact: true }) })
    .getByRole('button', { name: 'remove' })
    .click();
  await expect(page).toHaveURL(/email=close%2Btag%40example.com/);
  await expect(email).toHaveValue('close+tag@example.com');
});

test('关闭第一个当前标签进入右侧标签，关闭其他标签保留查询', async ({ page }) => {
  await openUsers(page);
  await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(2);
  await page.getByRole('tab', { name: '用户管理', exact: true }).click();
  await page.getByRole('textbox', { name: '邮箱 :' }).fill('kept@example.com');
  await page
    .locator('#searches')
    .getByRole('button', { name: /搜.*索/ })
    .click();
  await expect(page).toHaveURL(/email=kept%40example.com/);
  await page.getByRole('tab', { name: '用户管理', exact: true }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /关闭其他$/ }).click();
  await expect(page).toHaveURL(/email=kept%40example.com/);
  await expect(page.getByRole('tab', { name: '仪表盘', exact: true })).toHaveCount(0);
  await page.getByRole('menuitem', { name: '仪表盘', exact: true }).click();
  await page.getByRole('tab', { name: '用户管理', exact: true }).click();
  await page
    .locator('.ant-tabs-tab')
    .filter({ has: page.getByRole('tab', { name: '用户管理', exact: true }) })
    .getByRole('button', { name: 'remove' })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('tab', { name: '用户管理', exact: true })).toHaveCount(0);
});
