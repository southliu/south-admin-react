import { test, expect } from '@playwright/test';

function readBoxFrames(elements: Element[]) {
  return elements.map((element) => {
    const { width, height, marginTop, marginLeft } = getComputedStyle(element);
    return { width, height, marginTop, marginLeft };
  });
}

for (const theme of ['light', 'dark']) {
  test(`内容模块慢加载时显示三方块动画，完成后恢复页面并保留标签缓存（${theme}）`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('theme_key', value), theme);
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
    const loader = loading.locator('[aria-hidden="true"]');
    const boxes = loader.locator(':scope > div');
    await expect(loader).toHaveCSS('width', '112px');
    await expect(loader).toHaveCSS('height', '112px');
    expect(await loader.boundingBox()).toMatchObject({ width: 56, height: 56 });
    await expect(boxes).toHaveCount(3);
    await expect(boxes.first()).toHaveCSS('background-color', 'rgb(193, 193, 193)');
    await expect(boxes.first()).toHaveCSS('animation-duration', '3s');
    await expect(boxes.first()).toHaveCSS('animation-delay', '0s');
    const firstFrame = await boxes.evaluateAll(readBoxFrames);
    await expect.poll(() => boxes.evaluateAll(readBoxFrames), { timeout: 1000 }).not.toEqual(firstFrame);
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.getByRole('button')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const box of await boxes.all()) {
      await expect(box).toHaveCSS('animation-name', 'none');
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.getByRole('banner')).toBeVisible();
    await page.screenshot({ path: `.codex-temp/evidence/content-loading-${theme}.png`, fullPage: true });
    await boxes.evaluateAll((elements) => {
      for (const element of elements) {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = 1500;
        }
      }
    });
    await expect(boxes.nth(1)).toHaveCSS('width', '112px');
    await expect(boxes.nth(0)).toHaveCSS('width', '48px');
    await expect(boxes.nth(2)).toHaveCSS('margin-top', '64px');
    const bounds = await loader.boundingBox();
    if (bounds) {
      await page.screenshot({
        path: `.codex-temp/evidence/content-boxes-${theme}.png`,
        clip: { x: bounds.x - 64, y: bounds.y - 64, width: 240, height: 240 },
      });
    }
    await boxes.evaluateAll((elements) => {
      for (const element of elements) {
        for (const animation of element.getAnimations()) animation.play();
      }
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#layout-content')).toHaveClass(/!w-full/);
    await expect.poll(() => loading.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await loading.screenshot({ path: `.codex-temp/evidence/content-boxes-${theme}-mobile.png` });
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('#layout-content')).not.toHaveClass(/!w-full/);
    await page.getByRole('button', { name: '展开菜单', exact: true }).click();
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
}
