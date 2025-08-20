import type { BaseFormData } from '#/form';
import type { PagePermission } from '#/public';
import { Button, Form, type FormInstance, message } from 'antd';
import { searchList, createList, tableColumns } from './model';
import {
  getMenuPage,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
} from '@/servers/system/menu';

// 当前行数据
interface RowData {
  id: string;
  type: number;
  label: string;
  labelEn: string;
}

// 初始化新增数据
const initCreate = {
  state: 1,
  order: 0,
};

function Page() {
  const { t, i18n } = useTranslation();
  const createFormRef = useRef<FormInstance>(null);
  const columns = tableColumns(t, optionRender);
  const [isFetch, setFetch] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isCreateLoading, setCreateLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState(ADD_TITLE(t));
  const [createId, setCreateId] = useState('');
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [searchData, setSearchData] = useState<BaseFormData>({});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);
  const { permissions } = useCommonStore();

  // 权限前缀
  const permissionPrefix = '/authority/menu';

  // 权限
  const pagePermission: PagePermission = {
    page: checkPermission(`${permissionPrefix}/index`, permissions),
    create: checkPermission(`${permissionPrefix}/create`, permissions),
    update: checkPermission(`${permissionPrefix}/update`, permissions),
    delete: checkPermission(`${permissionPrefix}/delete`, permissions),
  };

  /** 获取表格数据 */
  const getPage = useCallback(async () => {
    const params = { ...searchData, page, pageSize };

    try {
      setLoading(true);
      const res = await getMenuPage(params);
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
  }, [getPage, isFetch]);

  /**
   * 点击搜索
   * @param values - 表单返回数据
   */
  const onSearch = (values: BaseFormData) => {
    values.is_visible = values.is_visible !== undefined ? values.is_visible === 1 : undefined;
    setPage(1);
    setSearchData(values);
    setFetch(true);
  };

  // 首次进入自动加载接口数据
  useEffect(() => {
    if (pagePermission.page) getPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagePermission.page]);

  /**
   * 点击新增
   * @param record - 当前行数据
   */
  const onCreate = (record?: RowData) => {
    const id = record?.id;
    let type = record?.id ? record?.type : undefined;
    if (type && type < 3) type = type + 1;
    setCreateOpen(true);
    setCreateTitle(ADD_TITLE(t));
    setCreateId('');
    setCreateData({ ...initCreate, parentId: id, type });
  };

  /**
   * 点击编辑
   * @param id - 唯一值
   */
  const onUpdate = async (id: string) => {
    try {
      setCreateOpen(true);
      setCreateTitle(EDIT_TITLE(t, id));
      setCreateId(id);
      setCreateLoading(true);
      const { code, data } = await getMenuById(id);
      if (Number(code) !== 200) return;
      setCreateData(data);
    } finally {
      setCreateLoading(false);
    }
  };

  /** 表单提交 */
  const createSubmit = () => {
    createFormRef?.current?.submit();
  };

  /** 关闭新增/修改弹窗 */
  const closeCreate = () => {
    setCreateOpen(false);
  };

  /**
   * 新增/编辑提交
   * @param values - 表单返回数据
   */
  const handleCreate = async (values: BaseFormData) => {
    values.is_visible = values.is_visible !== undefined ? values.is_visible === 1 : undefined;

    try {
      setCreateLoading(true);
      const functions = () => (createId ? updateMenu(createId, values) : createMenu(values));
      const { code, message } = await functions();
      if (Number(code) !== 200) return;
      messageApi.success(message || t('public.successfulOperation'));
      setCreateOpen(false);
      getPage();
    } catch (e) {
      console.log(e);
    } finally {
      setCreateLoading(false);
    }
  };

  /**
   * 点击删除
   * @param id - 唯一值
   */
  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      const { code, message } = await deleteMenu(id);
      if (Number(code) === 200) {
        messageApi.success(message || t('public.successfullyDeleted'));
        getPage();
      }
    } finally {
      setLoading(false);
    }
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
  function optionRender(_: unknown, record: object) {
    return (
      <div className="flex flex-wrap gap-5px">
        {pagePermission.create === true && (record as RowData)?.type <= 2 && (
          <Button className="small-btn" type="primary" onClick={() => onCreate(record as RowData)}>
            {t('systems:menu.addChildMenu')}
          </Button>
        )}
        {pagePermission.update === true && (
          <UpdateBtn onClick={() => onUpdate((record as RowData).id)} />
        )}
        {pagePermission.delete === true && (
          <DeleteBtn
            name={i18n.language === 'zh' ? (record as RowData).label : (record as RowData).labelEn}
            handleDelete={() => onDelete((record as RowData).id)}
          />
        )}
      </div>
    );
  }

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
          getPage={getPage}
          onCreate={onCreate}
        />

        <BasePagination
          disabled={isLoading}
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onChangePagination}
        />
      </BaseCard>

      <BaseModal
        width={600}
        title={createTitle}
        open={isCreateOpen}
        style={{ top: 20 }}
        confirmLoading={isCreateLoading}
        onOk={createSubmit}
        onCancel={closeCreate}
      >
        <BaseForm
          ref={createFormRef}
          form={form}
          list={createList(t, createId, type)}
          data={createData}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 19 }}
          handleFinish={handleCreate}
        />
      </BaseModal>
    </BaseContent>
  );
}

export default Page;
