import { test, expect } from '@playwright/test';

test('日期范围面板跟随语言切换月份和星期，并保留选中日期', async ({ page }, testInfo) => {
  const user = { id: 1, username: 'tester', name: '测试用户', roles: [1] };
  const permissions = ['/dashboard'];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/user/login')) data = { token: 'test-token', user, permissions };
    else if (path.endsWith('/user/refreshPermissions')) data = { user, permissions };
    else if (path.endsWith('/menu/list'))
      data = [{ key: '/dashboard', label: '仪表盘', rule: '/dashboard' }];
    await route.fulfill({ json: { code: 200, data } });
  });
  await page.goto('/#/login');
  await page.locator('input[autocomplete="username"]').fill('tester');
  await page.locator('input[type="password"]').fill('Testpass1');
  await page.getByRole('button', { name: /登.*录/ }).click();
  const inputs = page.locator('.ant-picker-range input');
  const start = inputs.first();
  await start.click();
  const panel = page.locator('.ant-picker-dropdown:visible');
  await expect(panel.locator('.ant-picker-month-btn').first()).toHaveText('10月');
  await expect(panel.locator('thead').first()).toHaveText('一二三四五六日');
  await page.screenshot({ path: testInfo.outputPath('calendar.png') });
  await panel.locator('td[title="2022-10-20"]').first().click();
  await panel.locator('td[title="2022-10-28"]').first().click();
  await expect(start).toHaveValue('2022-10-20');
  await expect(inputs.last()).toHaveValue('2022-10-28');

  await page.locator('.ant-dropdown-link:has(svg)').click();
  await page.getByRole('menuitem', { name: 'English', exact: true }).click();
  await start.click();
  await expect(panel.locator('.ant-picker-month-btn').first()).toHaveText('Oct');
  await expect(panel.locator('.ant-picker-year-btn').first()).toHaveText('2022');
  await expect(panel.locator('thead').first()).toHaveText('SuMoTuWeThFrSa');
  await expect(panel.getByRole('button', { name: 'Choose a month' }).first()).toBeVisible();
  await expect(start).toHaveValue('2022-10-20');
  await expect(inputs.last()).toHaveValue('2022-10-28');
  await page.screenshot({ path: testInfo.outputPath('calendar-en.png') });
  await start.press('Escape');

  await page.reload();
  await start.click();
  await expect(panel.locator('.ant-picker-month-btn').first()).toHaveText('Oct');
  await expect(panel.locator('thead').first()).toHaveText('SuMoTuWeThFrSa');
  await start.press('Escape');
  await page.locator('.ant-dropdown-link:has(svg)').click();
  await page.getByRole('menuitem', { name: '中文', exact: true }).click();
  await start.click();
  await expect(panel.locator('.ant-picker-month-btn').first()).toHaveText('10月');
  await expect(panel.locator('thead').first()).toHaveText('一二三四五六日');
  await expect(panel.getByRole('button', { name: '选择月份' }).first()).toBeVisible();
});
