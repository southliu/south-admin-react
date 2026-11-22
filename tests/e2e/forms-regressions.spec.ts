import { test, expect } from '@playwright/test';

test('懒加载表单保留 checked、原始变化事件、即时校验及上传列表', async ({ page }) => {
  await page.goto('/tests/fixtures/forms.html');
  const form = page.getByTestId('form');
  const checkbox = form.getByRole('checkbox');
  const enabled = form.getByRole('switch');
  await expect(checkbox).toBeChecked();
  await expect(enabled).toBeChecked();
  await checkbox.uncheck();
  await enabled.click();
  const number = form.getByRole('spinbutton');
  await number.fill('2');
  await number.blur();
  await expect(form.getByTestId('callback')).toHaveText('2');
  await expect(form.getByTestId('events')).toContainText('"count":2');
  await expect(form.getByTestId('events')).toContainText('"agree":false');
  await number.fill('');
  await number.blur();
  await expect(form.getByText('数量不能为空', { exact: true })).toBeVisible();
  await number.fill('3');
  await number.blur();
  await expect(form.getByText('数量不能为空', { exact: true })).toHaveCount(0);

  await form.locator('input[type="file"]').setInputFiles({
    name: 'sample.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('sample'),
  });
  await expect(form.getByText('sample.txt', { exact: true })).toBeVisible();
  await form.getByRole('button', { name: '读取表单' }).click();
  const values = JSON.parse(await form.getByTestId('values').innerText());
  expect(values).toMatchObject({ agree: false, enabled: false, count: 3 });
  expect(Array.isArray(values.files)).toBe(true);
  expect(values.files[0].name).toBe('sample.txt');
  await form.getByRole('button', { name: '重置表单' }).click();
  await expect(checkbox).toBeChecked();
  await expect(enabled).toBeChecked();
  await expect(number).toHaveValue('1');
  await expect(form.getByText('sample.txt', { exact: true })).toHaveCount(0);
});

test('搜索展开不覆盖业务隐藏字段，也不透传封装属性到 DOM', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/does not recognize|Unknown event handler|not a valid prop/.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/tests/fixtures/forms.html');
  const search = page.getByTestId('search');
  await expect(search.getByRole('textbox', { name: '字段1 :' })).toBeVisible();
  await expect(search.getByRole('textbox', { name: '字段8 :' })).toBeVisible();
  await expect(search.getByRole('textbox', { name: '字段0 :' })).toHaveCount(0);
  await expect(search.getByRole('textbox', { name: '字段9 :' })).toHaveCount(0);
  await search.getByText('展开', { exact: true }).click();
  await expect(search.getByRole('textbox', { name: '字段9 :' })).toBeVisible();
  await expect(search.getByRole('textbox', { name: '字段0 :' })).toHaveCount(0);
  await search.getByText('收缩', { exact: true }).click();
  await expect(search.getByRole('textbox', { name: '字段9 :' })).toHaveCount(0);
  expect(warnings).toEqual([]);
});
