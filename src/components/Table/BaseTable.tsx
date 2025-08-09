import type { ResizeCallbackData } from 'react-resizable';
import type { ColumnsType } from 'antd/es/table';
import type { TableColumn } from '#/public';
import { type TableProps, Table, Button, message } from 'antd';
import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import { useFiler } from './hooks/useFiler';
import { useTranslation } from 'react-i18next';
import { EMPTY_VALUE } from '@/utils/config';
import { useCommonStore } from '@/hooks/useCommonStore';
import { PlusOutlined, RedoOutlined } from '@ant-design/icons';
import { getTableHeight, handleRowHeight, filterTableColumns } from './utils/helper';
import ResizableTitle from './components/ResizableTitle';
import useVirtualTable from './hooks/useVirtual';
import TableFilter from './components/TableFilter';
import EllipsisText from './components/EllipsisText';
import './index.less';

type Components = TableProps<object>['components'];

interface Props extends Omit<TableProps<object>, 'bordered'> {
  isLoading?: boolean; // 是否加载
  isBordered?: boolean; // 是否开启边框
  isZebra?: boolean; // 是否开启斑马线
  isVirtual?: boolean; // 是否开启虚拟滚动
  isOperate?: boolean; // 是否开启顶部操作栏
  isAuthHeight?: boolean; // 是否自动计算高度
  isCreate?: boolean;
  scrollX?: number;
  scrollY?: number;
  leftContent?: ReactNode; // 左侧额外内容
  rightContent?: ReactNode; // 右侧额外内容
  getPage?: () => void;
  onCreate?: () => void;
}

function BaseTable(props: Props) {
  const {
    isLoading,
    isVirtual,
    isCreate,
    isZebra = true,
    isBordered = true,
    isOperate = true,
    isAuthHeight,
    scrollX,
    scrollY,
    rowClassName,
    size,
    leftContent,
    rightContent,
    getPage,
    onCreate,
  } = props;
  const { t } = useTranslation();
  const { isPhone } = useCommonStore();
  const [handleFilterTable] = useFiler();
  const [columns, setColumns] = useState(filterTableColumns(props.columns as TableColumn[]));
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableFilters, setTableFilters] = useState<string[]>([]);
  const [sortList, setSortList] = useState<string[]>([]);

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;
  delete params.isVirtual;
  delete params.isCreate;
  delete params.isBordered;
  delete params.isOperate;
  delete (params as TableColumn).enum;

  useEffect(() => {
    const newColumns = filterTableColumns(props.columns as TableColumn[]);
    const columnKeys = newColumns?.map((col) => col.dataIndex).filter(Boolean) as string[];
    setColumns(newColumns);
    setTableFilters(columnKeys);
    setSortList(columnKeys);
  }, [props.columns]);

  // 添加新增缺少方法警告
  useEffect(() => {
    if (isCreate && !onCreate) {
      message.warning(t('public.createMethodWarning'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreate]);

  // 添加分页缺少方法警告
  useEffect(() => {
    if (isOperate && !getPage) {
      message.warning(t('public.getPageWarning'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPage]);

  // 表格高度
  const tableHeight = getTableHeight(tableRef.current);

  /**
   * 获取勾选表格数据
   * @param checks - 勾选
   */
  const getTableChecks = (checks: string[], newSortList: string[]) => {
    setTableFilters(checks);
    setSortList(newSortList);
  };

  /**
   * 处理拖拽
   * @param index - 下标
   */
  const handleResize = (index: number) => {
    return (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
      const newColumns = [...columns];
      newColumns[index] = {
        ...newColumns[index],
        width: size.width,
      };
      setColumns(newColumns);
    };
  };

  // 合并列表
  const mergeColumns = () => {
    const newColumns = handleFilterTable(columns, tableFilters, sortList);
    if (!newColumns) return [];
    const result = newColumns.map((col, index) => ({
      ...col,
      ellipsis: col.ellipsis ?? true,
      // 手机端去除列固定，除非设置了isKeepFixed
      fixed: col?.fixed && !(isPhone && !(col as TableColumn)?.isKeepFixed) ? col.fixed : false,
      onHeaderCell: (column: object, i: number) => ({
        ...col?.onHeaderCell?.(column, i),
        width: col.width,
        onResize: handleResize(index),
      }),
      onCell: (data: object, index?: number) => {
        return {
          ...col?.onCell?.(data, index),
          style: {
            ...col?.onCell?.(data, index)?.style,
            maxWidth: col.width,
            width: col.width,
          },
        };
      },
      render: (value: unknown, record: object, index: number) => {
        const renderContent = col?.render?.(value, record, index);
        let showValue: ReactNode | string = renderContent as ReactNode;
        let color: string | undefined = undefined;
        const enumList = (col as TableColumn)?.enum;

        if (enumList && typeof enumList === 'object') {
          if (Array.isArray(enumList)) {
            for (let i = 0; i < enumList?.length; i++) {
              const item = enumList[i];
              if (String(item.value) === String(showValue)) {
                showValue = item.label;
                color = item.color;
                break;
              }
            }
          } else {
            for (const key in enumList) {
              if (key === String(showValue)) {
                showValue = enumList[key] as string;
                break;
              }
            }
          }
        }

        if (!['object', 'function'].includes(typeof renderContent)) {
          const textContent = String(showValue ?? EMPTY_VALUE);

          // 超出不省略则换行
          if (col.ellipsis !== undefined && !col.ellipsis) {
            return <div style={{ maxWidth: col.width }}>{textContent}</div>;
          }

          return (
            <EllipsisText
              width={col.width}
              text={textContent}
              color={color}
              className="break-all"
            />
          );
        }

        return renderContent;
      },
    }));

    return result;
  };

  // 虚拟滚动操作值
  const virtualOptions = useVirtualTable({
    height: tableHeight, // 设置可视高度
    size: size || 'small',
    total: props.dataSource?.length || 0,
  });

  // 虚拟滚动组件
  const virtualComponents = useMemo(() => {
    return {
      header: {
        cell: ResizableTitle,
      },
      body: {
        wrapper: virtualOptions.body.wrapper,
      },
      table: virtualOptions.table,
    } as Components;
  }, [virtualOptions]);

  // 只带拖拽功能组件
  const components: Components = isVirtual
    ? virtualComponents
    : {
        header: {
          cell: ResizableTitle,
        },
      };

  // 滚动
  const scroll = {
    ...props.scroll,
    x: scrollX ?? 'max-content',
    y: scrollY ?? (isAuthHeight ? tableHeight : undefined),
  };

  /**
   * 处理行内样式
   */
  const handleRowClassName: TableProps<object>['rowClassName'] = (
    record: object,
    index: number,
    indent: number,
  ) => {
    const className =
      typeof rowClassName === 'string' ? rowClassName : rowClassName?.(record, index, indent);
    const rowSize = `!h-${handleRowHeight(size)}px`;

    return `${className || ''} ${rowSize}`;
  };

  return (
    <div
      id="table"
      className={`
        overflow-auto
        ${isBordered !== false ? 'bordered' : ''}
        ${isZebra !== false ? 'zebra' : ''}
      `}
    >
      {isOperate && (
        <div className="flex justify-between !mb-10px">
          <div className="flex flex-wrap items-center gap-6px">
            {!!isCreate && (
              <Button
                type="primary"
                className="small-btn"
                icon={<PlusOutlined />}
                onClick={onCreate}
              >
                {t('public.create')}
              </Button>
            )}
            {leftContent}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-6px">
            {rightContent ? <div>{rightContent}</div> : undefined}

            <Button
              className="small-btn"
              icon={<RedoOutlined className="transform rotate-270" disabled={!!isLoading} />}
              onClick={getPage}
            >
              {t('public.refresh')}
            </Button>

            <TableFilter
              columns={columns}
              cacheColumns={props.columns}
              getTableChecks={getTableChecks}
            />
          </div>
        </div>
      )}
      <div ref={tableRef}>
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          loading={isLoading}
          {...props}
          rowClassName={handleRowClassName}
          style={{
            borderRadius: 10,
            borderRight: '1px solid rgba(0, 0, 0, .05)',
            borderBottom: '1px solid rgba(0, 0, 0, .05)',
            overflow: 'auto',
            ...props.style,
          }}
          bordered={isBordered !== false}
          scroll={scroll}
          components={components}
          columns={mergeColumns() as ColumnsType<object>}
        />
      </div>
    </div>
  );
}

export default BaseTable;
