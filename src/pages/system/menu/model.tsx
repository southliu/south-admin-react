import type { TFunction } from 'i18next';
import { MENU_ACTIONS, MENU_STATUS, MENU_TYPES } from '@/utils/constants';
import { getMenuList } from '@/servers/system/menu';
import { Icon } from '@iconify/react';
import { Tag } from 'antd';
import IconInput from './components/IconInput';

// 搜索数据
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('systems:menu.label'),
    name: 'label',
    component: 'Input',
  },
  {
    label: t('systems:menu.labelEn'),
    name: 'labelEn',
    component: 'Input',
  },
  {
    label: t('system.state'),
    name: 'isVisible',
    wrapperWidth: 100,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(t),
    },
  },
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
      dataIndex: 'isVisible',
      width: 80,
      render: (text: number) => (
        <Tag color={text ? 'green' : 'red'}>{text ? t('public.show') : t('public.hide')}</Tag>
      ),
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

// 新增数据
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
  },
  {
    label: t('systems:menu.labelEn'),
    name: 'labelEn',
    rules: FORM_REQUIRED,
    component: 'Input',
  },
  {
    label: t('public.type'),
    name: 'type',
    rules: FORM_REQUIRED,
    component: 'Select',
    componentProps: {
      options: MENU_TYPES(t),
    },
  },
  {
    label: t('systems:menu.router'),
    name: 'router',
    rules: [{ required: type !== 3 }],
    component: 'Input',
  },
  {
    label: t('system.state'),
    name: 'isVisible',
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
  },
  {
    label: t('systems:menu.icon'),
    name: 'icon',
    component: 'customize',
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
