import type { Key, TableRowSelection } from 'antd/es/table/interface';
import type { PagePermission } from '#/public';
import type { BaseFormData } from '#/form';
import {
  batchDeleteUser,
  createUser,
  deleteUser,
  getUserById,
  getUserPage,
  updateUser,
} from '@/servers/system/user';
import { ADD_TITLE, INIT_PAGINATION, EDIT_TITLE } from '@/utils/config';
import { useRequestSequence } from '@/hooks/useRequestSequence';
import { useSearchUrlParams } from '@/hooks/useSearchUrlParams';
import { createList, searchList, tableColumns } from './model';
import { UpdateBtn, DeleteBtn } from '@/components/Buttons';
import { useCommonStore } from '@/hooks/useCommonStore';
import { type FormInstance, Form, message } from 'antd';
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
  username: string;
}

// 初始化新增数据
const initCreate = {
  status: 1,
};

function Page() {
  const { t } = useTranslation();
  const { begin: beginPageRequest } = useRequestSequence();
  const { begin: beginDetailRequest, invalidate: invalidateDetail } = useRequestSequence();

  const { permissions } = useCommonStore(['permissions']);
  const [isLoading, setLoading] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isCreateLoading, setCreateLoading] = useState(false);
  const [isCreateReady, setCreateReady] = useState(false);
  const [createTitle, setCreateTitle] = useState(ADD_TITLE(t));
  const [createId, setCreateId] = useState('');
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [handleSetSearchParams, searchData] = useSearchUrlParams(searchForm);
  const createFormRef = useRef<FormInstance>(null);

  // 权限前缀
  const permissionPrefix = '/authority/user';

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
      const { code, data } = await getUserPage(params);
      if (!isCurrent()) return;
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
    setPage(1);
    const isUnchanged = handleSetSearchParams(values);
    if (page === 1 && isUnchanged) void getPage();
  };

  /** 点击新增 */
  const onCreate = () => {
    invalidateDetail();
    setCreateReady(true);
    setCreateLoading(false);
    setCreateOpen(true);
    setCreateTitle(ADD_TITLE(t));
    setCreateId('');
    setCreateData(initCreate);
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
      const { code, data } = await getUserById(id);
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

  /** 表格提交 */
  const createSubmit = () => {
    if (!isCreateReady || isCreateLoading) return;
    createFormRef.current?.submit();
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
      const functions = () => (createId ? updateUser(createId, values) : createUser(values));
      const { code, message } = await functions();
      if (Number(code) !== 200) return;
      messageApi.success(message || t('public.successfulOperation'));
      setCreateOpen(false);
      getPage();
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
      const { code, message } = await deleteUser(id);
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
      const { code, message } = await batchDeleteUser(params);
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
  const onChangePagination = (page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
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
   * 渲染操作
   * @param _ - 当前值
   * @param record - 当前行参数
   */
  const optionRender = (_: unknown, record: object) => {
      return (
        <div className="flex flex-wrap gap-5px">
          {pagePermission.update === true && (
            <UpdateBtn onClick={() => onUpdate((record as RowData).id)} />
          )}
          {pagePermission.delete === true && (
            <DeleteBtn
              name={(record as RowData).username}
              handleDelete={() => onDelete((record as RowData).id)}
            />
          )}
        </div>
      );
    };

  // 列配置
  const columns = tableColumns(t, optionRender);

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
          searchForm={searchForm}
          data={searchData}
          type="grid"
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
          rightContent={<div>（搜索将参数放入url）</div>}
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
        title={createTitle}
        open={isCreateOpen}
        isLoading={isCreateLoading}
        confirmLoading={isCreateLoading && isCreateReady}
        okButtonProps={{ disabled: !isCreateReady }}
        onOk={createSubmit}
        onCancel={closeCreate}
      >
        <BaseForm
          form={form}
          ref={createFormRef}
          list={createList(t, !createId)}
          labelCol={{ span: 4 }}
          data={createData}
          handleFinish={handleCreate}
        />
      </BaseModal>
    </BaseContent>
  );
}

export default Page;
