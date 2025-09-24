import type { TFunction } from 'i18next';
import AuthorizeSelect from './components/AuthorizeSelect';

// 搜索数据
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('public.name'),
    name: 'name',
    component: 'Input',
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
      width: 200,
    },
    {
      title: t('public.name'),
      dataIndex: 'name',
      width: 200,
    },
    {
      title: t('system.description'),
      dataIndex: 'description',
      width: 200,
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
      width: 200,
      fixed: 'right',
      render: (value: unknown, record: object) => optionRender(value, record),
    },
  ];
};

// 新增数据
export const createList = (t: TFunction, id: string): BaseFormList[] => [
  {
    label: t('public.name'),
    name: 'name',
    rules: FORM_REQUIRED,
    component: 'Input',
  },
  {
    label: t('system.description'),
    name: 'description',
    component: 'TextArea',
  },
  {
    label: t('system.authorize'),
    name: 'authorize',
    rules: FORM_REQUIRED,
    component: 'customize',
    render: AuthorizeSelect as unknown as CustomizeRender,
    componentProps: {
      id,
    },
  },
];
