import { type TableProps, type CheckboxProps, Button, Popover, Divider, Checkbox } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useMemo, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableColumn } from '#/public';
import DragContent from './DragContent';

/**
 * 表格字段筛选
 */

export interface CheckboxList {
  label: string;
  value: string;
}

interface Props {
  columns: TableProps['columns'];
  cacheColumns: TableProps['columns'];
  className?: string;
  getTableChecks: (checks: string[], sortList: string[]) => void;
}

function TableFilter(props: Props) {
  const { columns, cacheColumns, className, getTableChecks } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [order, setOrder] = useState<string[] | undefined>();
  const [checks, setChecks] = useState<string[] | undefined>();
  const list = useMemo(() => {
    const items = (columns || [])
      .filter((column) => (column as TableColumn).dataIndex)
      .map((column) => ({
        label: column.title as string,
        value: String((column as TableColumn).dataIndex),
      }));
    return order ? items.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value)) : items;
  }, [columns, order]);
  const checkedList =
    checks ??
    (columns || [])
      .filter((column) => !column.hidden && (column as TableColumn).dataIndex)
      .map((column) => String((column as TableColumn).dataIndex));
  const setCheckedList = setChecks;
  const setList = (items: CheckboxList[]) => setOrder(items.map((item) => item.value));
  const checkAll = list.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < list.length;
  const params: Partial<Props> = { ...props };
  delete params.getTableChecks;
  delete params.cacheColumns;

  /** 处理点击事件 */
  const handleClick = () => {
    setOpen(!isOpen);
  };

  /**
   * 监听多选组数据
   * @param checkedValue - 已选数据
   */
  const onChangeCheckbox = (checkedValue: string[]) => {
    setCheckedList(checkedValue);
    handleFilter(checkedValue);
  };

  /** 处理筛选 */
  const handleFilter = (checkedList: string[], currentList = list) => {
    getTableChecks(
      checkedList,
      currentList.map((item) => item.value),
    );
  };

  /** 全选 */
  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    const checkedList = e.target.checked ? list.map((item) => item.value) : [];
    setCheckedList(checkedList);
    handleFilter(checkedList);
  };

  /** 重置列表 */
  const handleReset = () => {
    const newList: CheckboxList[] = [];
    const allCheckedList = (cacheColumns as TableColumn[])
      ?.map((item) => (item as { dataIndex: string })?.dataIndex)
      ?.filter(Boolean);

    for (let i = 0; i < (cacheColumns as TableColumn[])?.length; i++) {
      const item = (cacheColumns as TableColumn[])[i];
      newList.push({
        label: item.title as string,
        value: item.dataIndex as string,
      });
    }

    setCheckedList(allCheckedList);
    setList(newList);
    handleFilter(allCheckedList, newList);
  };

  /** 处理拖拽结束 */
  const handleDragEnd = (list: CheckboxList[]) => {
    setList(list);
    getTableChecks(
      checkedList,
      list.map((item) => item.value),
    );
  };

  // 渲染内容
  const content = () => {
    return (
      <div className="min-w-140px flex flex-col">
        <div className="px-5px">
          <Checkbox
            className="w-full !pl-10px !py-3px hover:bg-blue-100 border-rd-5px"
            indeterminate={indeterminate}
            onChange={onCheckAllChange}
            checked={checkAll}
          >
            {t('public.checkAll')}
          </Checkbox>
        </div>

        <Divider className="!my-5px" />

        <Checkbox.Group
          className="flex flex-col !px-5px !pb-5px relative"
          value={checkedList}
          onChange={onChangeCheckbox}
        >
          <DragContent list={list} handleDragEnd={handleDragEnd} />
        </Checkbox.Group>

        <Divider className="!mt-10px !mb-5px" />

        <Button className="flex-1 text-center" type="link" size="small" onClick={handleReset}>
          {t('public.reset')}
        </Button>
      </div>
    );
  };

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottom"
      styles={{
        container: {
          padding: '8px 0 5px',
        },
      }}
      open={isOpen}
      onOpenChange={handleClick}
    >
      <div {...params} className={`${className} inline-block`}>
        <Button icon={<SettingOutlined />} className="small-btn">
          {t('public.columnFilter')}
        </Button>
      </div>
    </Popover>
  );
}

export default memo(TableFilter, (prevProps, nextProps) => {
  return (
    prevProps.columns === nextProps.columns && prevProps.cacheColumns === nextProps.cacheColumns
  );
});
