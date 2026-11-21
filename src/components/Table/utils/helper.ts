import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { TableColumn } from '#/public';
import { EMPTY_VALUE } from '@/utils/config';
import { cloneDeep } from 'lodash';

/** 计算表格高度 */
export function getTableHeight(element: HTMLDivElement | null): number {
  // 获取屏幕高度
  const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;

  // 获取元素顶部高度
  const top = element?.getBoundingClientRect?.()?.top || 0;

  // 分页高度
  const paginationElm = document.getElementById('pagination');
  const paginationHeight = paginationElm?.offsetHeight || 0;

  // 表格高度 = 屏幕高度 - 表格距离顶部高度 - 分页高度
  const tableHeight = clientHeight - top - paginationHeight;

  return tableHeight > 0 ? tableHeight - 65 : 450;
}

/**
 * 根据大小处理行高度
 * @param size - 大小
 */
export function handleRowHeight(size: SizeType): number {
  switch (size) {
    case 'large':
      return 62;

    case 'middle':
      return 54;

    default:
      return 46;
  }
}

/**
 * 表格处理，表头超出隐藏，空值转为‘-’
 * @param columns - 表格数据
 */
export function filterTableColumns(columns: TableColumn[]) {
  const newColumns = cloneDeep(columns);

  for (let i = 0; i < newColumns?.length; i++) {
    const element = newColumns[i];
    if (element.ellipsis === undefined) {
      element.ellipsis = true;
    }
    if (!element.render) {
      element.render = (text: string | number) => {
        return text ? text : text === 0 ? text : EMPTY_VALUE;
      };
    }
  }

  return newColumns;
}
