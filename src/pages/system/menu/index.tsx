import type { PagePermission } from '#/public';
import type { BaseFormData } from '#/form';
import {
  getMenuPage,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  batchDeleteMenu,
} from '@/servers/system/menu';
import { Button, Form, type FormInstance, message, Popconfirm } from 'antd';
import { ADD_TITLE, INIT_PAGINATION, EDIT_TITLE } from '@/utils/config';
import { useRequestSequence } from '@/hooks/useRequestSequence';
import { searchList, createList, tableColumns } from './model';
import { UpdateBtn, DeleteBtn } from '@/components/Buttons';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useEffectOnActive } from 'keepalive-for-react';
import { useCallback, useRef, useState } from 'react';
import { checkPermission } from '@/utils/permissions';
import { useTranslation } from 'react-i18next';
import BasePagination from '@/components/Pagination/BasePagination';
import BaseContent from '@/components/Content/BaseContent';
import BaseSearch from '@/components/Search/BaseSearch';
import BaseTable from '@/components/Table/BaseTable';
import BaseModal from '@/components/Modal/BaseModal';
import BaseCard from '@/components/Card/BaseCard';
import BaseForm from '@/components/Form/BaseForm';

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
  const { permissions } = useCommonStore(['permissions']);
  const { t, i18n } = useTranslation();
  const { begin: beginPageRequest } = useRequestSequence();
  const { begin: beginDetailRequest, invalidate: invalidateDetail } = useRequestSequence();
  const [isLoading, setLoading] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isCreateLoading, setCreateLoading] = useState(false);
  const [isCreateReady, setCreateReady] = useState(false);
  const [createTitle, setCreateTitle] = useState(ADD_TITLE(t));
  const [createId, setCreateId] = useState('');
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [searchData, setSearchData] = useState<BaseFormData>({});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const createFormRef = useRef<FormInstance>(null);
  const type = Form.useWatch('type', form);

  // 权限前缀
  const permissionPrefix = '/authority/menu';

  // 权限
  const pagePermission: PagePermission = {
    page: checkPermission(permissionPrefix, permissions),
    create: checkPermission(`${permissionPrefix}/create`, permissions),
    update: checkPermission(`${permissionPrefix}/update`, permissions),
    delete: checkPermission(`${permissionPrefix}/delete`, permissions),
  };

  /** 获取表格数据 */
  const getPage = useCallback(async () => {
    const isCurrent = beginPageRequest();
    const params = { ...searchData, page, pageSize };

    try {
      setLoading(true);
      const res = await getMenuPage(params);
      if (!isCurrent()) return;
      const { code, data } = res;
      if (Number(code) !== 200) return;
      const { items, total } = data;
      setTotal(total || 0);
      setTableData(items || []);
    } catch {
      // 请求层负责错误提示。
    } finally {
      if (isCurrent()) {
        setLoading(false);
      }
    }
  }, [beginPageRequest, page, pageSize, searchData]);

  useEffectOnActive(() => {
    if (pagePermission.page) void getPage();
  }, [getPage, pagePermission.page]);

  /**
   * 点击搜索
   * @param values - 表单返回数据
   */
  const onSearch = (values: BaseFormData) => {
    setSearchData(values);
  };

  /**
   * 点击新增
   * @param record - 当前行数据
   */
  const onCreate = (record?: RowData) => {
    invalidateDetail();
    setCreateReady(true);
    setCreateLoading(false);
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
    const isCurrent = beginDetailRequest();
    setCreateReady(false);
    setCreateData(initCreate);
    try {
      setCreateOpen(true);
      setCreateTitle(EDIT_TITLE(t, id));
      setCreateId(id);
      setCreateLoading(true);
      const { code, data } = await getMenuById(id);
      if (!isCurrent()) return;
      if (Number(code) !== 200) return;
      setCreateData(data);
      setCreateReady(true);
    } catch {
      // 请求层负责错误提示，详情失败时保持禁止提交。
    } finally {
      if (isCurrent()) setCreateLoading(false);
    }
  };

  /** 表单提交 */
  const createSubmit = () => {
    if (!isCreateReady || isCreateLoading) return;
    createFormRef?.current?.submit();
  };

  /** 关闭新增/修改弹窗 */
  const closeCreate = () => {
    invalidateDetail();
    setCreateReady(false);
    setCreateOpen(false);
  };

  /**
   * 新增/编辑提交
   * @param values - 表单返回数据
   */
  const handleCreate = async (values: BaseFormData) => {
    if (!isCreateReady || isCreateLoading) return;
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

  /** 批量删除 */
  const onBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning(t('public.selectAtLeastOne'));
      return;
    }
    try {
      setLoading(true);
      const { code, message } = await batchDeleteMenu(selectedRowKeys as string[]);
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
   * 处理分页
   * @param page - 当前页数
   * @param pageSize - 每页条数
   */
  const onChangePagination = useCallback((page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
  }, []);

  /**
   * 渲染操作
   * @param _ - 当前值
   * @param record - 当前行参数
   */
  const optionRender = (_: unknown, record: object) => {
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
  };

  // 列配置
  const columns = tableColumns(t, optionRender);

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
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => setSelectedRowKeys(selectedRowKeys),
          }}
          leftContent={
            selectedRowKeys.length > 0 && pagePermission.delete ? (
              <Popconfirm
                title={t('public.kindTips')}
                description={t('public.batchDeleteConfirmMessage', { name: '' })}
                onConfirm={onBatchDelete}
                okText={t('public.confirm')}
                cancelText={t('public.cancel')}
              >
                <Button danger className="small-btn">
                  {t('public.batchDelete')} ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            ) : undefined
          }
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
        isLoading={isCreateLoading}
        confirmLoading={isCreateLoading && isCreateReady}
        okButtonProps={{ disabled: !isCreateReady }}
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
