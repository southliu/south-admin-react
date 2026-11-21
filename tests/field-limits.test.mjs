import { createLoader } from './helpers/load-module.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('业务表单长度与后端字段对应，密码和 TEXT 验证 UTF-8 字节边界', async () => {
  const mocks = {
    '@/utils/config': { FORM_REQUIRED: [{ required: true }] },
    '@/utils/constants': { MENU_STATUS: () => [], MENU_TYPES: () => [], MENU_ACTIONS: () => [] },
    '@/servers/system/user': { getUserPage: async () => ({ code: 200, data: [] }) },
    '@/servers/system/role': { getRoleList: async () => ({ code: 200, data: [] }) },
    '@/servers/system/menu': { getMenuList: async () => ({ code: 200, data: [] }) },
    './components/AuthorizeSelect': { default: () => null },
    './components/IconInput': { default: () => null },
    './components/StateSwitch': { default: () => null },
  };
  const load = createLoader(mocks);
  const translate = (key, args) => `${key}:${args?.max || ''}`;
  for (const [path, expected] of [
    ['user', { username: 100, password: 72, name: 100, phone: 20, email: 100 }],
    ['menu', { label: 50, labelEn: 50, router: 255, rule: 100, icon: 100 }],
    ['role', { name: 50, description: 65535 }],
  ]) {
    const module = load(`src/pages/system/${path}/model.tsx`);
    const fields = module.createList(translate, true);
    for (const [name, maxLength] of Object.entries(expected)) {
      assert.equal(
        fields.find((field) => field.name === name)?.componentProps?.maxLength,
        maxLength,
        `${path}.${name}`,
      );
    }
  }
  const { utf8ByteRule } = load('src/utils/fieldLimits.ts');
  await utf8ByteRule(translate, 72).validator(null, '中'.repeat(24));
  await assert.rejects(utf8ByteRule(translate, 72).validator(null, '中'.repeat(25)), /72/);
  await utf8ByteRule(translate, 65535).validator(null, '中'.repeat(21845));
  await assert.rejects(utf8ByteRule(translate, 65535).validator(null, '中'.repeat(21846)), /65535/);
});

test('首屏离线子集包含种子菜单图标，完整集合不在首屏 JS 静态导入', () => {
  const icons = JSON.parse(readFileSync('src/assets/icons.json', 'utf8'));
  for (const name of [
    'la:tachometer-alt',
    'fluent:box-20-regular',
    'ion:settings-outline',
    'majesticons:article-search-line',
    'material-symbols:link',
  ]) {
    const [prefix, key] = name.split(':');
    assert.ok(icons[prefix].icons[key].body, name);
  }
  const loader = readFileSync('src/utils/icons.ts', 'utf8');
  assert.doesNotMatch(loader, /from ['"]@iconify-json\//);
  assert.match(loader, /setCustomIconLoader/);
  assert.match(loader, /fetch\(/);
});
