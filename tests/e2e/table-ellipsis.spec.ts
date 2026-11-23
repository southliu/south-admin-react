import { test, expect } from '@playwright/test';

const longUrl = 'https://example.com/system/role/page?page=1&pageSize=20&keyword=完整搜索内容';
const shortUrl = 'https://example.com/health';
const params = JSON.stringify({ keyword: '用于检查请求参数完整展示的内容'.repeat(8), page: 1 });

test('日志延迟缺失显示占位符，溢出文字与刷新后的提示正确显示', async ({ page }) => {
  await page.setViewportSize({ width: 1560, height: 900 });
  let isShort = false;
  const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
  const permissions = ['/authority/log'];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user, permissions };
    else if (path.endsWith('/menu/list'))
      data = [{ key: '/system/log', label: '日志管理', labelEn: 'Logs', rule: '/authority/log' }];
    else if (path.endsWith('/log/page'))
      data = {
        items: [
          {
            id: 1,
            username: 'tester',
            method: 'GET',
            url: isShort ? '/menu/list' : longUrl,
            params,
            status: 200,
          },
          {
            id: 2,
            username: 'tester',
            method: 'GET',
            url: shortUrl,
            params: '',
            status: 200,
            latency: 0,
          },
          ...[null, 12.5, ''].map((latency, index) => ({
            id: index + 3,
            username: 'tester',
            method: 'GET',
            url: '/latency-check',
            latency,
          })),
        ],
        total: 5,
      };
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto('/#/login');
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();

  const table = page.locator('.ant-table-tbody');
  await expect(table.locator('tr[data-row-key]')).toHaveCount(5, { timeout: 20000 });
  await expect(page.getByRole('columnheader', { name: 'IP地址', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'IP地址 :' })).toHaveCount(0);
  const latencyIndex = await page
    .getByRole('columnheader', { name: '延迟', exact: true })
    .evaluate((element: HTMLTableCellElement) => element.cellIndex);
  for (const [index, text] of ['-', '0ms', '-', '12.5ms', '-'].entries()) {
    await expect(table.locator(`tr[data-row-key="${index + 1}"] td`).nth(latencyIndex)).toHaveText(
      text,
    );
  }
  const zeroLatency = table.locator('tr[data-row-key="2"] td').nth(latencyIndex);
  await zeroLatency.hover();
  await expect(zeroLatency).toBeInViewport();
  await page.screenshot({ path: '.codex-temp/evidence/log-latency.png', fullPage: true });
  const urlCell = table.getByText(longUrl, { exact: true });
  await expect(urlCell).toBeVisible();
  await expect
    .poll(() => urlCell.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await urlCell.hover();
  await expect(page.getByRole('tooltip')).toHaveText(longUrl);
  await page.screenshot({ path: '.codex-temp/evidence/table-url-tooltip.png', fullPage: true });

  await page.getByRole('button', { name: /刷\s*新/, exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  const shortCell = table.getByText(shortUrl, { exact: true });
  await shortCell.hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);

  const paramsCell = table.getByText(params, { exact: true });
  await expect(paramsCell).toBeVisible();
  await paramsCell.hover();
  await expect(page.getByRole('tooltip')).toHaveText(params);

  isShort = true;
  await page.getByRole('button', { name: /刷\s*新/, exact: true }).click();
  const newCell = table.getByText('/menu/list', { exact: true });
  await expect(newCell).toBeVisible();
  await newCell.hover();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
});
