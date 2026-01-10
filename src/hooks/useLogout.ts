import { useShallow } from 'zustand/shallow';

/**
 * 获取常用的状态数据
 */
export const useLogout = () => {
  const [, , removeToken] = useToken();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { closeAllTab, setActiveKey } = useTabsStore((state) => state);
  const clearInfo = useUserStore((state) => state.clearInfo);
  const navigate = useNavigate();
  const location = useLocation();
  /** 退出登录 */
  const handleLogout = () => {
    clearInfo();
    closeAllTab();
    setActiveKey('');
    removeToken();
    aliveRef.current?.destroyAll(); // 清除keepalive缓存
    navigate(`/login?redirect=${location.pathname}${location.search}`);
  };

  return [handleLogout] as const;
};
