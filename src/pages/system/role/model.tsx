import type { BaseSearchList, BaseFormList, CustomizeRender } from '#/form';
import type { TableOptions, TableColumn } from '#/public';
import type { TFunction } from 'i18next';
import { ROLE_LENGTH, utf8ByteRule } from '@/utils/fieldLimits';
import { FORM_REQUIRED } from '@/utils/config';
import AuthorizeSelect from './components/AuthorizeSelect';

/**
 * 搜索数据
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 */
export const searchList = (t: TFunction): BaseSearchList[] => [
  {
    label: t('public.name'),
    name: 'name',
    component: 'Input',
    componentProps: { maxLength: ROLE_LENGTH.name },
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

/**
 * 新增数据
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param id - 当前记录标识，用于区分新增与编辑场景
 */
export const createList = (t: TFunction, id: string): BaseFormList[] => [
  {
    label: t('public.name'),
    name: 'name',
    rules: FORM_REQUIRED,
    component: 'Input',
    componentProps: { maxLength: ROLE_LENGTH.name },
  },
  {
    label: t('system.description'),
    name: 'description',
    component: 'TextArea',
    rules: [utf8ByteRule(t, ROLE_LENGTH.description)],
    componentProps: { maxLength: ROLE_LENGTH.description },
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
