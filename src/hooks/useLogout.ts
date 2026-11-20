import { useToken } from '@/hooks/useToken';
import { usePublicStore } from '@/stores/public';
import { useTabsStore } from '@/stores/tabs';
import { useUserStore } from '@/stores/user';
import { useMenuStore } from '@/stores/menu';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';
import { cancelAllRequest } from '@/utils/request';

/**
 * 获取常用的状态数据
 */
export const useLogout = () => {
  const [, , removeToken] = useToken();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { closeAllTab, setActiveKey } = useTabsStore((state) => state);
  const setPermissions = useUserStore((state) => state.setPermissions);
  const setMenuList = useMenuStore((state) => state.setMenuList);
  const clearInfo = useUserStore((state) => state.clearInfo);
  const navigate = useNavigate();

  /** 退出登录 */
  const handleLogout = () => {
    cancelAllRequest();
    sessionStorage.removeItem('layout-bootstrap');
    clearInfo();
    closeAllTab();
    setActiveKey('');
    setMenuList([]);
    setPermissions([]);
    removeToken();
    navigate('/login');
    // 避免退出登录失效
    setTimeout(() => {
      aliveRef.current?.destroyAll();
    }, 0);
  };

  return [handleLogout] as const;
};
