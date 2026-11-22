import { cancelAllRequest } from '@/utils/request';
import { usePublicStore } from '@/stores/public';
import { useNavigate } from 'react-router-dom';
import { useTabsStore } from '@/stores/tabs';
import { useUserStore } from '@/stores/user';
import { useMenuStore } from '@/stores/menu';
import { useShallow } from 'zustand/shallow';
import { useToken } from '@/hooks/useToken';

/**
 * 获取常用的状态数据
 */
export const useLogout = () => {
  const { closeAllTab, setActiveKey } = useTabsStore(
    useShallow((state) => ({ closeAllTab: state.closeAllTab, setActiveKey: state.setActiveKey })),
  );
  const [, , removeToken] = useToken();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
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
