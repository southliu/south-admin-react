import { createLoader } from './helpers/load-module.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';

test('菜单仅向 UI 传展示属性，原始业务数据与嵌套菜单不被修改', () => {
  const { handleFilterMenus } = createLoader({
    '@/router/utils/helper': { isRouteExist: () => true },
    '@/utils/config': {},
  })('src/menus/utils/helper.ts');
  const child = Object.freeze({
    key: '/system/user',
    label: '用户管理',
    labelEn: 'Users',
    titleEn: 'Users',
    type: 2,
    parentId: 1,
    permissionId: 2,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    rule: '/authority/user',
    disabled: false,
    className: 'menu-item',
    'data-testid': 'users',
  });
  const menus = Object.freeze([
    Object.freeze({
      key: '/system',
      label: '系统管理',
      labelEn: 'System',
      children: Object.freeze([child]),
    }),
  ]);
  const result = handleFilterMenus(menus);
  assert.deepEqual(result, [
    {
      key: '/system',
      label: '系统管理',
      children: [
        {
          key: '/system/user',
          label: '用户管理',
          disabled: false,
          className: 'menu-item',
          'data-testid': 'users',
        },
      ],
    },
  ]);
  assert.equal(menus[0].children[0].permissionId, 2);
  assert.equal(menus[0].children[0].createdAt, '2026-01-01');
});

test('控件默认属性与值绑定属性匹配其公开接口', () => {
  const { initCompProps, handleValuePropName, filterFormItem } = createLoader({
    '@/utils/config': {},
  })('src/components/Form/utils/helper.tsx');
  assert.equal(handleValuePropName('Checkbox'), 'checked');
  assert.equal(handleValuePropName('Switch'), 'checked');
  assert.equal(handleValuePropName('Upload'), 'fileList');
  for (const component of ['Switch', 'Checkbox', 'Slider', 'Rate', 'Upload', 'RadioGroup'])
    assert.equal('allowClear' in initCompProps((key) => key, component), false, component);
  for (const component of ['Input', 'TextArea', 'Select', 'ApiSelect'])
    assert.equal(initCompProps((key) => key, component).allowClear, true, component);
  const field = filterFormItem({
    name: 'files',
    label: '文件',
    component: 'Upload',
    labelWidth: 100,
    wrapperWidth: 200,
    unit: '个',
    componentProps: { beforeUpload: () => false },
  });
  for (const prop of ['component', 'labelWidth', 'wrapperWidth', 'unit', 'componentProps'])
    assert.equal(prop in field, false, prop);
  assert.deepEqual(field.getValueFromEvent({ fileList: ['sample.txt'] }), ['sample.txt']);
});
