import type { BaseSearchList, BaseFormList } from '#/form';
import type { TableOptions, TableColumn } from '#/public';
import type { TFunction } from 'i18next';
import { MENU_ACTIONS, MENU_STATUS, MENU_TYPES } from '@/utils/constants';
import { EMPTY_VALUE, FORM_REQUIRED } from '@/utils/config';
import { getMenuList } from '@/servers/system/menu';
import { MENU_LENGTH } from '@/utils/fieldLimits';
import { Icon } from '@iconify/react';
import StateSwitch from './components/StateSwitch';
import IconInput from './components/IconInput';

/**
 * 搜索数据
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 */
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('systems:menu.label'),
    name: 'label',
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.label },
  },
  {
    label: t('systems:menu.labelEn'),
    name: 'labelEn',
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.labelEn },
  },
  {
    label: t('system.state'),
    name: 'state',
    wrapperWidth: 100,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(t),
    },
  },
];

/**
 * 表格数据
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param optionRender - 渲染操作函数
 */
export const tableColumns = (t: TFunction, optionRender: TableOptions<object>): TableColumn[] => {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: t('systems:menu.icon'),
      dataIndex: 'icon',
      width: 50,
      render: (text: string) => (
        <div className="text-center">
          {text ? <Icon className="text-16px" icon={text} /> : EMPTY_VALUE}
        </div>
      ),
    },
    {
      title: t('systems:menu.label'),
      dataIndex: 'label',
      width: 200,
    },
    {
      title: t('systems:menu.labelEn'),
      dataIndex: 'labelEn',
      width: 200,
    },
    {
      title: t('public.type'),
      dataIndex: 'type',
      width: 60,
      ellipsis: false,
      enum: MENU_TYPES(t),
    },
    {
      title: t('systems:menu.router'),
      dataIndex: 'router',
      width: 200,
    },
    {
      title: t('system.status'),
      dataIndex: 'state',
      width: 80,
      render: (text: number, record) => <StateSwitch value={text} record={record} />,
    },
    {
      title: t('systems:menu.sort'),
      dataIndex: 'order',
      width: 50,
    },
    {
      title: t('systems:menu.rule'),
      dataIndex: 'rule',
      width: 150,
    },
    {
      title: t('public.creationTime'),
      dataIndex: 'createdAt',
      width: 200,
    },
    {
      title: t('public.updateTime'),
      dataIndex: 'updatedAt',
      width: 200,
    },
    {
      title: t('public.operate'),
      dataIndex: 'operate',
      width: 210,
      fixed: 'right',
      render: (value: unknown, record: object) => optionRender(value, record),
    },
  ];
};

/**
 * 新增数据
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param id - 当前记录标识，用于区分新增与编辑场景
 * @param type - 菜单类型，用于控制目录、菜单和按钮对应的表单项
 */
export const createList = (t: TFunction, id: string, type?: number): BaseFormList[] => [
  {
    label: t('systems:menu.parentMenu'),
    name: 'parentId',
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuList,
      fieldNames: { label: 'label', value: 'id' },
    },
  },
  {
    label: t('systems:menu.label'),
    name: 'label',
    rules: FORM_REQUIRED,
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.label },
  },
  {
    label: t('systems:menu.labelEn'),
    name: 'labelEn',
    rules: FORM_REQUIRED,
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.labelEn },
  },
  {
    label: t('public.type'),
    name: 'type',
    rules: FORM_REQUIRED,
    component: 'RadioGroup',
    componentProps: {
      options: MENU_TYPES(t),
    },
  },
  {
    label: t('systems:menu.router'),
    name: 'router',
    rules: [{ required: type !== 3 }],
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.router },
  },
  {
    label: t('system.state'),
    name: 'state',
    rules: FORM_REQUIRED,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(t),
    },
  },
  {
    label: t('systems:menu.sort'),
    name: 'order',
    rules: FORM_REQUIRED,
    component: 'InputNumber',
  },
  {
    label: t('systems:menu.rule'),
    name: 'rule',
    rules: [{ required: type === 3 }],
    component: 'Input',
    componentProps: { maxLength: MENU_LENGTH.rule },
  },
  {
    label: t('systems:menu.icon'),
    name: 'icon',
    component: 'customize',
    componentProps: { maxLength: MENU_LENGTH.icon },
    render: IconInput,
  },
  {
    label: t('system.permissionButton'),
    name: 'actions',
    hidden: !!id && type !== 3,
    component: 'CheckboxGroup',
    componentProps: {
      options: MENU_ACTIONS(t),
    },
  },
];
