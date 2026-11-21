import type { ResizeCallbackData } from 'react-resizable';
import type { EnumShowType, TableColumn } from '#/public';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { type TableProps, Table, Button, message, Tag } from 'antd';
import { getTableHeight, filterTableColumns } from './utils/helper';
import { PlusOutlined, RedoOutlined } from '@ant-design/icons';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useTranslation } from 'react-i18next';
import { EMPTY_VALUE } from '@/utils/config';
import { useFiler } from './hooks/useFiler';
import ResizableTitle from './components/ResizableTitle';
import EllipsisText from './components/EllipsisText';
import TableFilter from './components/TableFilter';
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
    leftContent,
    rightContent,
    getPage,
    onCreate,
  } = props;
  const { t } = useTranslation();
  const { isPhone } = useCommonStore();
  const [handleFilterTable] = useFiler();
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const columns = useMemo(
    () =>
      filterTableColumns((props.columns || []) as TableColumn[]).map((column) => ({
        ...column,
        width: columnWidths[String(column.dataIndex)] ?? column.width,
      })),
    [props.columns, columnWidths],
  );
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableFilters, setTableFilters] = useState<string[] | undefined>(undefined);
  const [sortList, setSortList] = useState<string[] | undefined>(undefined);
  const [tableHeight, setTableHeight] = useState(450);

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;
  delete params.isVirtual;
  delete params.isCreate;
  delete params.isBordered;
  delete params.isOperate;
  delete (params as TableColumn).enum;

  const defaultKeys = useMemo(
    () =>
      columns
        .filter((column) => !column.hidden && column.dataIndex)
        .map((column) => String(column.dataIndex)),
    [columns],
  );

  // 添加新增缺少方法警告
  if (isCreate && !onCreate) {
    message.warning({
      content: t('public.createMethodWarning'),
      key: 'createMethodWarning',
    });
  }

  // 添加分页缺少方法警告
  if (isOperate && !getPage) {
    message.warning({
      content: t('public.getPageWarning'),
      key: 'getPageWarning',
    });
  }

  // 表格高度
  useEffect(() => {
    const element = tableRef.current;
    const measure = () => setTableHeight(getTableHeight(element));
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (element) observer.observe(element);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

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
  const handleResize = useCallback(
    (column: TableColumn) =>
      (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
        setColumnWidths((previous) => ({ ...previous, [String(column.dataIndex)]: size.width }));
      },
    [],
  );

  // 合并列表
  const mergedColumns = useMemo(() => {
    const newColumns = handleFilterTable(
      columns,
      tableFilters ?? defaultKeys,
      sortList ?? defaultKeys,
    );
    if (!newColumns) return [];
    const result = newColumns
      .filter((col) => !(col as TableColumn).hidden)
      .map((col) => ({
        ...col,
        ellipsis: col.ellipsis ?? true,
        // 手机端去除列固定，除非设置了isKeepFixed
        fixed: col?.fixed && !(isPhone && !(col as TableColumn)?.isKeepFixed) ? col.fixed : false,
        onHeaderCell: (column: object, i: number) => ({
          ...col?.onHeaderCell?.(column, i),
          width: col.width,
          onResize: handleResize(col as TableColumn),
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
          let showType: EnumShowType = 'text';
          let color: string | undefined = undefined;
          let isStringArr = false; // 是否是字符串数组
          const enumList = (col as TableColumn)?.enum;

          if (enumList && typeof enumList === 'object') {
            if (Array.isArray(enumList)) {
              for (let i = 0; i < enumList?.length; i++) {
                const item = enumList[i];
                if (String(item.value) === String(showValue)) {
                  showValue = item.label;
                  color = item.color;
                  showType = item?.type || 'text';
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

          // 如果是字符串数组则用逗号分隔
          if (Array.isArray(showValue)) {
            isStringArr = showValue?.every((item) => typeof item === 'string');
            if (isStringArr) showValue = showValue?.join(', ') || EMPTY_VALUE;
          }

          if (!['object', 'function'].includes(typeof renderContent) || isStringArr) {
            const textContent = String(showValue ?? EMPTY_VALUE);

            // 如果显示类型为标签
            if (showType === 'tag') {
              return <Tag color={color}>{textContent}</Tag>;
            }

            // 超出不省略则换行
            if (col.ellipsis !== undefined && !col.ellipsis) {
              return (
                <span className="break-all break-words whitespace-pre-wrap">{textContent}</span>
              );
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
  }, [columns, tableFilters, sortList, isPhone, handleFilterTable, handleResize, defaultKeys]);

  const components: Components = { header: { cell: ResizableTitle } };

  // 滚动
  const requestedX = scrollX ?? props.scroll?.x;
  const requestedY = scrollY ?? props.scroll?.y;
  const scroll = {
    ...props.scroll,
    x: isVirtual
      ? typeof requestedX === 'number'
        ? requestedX
        : mergedColumns.reduce((total, col) => total + (Number(col.width) || 150), 0)
      : (requestedX ?? 'max-content'),
    y: isVirtual
      ? typeof requestedY === 'number'
        ? requestedY
        : tableHeight
      : (requestedY ?? (isAuthHeight ? tableHeight : undefined)),
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

    return `${className || ''}`;
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
          virtual={isVirtual}
          scroll={scroll}
          components={components}
          columns={mergedColumns as ColumnsType<object>}
        />
      </div>
    </div>
  );
}

export default BaseTable;
