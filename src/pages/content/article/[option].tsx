import type { PagePermission } from '#/public';
import type { BaseFormData } from '#/form';
import { getArticleById, createArticle, updateArticle } from '@/servers/content/article';
import { useRequestSequence } from '@/hooks/useRequestSequence';
import { Form, type FormInstance, message, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useEffectOnActive } from 'keepalive-for-react';
import { checkPermission } from '@/utils/permissions';
import { useSingleTab } from '@/hooks/useSingleTab';
import { usePublicStore } from '@/stores/public';
import { useTranslation } from 'react-i18next';
import { useTabsStore } from '@/stores/tabs';
import { useShallow } from 'zustand/shallow';
import { getUrlParam } from '@/utils/helper';
import { useRef, useState } from 'react';
import { createList } from './model';
import SubmitBottom from '@/components/Bottom/SubmitBottom';
import BaseContent from '@/components/Content/BaseContent';
import BaseCard from '@/components/Card/BaseCard';
import BaseForm from '@/components/Form/BaseForm';

// 初始化新增数据
const initCreate = {
  content: '<h4>初始化内容</h4>',
};

// 父路径
const fatherPath = '/content/article';

function Page() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const { permissions } = useCommonStore(['permissions']);
  const { begin: beginDetailRequest, invalidate: invalidateDetail } = useRequestSequence();
  const [isLoading, setLoading] = useState(false);
  const [isCreateReady, setCreateReady] = useState(false);
  const [createId, setCreateId] = useState(() => getUrlParam(search, 'id'));
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const id = getUrlParam(search, 'id');
  const currentId = useRef<string | undefined>(undefined);
  const createFormRef = useRef<FormInstance>(null);
  const navigate = useNavigate();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const closeTabGoNext = useTabsStore((state) => state.closeTabGoNext);
  const setRefreshPage = usePublicStore((state) => state.setRefreshPage);
  useSingleTab({
    fatherPath,
    zhTitle: id ? '编辑文章管理' : '新增文章管理',
    enTitle: id ? 'Edit Article Management' : 'Add Article Management',
  });

  // 权限前缀
  const permissionPrefix = '/content/article';

  // 权限
  const pagePermission: PagePermission = {
    create: checkPermission(`${permissionPrefix}/create`, permissions),
    update: checkPermission(`${permissionPrefix}/update`, permissions),
  };

  /** 处理新增 */
  const handleCreate = () => {
    invalidateDetail();
    setCreateReady(true);
    setLoading(false);
    setCreateId('');
    setCreateData(initCreate);
  };

  /**
   * 处理编辑
   * @param id - 唯一值
   */
  const handleUpdate = async (id: string) => {
    const isCurrent = beginDetailRequest();
    setCreateReady(false);
    setCreateData(initCreate);
    try {
      setCreateId(id);
      setLoading(true);
      const { code, data } = await getArticleById(id);
      if (!isCurrent()) return;
      if (Number(code) !== 200) return;
      setCreateData(data);
      setCreateReady(true);
    } catch {
      // 请求层负责错误提示，详情失败时保持禁止提交。
    } finally {
      if (isCurrent()) setLoading(false);
    }
  };

  /** 表格提交 */
  const handleSubmit = () => {
    if (!isCreateReady || isLoading) return;
    createFormRef.current?.submit();
  };

  /**
   * 返回主页
   * @param isRefresh - 返回页面是否重新加载接口
   */
  const goBack = (isRefresh?: boolean) => {
    invalidateDetail();
    setCreateReady(false);
    createFormRef.current?.resetFields();
    if (isRefresh) setRefreshPage(true);
    closeTabGoNext({
      key: pathname,
      nextPath: fatherPath,
      dropScope: aliveRef.current?.destroy,
    });
    navigate(fatherPath);
  };

  /**
   * 新增/编辑提交
   * @param values - 表单返回数据
   */
  const handleFinish = async (values: BaseFormData) => {
    if (!isCreateReady || isLoading) return;
    try {
      setLoading(true);
      const functions = () => (createId ? updateArticle(createId, values) : createArticle(values));
      const { code, message } = await functions();
      if (Number(code) !== 200) return;
      messageApi.success(message || t('public.successfulOperation'));
      createFormRef.current?.resetFields();
      goBack(true);
    } finally {
      setLoading(false);
    }
  };

  useEffectOnActive(() => {
    if (!pathname.startsWith(`${fatherPath}/`)) return;
    if (currentId.current === id) return;
    currentId.current = id;
    if (id) {
      void handleUpdate(id);
    } else {
      handleCreate();
    }
  }, [id, pathname]);

  // 缓存页的 search 会随其他路由变化，权限依据当前编辑记录以保留表单草稿。
  return (
    <BaseContent isPermission={createId ? pagePermission.update : pagePermission.create}>
      {contextHolder}
      <div className="!h-[calc(100vh-98px)] ">
        <BaseCard>
          <div className="mt-20px mb-50px">
            <Spin spinning={isLoading}>
              <BaseForm
                form={form}
                ref={createFormRef}
                list={createList(t)}
                data={createData}
                labelCol={{ span: 5 }}
                handleFinish={handleFinish}
              />
            </Spin>
          </div>
        </BaseCard>
      </div>

      <SubmitBottom
        isLoading={isLoading}
        isDisabled={!isCreateReady}
        goBack={() => goBack()}
        handleSubmit={handleSubmit}
      />
    </BaseContent>
  );
}

export default Page;
