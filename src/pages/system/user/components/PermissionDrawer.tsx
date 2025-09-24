import type { PermissionData } from '@/servers/system/role';
import type { Key } from 'antd/lib/table/interface';
import { Drawer, Button, message as messageApi, Spin } from 'antd';
import { saveUserPermission } from '@/servers/system/user';
import { getUserPermission } from '@/servers/system/user';
import MenuAuthorize from '../../role/components/MenuAuthorize';

interface Props {
  isOpen: boolean;
  id: string;
  title?: string;
  onClose: () => void;
}

function PermissionDrawer(props: Props) {
  const { id, title, isOpen, onClose } = props;
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const [isFetchLoading, setFetchLoading] = useState(false);
  const [treeData, setTreeData] = useState<PermissionData[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      setTreeData([]);
      setCheckedKeys([]);
    }
  }, [isOpen]);

  /** 获取权限数据 */
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { userId: id };
      const { code, data } = await getUserPermission(params);
      if (Number(code) !== 200) return;
      const { defaultCheckedKeys, treeData } = data;
      setTreeData(treeData);
      setCheckedKeys(defaultCheckedKeys);
    } finally {
      setLoading(false);
    }
  };

  /** 提交 */
  const handleSubmit = async () => {
    try {
      setFetchLoading(true);
      const params = {
        menuIds: checkedKeys,
        userId: id,
      };
      const { code, message } = await saveUserPermission(params);
      if (Number(code) !== 200) return;
      messageApi.success(message || t('system.authorizationSuccessful'));
      onClose?.();
    } finally {
      setFetchLoading(false);
    }
  };

  /** 右上角渲染 */
  const extraRender = (
    <Button type="primary" loading={isLoading || isFetchLoading} onClick={handleSubmit}>
      {t('public.submit')}
    </Button>
  );

  /**
   * 处理勾选
   * @param checked - 勾选值
   */
  const handleCheck = (checked: Key[]) => {
    setCheckedKeys(checked);
  };

  return (
    <Drawer
      open={isOpen}
      title={title || t('system.rightsProfile')}
      placement="right"
      extra={extraRender}
      onClose={onClose}
      loading={isLoading}
    >
      <Spin spinning={isFetchLoading}>
        <MenuAuthorize
          isBordered
          treeData={treeData}
          defaultCheckedKeys={checkedKeys || []}
          onChange={handleCheck}
        />
      </Spin>
    </Drawer>
  );
}

export default PermissionDrawer;
