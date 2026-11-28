import { test, expect } from '@playwright/test';

// 可通过 LOGIN_TEST_URL 对 Vue 的预览服务运行同一组行为验证。
const loginUrl = `${process.env.LOGIN_TEST_URL || ''}/login`;
const showDefaults = process.env.LOGIN_TEST_DEFAULT_ACCOUNT !== 'false';
const defaultUsername = showDefaults ? 'admin' : '';
const defaultPassword = showDefaults ? 'admin123456' : '';

for (const lang of ['zh', 'en']) {
  test(`记住账号：默认勾选、刷新恢复、取消清除、同行两端布局（${lang}）`, async ({ page }) => {
    await page.addInitScript((language) => localStorage.setItem('lang', language), lang);
    await page.goto(loginUrl);
    const remember = page.getByRole('checkbox', { name: lang === 'zh' ? '记住账号' : 'Remember account' });
    const username = page.locator('input[autocomplete="username"]');
    const password = page.locator('input[type="password"]');
    const forget = page.getByText(lang === 'zh' ? '忘记密码?' : 'Forget Password?', { exact: true });
    await expect(remember).toBeChecked();
    await expect(username).toHaveValue(defaultUsername);
    await expect(password).toHaveValue(defaultPassword);
    await username.fill('remember-tester');
    await password.fill('Testpass1');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('login_username'))).toBe('remember-tester');
    expect(await page.evaluate(() => localStorage.getItem('login_password'))).toBeNull();
    await page.reload();
    await expect(username).toHaveValue('remember-tester');
    await expect(password).toHaveValue(defaultPassword);
    const left = await remember.locator('..').boundingBox();
    const right = await forget.boundingBox();
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    if (!left || !right) throw new Error('登录页底部选项未显示');
    expect(Math.abs(left.y - right.y)).toBeLessThan(8);
    expect(left.x + left.width).toBeLessThan(right.x);
    await remember.uncheck();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('login_username'))).toBeNull();
    await username.fill('not-remembered');
    expect(await page.evaluate(() => localStorage.getItem('login_username'))).toBeNull();
    await page.reload();
    await expect(remember).not.toBeChecked();
    await expect(username).toHaveValue(defaultUsername);
    await expect(password).toHaveValue(defaultPassword);
    await username.fill('remember-again');
    await remember.check();
    await page.reload();
    await expect(username).toHaveValue('remember-again');
    await expect(remember).toBeChecked();
  });
}

test('取消记忆时忽略旧用户名，并清除旧密码缓存', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('remember_me', 'false');
    localStorage.setItem('login_username', 'legacy-user');
    localStorage.setItem('login_password', 'legacy-password');
  });
  await page.goto(loginUrl);
  await expect(page.locator('input[autocomplete="username"]')).toHaveValue(defaultUsername);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('login_password'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('login_username'))).toBeNull();
});
