import type { TFunction } from 'i18next';
import { MENU_STATUS } from '@/utils/constants';
import { getUserPage } from '@/servers/system/user';
import { getRoleList } from '@/servers/system/role';

const otherSearch: BaseSearchList[] = [];

for (let i = 0; i < 32; i++) {
  otherSearch.push({
    label: `名称${i + 1}`,
    name: `label${i + 1}`,
    component: 'Input',
    componentProps: {
      maxLength: 200,
    },
  });
}

// 搜索数据
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('login.username'),
    name: 'username',
    wrapperWidth: 200,
    component: 'ApiPageSelect',
    componentProps: {
      api: getUserPage as ApiFn,
      apiResultKey: 'items',
      fieldNames: { label: 'username', value: 'username' },
      params: {
        page: 1,
        pageSize: 10,
      },
    },
  },
  {
    label: t('system.email'),
    name: 'email',
    component: 'Input',
  },
  {
    label: t('system.phone'),
    name: 'phone',
    component: 'Input',
  },
  ...otherSearch,
];

/**
 * 表格数据
 * @param optionRender - 渲染操作函数
 */
export const tableColumns = (t: TFunction, optionRender: TableOptions<object>): TableColumn[] => {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: t('login.username'),
      dataIndex: 'username',
      width: 100,
      fixed: 'left',
    },
    {
      title: t('public.name'),
      dataIndex: 'name',
      width: 100,
    },
    {
      title: t('system.state'),
      dataIndex: 'status',
      width: 80,
      enum: MENU_STATUS(t),
    },
    {
      title: t('system.role'),
      dataIndex: 'rolesName',
      width: 200,
    },
    {
      title: t('system.phone'),
      dataIndex: 'phone',
      width: 150,
    },
    {
      title: t('system.email'),
      dataIndex: 'email',
      width: 200,
    },
    {
      title: 'URL',
      dataIndex: 'url',
      width: 200,
    },
    {
      title: t('public.operate'),
      dataIndex: 'operate',
      width: 240,
      fixed: 'right',
      render: (value: unknown, record: object) => optionRender(value, record),
    },
  ];
};

// 新增数据
export const createList = (t: TFunction, isCreate: boolean): BaseFormList[] => [
  {
    label: t('login.username'),
    name: 'username',
    rules: FORM_REQUIRED,
    component: 'Input',
  },
  {
    label: t('login.password'),
    name: 'password',
    hidden: !isCreate,
    rules: isCreate ? FORM_REQUIRED : undefined,
    component: 'InputPassword',
  },
  {
    label: t('system.role'),
    name: 'roleIds',
    rules: FORM_REQUIRED,
    component: 'ApiSelect',
    componentProps: {
      mode: 'multiple',
      api: getRoleList,
      fieldNames: { label: 'name', value: 'id' },
    },
  },
  {
    label: t('system.state'),
    name: 'status',
    rules: FORM_REQUIRED,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(t),
    },
  },
  {
    label: t('system.phone'),
    name: 'phone',
    rules: [{ pattern: /^1[3456789]\d{9}$/, message: t('login.phoneNumberError') }],
    component: 'Input',
  },
  {
    label: t('system.email'),
    name: 'email',
    rules: [{ type: 'email' }],
    component: 'Input',
  },
];
