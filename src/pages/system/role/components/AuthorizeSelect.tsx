import type { Key } from 'react';
import { Spin, type SelectProps } from 'antd';
import { getRolePermission, type PermissionData } from '@/servers/system/role';
import MenuAuthorize from './MenuAuthorize';

interface Props extends SelectProps {
  id: string;
}

function AuthorizeSelect(props: Props) {
  const { id, value, onChange } = props;
  const [list, setList] = useState<PermissionData[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    getList();
  }, []);

  /** 获取数据 */
  const getList = async () => {
    const params = { roleId: id };

    try {
      setLoading(true);
      const res = await getRolePermission(params);
      const { code, data } = res;
      if (Number(code) !== 200) return;
      setList(data?.treeData || []);
    } finally {
      setLoading(false);
    }
  };

  /** 点击复选框 */
  const handleCheckedKeysChange = (checkedKeys: Key[]) => {
    onChange?.(checkedKeys);
  };

  return (
    <Spin spinning={isLoading}>
      <MenuAuthorize
        isBordered
        treeData={list}
        defaultCheckedKeys={value || []}
        onChange={handleCheckedKeysChange}
      />
    </Spin>
  );
}

export default AuthorizeSelect;
