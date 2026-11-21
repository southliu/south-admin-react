import type { Key } from 'react';
import { getRolePermission, type PermissionData } from '@/servers/system/role';
import { useState, useEffect, useCallback } from 'react';
import { Spin, type SelectProps } from 'antd';
import MenuAuthorize from './MenuAuthorize';

interface Props extends SelectProps {
  id: string;
}

function AuthorizeSelect(props: Props) {
  const { id, value, onChange } = props;
  const [isLoading, setLoading] = useState(false);
  const [list, setList] = useState<PermissionData[]>([]);

  /** 获取数据 */
  const getList = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    void getList();
  }, [getList]);

  /** 点击复选框 */
  const handleCheckedKeysChange = (checkedKeys: Key[]) => {
    // 将字符串数组转换为整数数组
    const numberKeys = checkedKeys.map((key) =>
      typeof key === 'string' ? parseInt(key, 10) : (key as number),
    );
    onChange?.(numberKeys);
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
