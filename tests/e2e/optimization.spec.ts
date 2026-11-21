import { test, expect } from '@playwright/test';

const permissions = [
  '/authority/user',
  '/authority/user/create',
  '/authority/user/update',
  '/authority/user/delete',
];
const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
const menus = [
  {
    id: 1,
    key: '/system',
    label: '系统管理',
    labelEn: 'System',
    icon: 'mdi:abacus',
    children: [
      { id: 2, key: '/system/user', label: '用户管理', labelEn: 'Users', rule: '/authority/user' },
    ],
  },
];

test('登录不预加载后台页面，菜单持续失败后可恢复并折叠', async ({ page }) => {
  let failLogin = true;
  let failMenu = true;
  let menuMessage = '临时失败';
  let menuDetail = '';
  let menuStatus = 200;
  let menuCalls = 0;
  let refreshCalls = 0;
  const loadedPages: string[] = [];
  const externalIcons: string[] = [];
  page.on('request', (request) => {
    if (/api\.(iconify\.design|simplesvg\.com|unisvg\.com)/.test(request.url()))
      externalIcons.push(request.url());
  });
  page.on('request', (request) => {
    if (request.url().includes('/src/pages/system/')) loadedPages.push(request.url());
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) {
      if (failLogin) {
        await route.fulfill({ status: 401, json: { detail: '账号或密码错误' } });
        return;
      }
      data = { token: 'test-token', user, permissions };
    } else if (path.endsWith('/menu/list')) {
      menuCalls++;
      await route.fulfill({
        status: failMenu ? menuStatus : 200,
        json: failMenu
          ? { code: 500, message: menuMessage, detail: menuDetail }
          : { code: 200, data: menus },
      });
      return;
    } else if (path.endsWith('/user/refreshPermissions')) {
      refreshCalls++;
      data = { user, permissions };
    } else if (path.endsWith('/user/page'))
      data = {
        items: [{ ...user, status: 1, email: 'test@example.com', phone: '13800000000' }],
        total: 1,
      };
    else if (path.endsWith('/role/list')) data = [{ id: 1, name: '管理员' }];
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  await page.waitForTimeout(800);
  expect(loadedPages).toEqual([]);
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();
  await expect(page.getByText('账号或密码错误', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /登.*录/ })).not.toHaveClass(/ant-btn-loading/);
  failLogin = false;
  await page.getByRole('button', { name: /登.*录/ }).click();
  await expect.poll(() => menuCalls).toBe(2);
  await expect(page.getByRole('button', { name: /登.*录/ })).not.toHaveClass(/ant-btn-loading/);
  await expect(page.getByText('临时失败', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = '/system/user';
  });
  await expect.poll(() => menuCalls, { timeout: 15000 }).toBe(4);
  await expect(page.getByRole('button', { name: '重新加载', exact: true })).toBeVisible();
  expect(refreshCalls).toBe(0);
  await expect(page.getByRole('button', { name: '收起菜单' })).toHaveCount(0);
  await expect(page.locator('.ant-result-title')).toHaveText('临时失败');
  menuMessage = '';
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(page.locator('.ant-result-title')).toHaveText('网络异常，请稍后重试');
  menuStatus = 500;
  menuDetail = '菜单服务暂时不可用';
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(page.locator('.ant-result-title')).toHaveText('菜单服务暂时不可用');
  const usersResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/user/page') && response.status() === 200,
  );
  failMenu = false;
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await usersResponse;
  await expect(page.getByRole('button', { name: '收起菜单' })).toBeVisible();
  await expect(page.locator('#layout-menu svg.iconify--mdi')).toBeVisible();
  expect(externalIcons).toEqual([]);
  await expect(page.locator('.ant-table-tbody').getByText('tester', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '收起菜单' }).click();
  await expect(page.getByRole('button', { name: '展开菜单' })).toBeVisible();
  await expect(page.locator('#layout-menu')).toHaveClass(/ant-menu-inline-collapsed/);
  await page.getByRole('button', { name: '展开菜单' }).click();
  await expect(page.locator('#layout-menu')).not.toHaveClass(/ant-menu-inline-collapsed/);
  await expect(
    page.locator('#layout-menu').getByRole('menuitem', { name: '用户管理', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: '.codex-temp/evidence/menu-restored.png', fullPage: true });
  await page.getByRole('button', { name: /新增/ }).first().click();
  const dialog = page.getByRole('dialog');
  const username = dialog.getByLabel('用户名', { exact: true });
  await expect(username).toHaveAttribute('maxlength', '100');
  await username.fill('a'.repeat(101));
  await expect(username).toHaveValue('a'.repeat(100));
});

test('下拉参数与禁用更新、搜索防竞态、原生虚拟表格可滚动', async ({ page }) => {
  await page.route('**/test/options?**', async (route) => {
    const query = new URL(route.request().url()).searchParams;
    const value = query.get('query');
    if (value === 'alpha') await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({
      json: {
        code: 200,
        data: [
          {
            value: value || query.get('department'),
            label: value || `部门-${query.get('department')}`,
          },
        ],
      },
    });
  });
  await page.goto('/tests/fixtures/selects.html');
  const normal = page.getByTestId('select').getByRole('combobox');
  await normal.click();
  await expect(page.getByText('部门-a', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '切换部门' }).click();
  await normal.click();
  await expect(page.getByText('部门-b', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '切换禁用' }).click();
  await expect(normal).toBeDisabled();
  const search = page.getByTestId('page-select').getByRole('combobox');
  await search.fill('alpha');
  await page.waitForTimeout(250);
  await search.fill('beta');
  await expect(
    page.locator('.ant-select-item-option-content').getByText('beta', { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(800);
  await expect(
    page.locator('.ant-select-item-option-content').getByText('alpha', { exact: true }),
  ).toHaveCount(0);
  const viewport = page.locator('.ant-table-tbody-virtual-holder');
  await expect(viewport).toBeVisible();
  expect(await page.locator('.ant-table-row').count()).toBeLessThan(100);
  await viewport.evaluate((element) => {
    element.scrollTop = 200000;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('.ant-table-row').first()).not.toContainText('row-0');
  await page.screenshot({ path: '.codex-temp/evidence/selects-virtual.png', fullPage: true });
});
