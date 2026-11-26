import type { Page, Route } from '@playwright/test';
import { test, expect } from '@playwright/test';

const alice = { id: '1', username: 'alice', name: 'Alice', status: 1, roles: [] };
const bob = { id: '2', username: 'bob', name: 'Bob', status: 1, roles: [] };
const permissions = [
  '/authority/user',
  '/authority/user/create',
  '/authority/user/update',
  '/content/article/update',
];

async function openUsers(
  page: Page,
  handle?: (route: Route, url: URL) => Promise<boolean>,
  search = '',
) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    if (await handle?.(route, url)) return;
    const path = url.pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user: alice, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user: alice, permissions };
    else if (path.endsWith('/menu/list'))
      data = [{ key: '/system/user', label: '用户管理', labelEn: 'Users' }];
    else if (path.endsWith('/user/page')) data = { items: [alice, bob], total: 2 };
    else if (path.endsWith('/user/detail')) data = url.searchParams.get('id') === '1' ? alice : bob;
    else if (path.endsWith('/role/list')) data = [];
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto(`/system/user${search}`);
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();
  await expect(page.locator('.ant-table-tbody').getByText('alice', { exact: true })).toBeVisible();
}

test('登录清理旧密码、只记住用户名，回跳完整恢复查询并显示无 rule 菜单', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('login_password', 'legacy-secret');
    localStorage.setItem('login_username', 'old-user');
    localStorage.setItem('remember_me', 'false');
  });
  await page.goto('/login');
  await expect(page.locator('input[autocomplete="username"]')).toHaveValue('old-user');
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  const queries: URLSearchParams[] = [];
  const search = `?${new URLSearchParams({ email: '张三+a@example.com', phone: '123456' })}`;
  await openUsers(
    page,
    async (_route, url) => {
      if (url.pathname.endsWith('/user/page') && url.searchParams.get('pageSize') === '20')
        queries.push(url.searchParams);
      return false;
    },
    search,
  );
  await expect(page.getByRole('menuitem', { name: '用户管理', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '邮箱 :' })).toHaveValue('张三+a@example.com');
  await expect(page.getByRole('textbox', { name: '手机 :' })).toHaveValue('123456');
  expect(queries.at(-1)?.get('email')).toBe('张三+a@example.com');
  expect(queries.at(-1)?.get('phone')).toBe('123456');
  expect(await page.evaluate(() => localStorage.getItem('login_password'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('login_username'))).toBe('tester');
});

test('列表旧响应不能覆盖新查询，浏览器后退恢复对应查询', async ({ page }) => {
  const pending = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  try {
    await openUsers(page, async (route, url) => {
      if (!url.pathname.endsWith('/user/page') || url.searchParams.get('pageSize') !== '20')
        return false;
      const email = url.searchParams.get('email');
      if (email === 'old@example.com') {
        started.resolve();
        await pending.promise;
      }
      await route.fulfill({
        json: { code: 200, data: { items: [{ ...alice, username: email || 'alice' }], total: 1 } },
      });
      return true;
    });
    await page.evaluate(() => {
      window.history.pushState(null, '', '/system/user?email=old@example.com');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await started.promise;
    await page.evaluate(() => {
      window.history.pushState(null, '', '/system/user?email=new@example.com');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    const table = page.locator('.ant-table-tbody');
    await expect(table.getByText('new@example.com', { exact: true })).toBeVisible();
    const oldResponse = page.waitForResponse((response) =>
      response.url().includes('email=old%40example.com'),
    );
    pending.resolve();
    await oldResponse;
    await expect(table.getByText('new@example.com', { exact: true })).toBeVisible();
    await expect(table.getByText('old@example.com', { exact: true })).toHaveCount(0);
    await page.goBack();
    await expect(page.getByRole('textbox', { name: '邮箱 :' })).toHaveValue('old@example.com');
    await expect(table.getByText('old@example.com', { exact: true })).toBeVisible();
  } finally {
    pending.resolve();
  }
});

test('详情失败禁止提交旧数据，关闭后迟到的详情不能污染另一条记录', async ({ page }) => {
  let failBob = true;
  let delayAlice = false;
  let writes = 0;
  const pending = Promise.withResolvers<void>();
  const started = Promise.withResolvers<void>();
  try {
    await openUsers(page, async (route, url) => {
      if (route.request().method() === 'PUT') writes++;
      if (!url.pathname.endsWith('/user/detail')) return false;
      const id = url.searchParams.get('id');
      if (id === '2' && failBob) {
        await route.fulfill({ json: { code: 500, message: '详情暂时不可用' } });
        return true;
      }
      if (id === '1' && delayAlice) {
        started.resolve();
        await pending.promise;
      }
      return false;
    });
    const edit = (name: string) =>
      page
        .getByRole('row')
        .filter({ hasText: name })
        .getByRole('button', { name: /编.*辑/ });
    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: /确.*定/ });
    const cancel = dialog.getByRole('button', { name: /取.*消/ });
    await edit('alice').click();
    await expect(dialog.getByLabel('用户名', { exact: true })).toHaveValue('alice');
    await cancel.click();
    await edit('bob').click();
    await expect(page.getByText('详情暂时不可用', { exact: true })).toBeVisible();
    await expect(confirm).toBeDisabled();
    await expect(dialog.getByLabel('用户名', { exact: true })).toHaveValue('');
    expect(writes).toBe(0);
    await cancel.click();

    failBob = false;
    delayAlice = true;
    await edit('alice').click();
    await started.promise;
    await expect(confirm).toBeDisabled();
    await cancel.click();
    await edit('bob').click();
    await expect(dialog.getByLabel('用户名', { exact: true })).toHaveValue('bob');
    await expect(confirm).toBeEnabled();
    const oldResponse = page.waitForResponse((response) =>
      response.url().includes('/user/detail?id=1'),
    );
    pending.resolve();
    await oldResponse;
    await expect(dialog.getByLabel('用户名', { exact: true })).toHaveValue('bob');
    expect(writes).toBe(0);
  } finally {
    pending.resolve();
  }
});

test('文章标签切换保留未保存草稿，切换到详情失败的记录后禁止提交', async ({ page }) => {
  let details = 0;
  let writes = 0;
  await openUsers(page, async (route, url) => {
    if (route.request().method() === 'PUT') writes++;
    if (!url.pathname.endsWith('/article/detail')) return false;
    details++;
    const failed = url.searchParams.get('id') === 'missing';
    await route.fulfill({
      json: failed
        ? { code: 500, message: '文章详情暂时不可用' }
        : { code: 200, data: { id: 'article-1', title: '原始标题', content: '<p>原始内容</p>' } },
    });
    return true;
  });
  await page.evaluate(() => {
    window.history.pushState(null, '', '/content/article/update?id=article-1');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  const title = page.getByRole('textbox', { name: /标题/ });
  await expect(title).toHaveValue('原始标题');
  await title.fill('未保存草稿');
  await page.getByRole('menuitem', { name: '用户管理', exact: true }).click();
  await expect(page.locator('.ant-table-tbody').getByText('alice', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState(null, '', '/content/article/update?id=article-1');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect
    .poll(async () => ({ title: await title.inputValue(), details }))
    .toEqual({ title: '未保存草稿', details: 1 });
  await page.evaluate(() => {
    window.history.pushState(null, '', '/content/article/update?id=missing');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByText('文章详情暂时不可用', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /提.*交/ })).toBeDisabled();
  await expect(title).toHaveValue('');
  expect(writes).toBe(0);
});
