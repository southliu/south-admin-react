import { useAliveController } from 'react-activation';

/**
 * 获取常用的状态数据
 */
export const useLogout = () => {
  const [, , removeToken] = useToken();
  const { clear } = useAliveController();
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
    clear(); // 清除keepalive缓存
    navigate(`/login?redirect=${location.pathname}${location.search}`);
  };

  return [handleLogout] as const;
};
