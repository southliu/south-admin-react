import { useToken } from '@/hooks/useToken';
import { useCallback, useEffect, useMemo, useState, memo, useDeferredValue, Suspense } from 'react';
import { useOutlet } from 'react-router-dom';
import { Skeleton, message } from 'antd';
import { Icon } from '@iconify/react';
import { debounce } from 'lodash';
import { useShallow } from 'zustand/shallow';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { versionCheck } from './utils/helper';
import { getMenuList } from '@/servers/system/menu';
import { useMenuStore, useUserStore } from '@/stores';
import { getUserRefreshPermissions } from '@/servers/system/user';
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react';
import { useCommonStore } from '@/hooks/useCommonStore';
import Menu from './components/Menu';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Forbidden from '@/pages/403';
import ErrorBoundary from './components/ErrorBoundary';
import styles from './index.module.less';

function Layout() {
  const [getToken] = useToken();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const token = getToken();
  const outlet = useOutlet();
  const keepaliveRef = useKeepAliveRef();
  const [isLoading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { setPermissions, setUserInfo } = useUserStore((state) => state);
  const { setMenuList, toggleCollapsed, togglePhone } = useMenuStore((state) => state);
  const setAliveRef = usePublicStore((state) => state.setAliveRef);

  const { permissions, userId, isMaximize, isCollapsed, isPhone, isRefresh } = useCommonStore();

  // 使用 useDeferredValue 延迟非关键的路由更新，提升响应性
  const deferredPathname = useDeferredValue(pathname);

  /** Keepalive当前路由缓存 */
  const currentCacheKey = useMemo(() => {
    return deferredPathname;
  }, [deferredPathname]);

  // 只在 ref 变化时更新 store，避免每次渲染都触发更新
  useEffect(() => {
    if (keepaliveRef.current && !aliveRef.current) {
      setAliveRef(keepaliveRef);
    }
  }, [keepaliveRef.current]); // 只依赖 ref.current

  /** 获取用户信息和权限 */
  const getUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const { code, data } = await getUserRefreshPermissions({ refresh_cache: false });
      if (Number(code) !== 200) return;
      const { user, permissions } = data;
      setUserInfo(user);
      setPermissions(permissions);
    } catch (err) {
      console.error('获取用户数据失败:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 获取菜单数据 */
  const getMenuData = useCallback(async () => {
    try {
      setLoading(true);
      const { code, data } = await getMenuList();
      if (Number(code) !== 200) return;
      setMenuList(data || []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 当用户信息缓存不存在时则重新获取
    if (token && !userId) {
      getUserInfo();
      getMenuData();
    }
  }, [getUserInfo, getMenuData, token, userId]);

  // 监测是否需要刷新
  useEffect(() => {
    versionCheck(t, messageApi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /** 判断是否是手机端 */
  const handleIsPhone = useCallback(
    debounce(() => {
      const isPhone = window.innerWidth <= 768;
      // 手机首次进来收缩菜单
      if (isPhone) toggleCollapsed(true);
      togglePhone(isPhone);
    }, 500),
    [toggleCollapsed, togglePhone],
  );

  // 监听是否是手机端
  useEffect(() => {
    handleIsPhone();
    window.addEventListener('resize', handleIsPhone);

    return () => {
      window.removeEventListener('resize', handleIsPhone);
      handleIsPhone.cancel(); // 清理 debounce 函数
    };
  }, [handleIsPhone]);

  // 使用 useMemo 缓存 className，避免每次渲染都重新计算
  const headerClassName = useMemo(
    () =>
      `
        border-bottom
        transition-all
        z-15
        ${styles.header}
        ${isCollapsed ? styles['header-close-menu'] : ''}
        ${isMaximize ? styles['header-none'] : ''}
        ${isPhone ? `!left-0 z-999` : ''}
      `,
    [isCollapsed, isMaximize, isPhone],
  );

  const contentClassName = useMemo(
    () =>
      `
        overflow-auto
        transition-all
        ${styles.con}
        ${isMaximize ? styles['con-maximize'] : ''}
        ${isCollapsed ? styles['con-close-menu'] : ''}
        ${isPhone ? `!left-0 !w-full` : ''}
      `,
    [isMaximize, isCollapsed, isPhone],
  );

  return (
    <div id="layout">
      {contextHolder}
      <Menu />
      <div className={styles.layout_right}>
        <div id="header" className={headerClassName}>
          <Header />
          <Tabs aliveRef={keepaliveRef} />
        </div>
        <div id="layout-content" className={contentClassName}>
          {isLoading && permissions.length === 0 && (
            <Skeleton active className="p-30px" paragraph={{ rows: 10 }} />
          )}
          {!isLoading && permissions.length === 0 && <Forbidden />}
          {isRefresh && (
            <div
              className={`
              absolute
              left-50%
              top-50%
              -rotate-x-50%
              -rotate-y-50%
            `}
            >
              <Icon className="text-40px animate-spin" icon="ri:loader-2-fill" />
            </div>
          )}
          <KeepAlive aliveRef={keepaliveRef} activeCacheKey={currentCacheKey} max={10}>
            {permissions.length > 0 && (
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="p-30px">
                      <Skeleton active paragraph={{ rows: 10 }} />
                    </div>
                  }
                >
                  {outlet}
                </Suspense>
              </ErrorBoundary>
            )}
          </KeepAlive>
        </div>
      </div>
    </div>
  );
}

export default memo(Layout);
