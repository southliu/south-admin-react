import type { BaseFormData } from '#/form';
import type { Key, TableRowSelection } from 'antd/es/table/interface';
import type { PagePermission } from '#/public';
import { useEffectOnActive } from 'keepalive-for-react';
import { message } from 'antd';
import { useMemo, useCallback } from 'react';
import { searchList, tableColumns } from './model';
import { batchDeleteLog, deleteLog, getLogPage } from '@/servers/log/log';

// 当前行数据
interface RowData {
  id: string;
  name: string;
}

function Page() {
  const { t } = useTranslation();
  const [isFetch, setFetch] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<BaseFormData>({});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const { permissions } = useCommonStore();

  // 权限前缀
  const permissionPrefix = '/log';

  // 权限
  const pagePermission: PagePermission = {
    page: checkPermission(permissionPrefix, permissions),
    create: checkPermission(`${permissionPrefix}/create`, permissions),
    update: checkPermission(`${permissionPrefix}/update`, permissions),
    delete: checkPermission(`${permissionPrefix}/delete`, permissions),
  };

  /** 获取表格数据 */
  const getPage = useCallback(async () => {
    const params = { ...searchData, page, pageSize };

    try {
      setLoading(true);
      const res = await getLogPage(params);
      const { code, data } = res;
      if (Number(code) !== 200) return;
      const { items, total } = data;
      setTotal(total || 0);
      setTableData(items || []);
    } finally {
      setFetch(false);
      setLoading(false);
    }
  }, [page, pageSize, searchData]);

  useEffect(() => {
    if (isFetch) getPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetch]);

  // 首次进入自动加载接口数据
  useEffect(() => {
    if (pagePermission.page) getPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePermission.page]);

  // 每次进入调用
  useEffectOnActive(() => {
    getPage();
  }, []);

  /**
   * 点击搜索
   * @param values - 表单返回数据
   */
  const onSearch = (values: BaseFormData) => {
    setPage(1);
    setSearchData(values);
    setFetch(true);
  };

  /**
   * 点击删除
   * @param id - 唯一值
   */
  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      const { code, message } = await deleteLog(id);
      if (Number(code) === 200) {
        messageApi.success(message || t('public.successfullyDeleted'));
        getPage();
      }
    } finally {
      setLoading(false);
    }
  };

  /** 处理批量删除 */
  const handleBatchDelete = async () => {
    try {
      if (!selectedRowKeys.length) {
        return messageApi.warning({
          content: t('public.tableSelectWarning'),
          key: 'pleaseSelect',
        });
      }
      setLoading(true);
      const params = { ids: selectedRowKeys };
      const { code, message } = await batchDeleteLog(params);
      if (Number(code) === 200) {
        messageApi.success(message || t('public.successfullyDeleted'));
        setSelectedRowKeys([]);
        getPage();
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 监听表格多选变化
   * @param newSelectedRowKeys - 勾选值
   */
  const onSelectChange = (newSelectedRowKeys: Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  /** 表格多选  */
  const rowSelection: TableRowSelection<object> = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  /**
   * 处理分页
   * @param page - 当前页数
   * @param pageSize - 每页条数
   */
  const onChangePagination = useCallback((page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
    setFetch(true);
  }, []);

  /**
   * 渲染操作
   * @param _ - 当前值
   * @param record - 当前行参数
   */
  const optionRender = useCallback(
    (_: unknown, record: object) => {
      return (
        <div className="flex flex-wrap gap-5px">
          {pagePermission.delete === true && (
            <DeleteBtn
              name={(record as RowData).name}
              handleDelete={() => onDelete((record as RowData).id)}
            />
          )}
        </div>
      );
    },
    [pagePermission.delete, onDelete],
  );

  // 缓存列配置
  const columns = useMemo(() => tableColumns(t, optionRender), [t, optionRender]);

  /** 左侧渲染 */
  const leftContentRender = (
    <DeleteBtn
      isIcon
      isLoading={isLoading}
      btnType="batchDelete"
      handleDelete={handleBatchDelete}
    />
  );

  return (
    <BaseContent isPermission={pagePermission.page}>
      {contextHolder}
      <BaseCard>
        <BaseSearch
          list={searchList(t)}
          data={searchData}
          isLoading={isLoading}
          handleFinish={onSearch}
        />
      </BaseCard>

      <BaseCard className="mt-10px">
        <BaseTable
          isLoading={isLoading}
          isCreate={pagePermission.create}
          columns={columns}
          dataSource={tableData}
          rowSelection={rowSelection}
          leftContent={leftContentRender}
          getPage={getPage}
        />

        <BasePagination
          disabled={isLoading}
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onChangePagination}
        />
      </BaseCard>
    </BaseContent>
  );
}

export default Page;
