import type { TFunction } from 'i18next';
import { getUserPage } from '@/servers/system/user';
import CustomizeInput from './components/CustomizeInput';

// 搜索数据
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('public.title'),
    name: 'title',
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
      width: 400,
    },
    {
      title: t('public.title'),
      dataIndex: 'title',
      width: 400,
    },
    {
      title: t('content.author'),
      dataIndex: 'author',
      width: 100,
    },
    {
      title: t('public.content'),
      dataIndex: 'content',
      width: 400,
    },
    {
      title: t('content.creator'),
      dataIndex: 'creator',
      width: 200,
    },
    {
      title: t('content.updater'),
      dataIndex: 'updater',
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
export const createList = (t: TFunction): BaseFormList[] => [
  {
    label: t('public.title'),
    name: 'title',
    rules: FORM_REQUIRED,
    component: 'customize',
    render: CustomizeInput,
    componentProps: {
      style: {
        width: '80%',
      },
    },
  },
  {
    label: t('content.author'),
    name: 'author',
    component: 'ApiSelect',
    componentProps: {
      api: getUserPage as ApiFn,
      apiResultKey: 'items',
      fieldNames: { label: 'name', value: 'name' },
      params: {
        page: 1,
        pageSize: 10,
      },
      style: {
        width: '80%',
      },
    },
  },
  {
    label: t('content.nestedData'),
    name: ['demo', 'name', 'test'],
    component: 'Input',
    extra: '这是描述，这是描述，这是描述。',
    unit: '单位',
    componentProps: {
      style: {
        width: '80%',
      },
    },
  },
  {
    label: t('public.content'),
    name: 'content',
    component: 'RichEditor',
    componentProps: {
      style: {
        width: '80%',
      },
    },
  },
];
