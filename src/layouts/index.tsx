import { usePublicStore } from '@/stores/public';
import { useToken } from '@/hooks/useToken';
import { useCallback, useEffect, useMemo, useState, memo, useDeferredValue } from 'react';
import { useOutlet } from 'react-router-dom';
import { Button, Result, Skeleton, message } from 'antd';
import { debounce } from 'lodash';
import { useShallow } from 'zustand/shallow';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { versionCheck } from './utils/helper';
import { getMenuList } from '@/servers/system/menu';
import { useMenuStore, useUserStore } from '@/stores';
import { getUserRefreshPermissions } from '@/servers/system/user';
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react';
import { useCommonStore } from '@/hooks/useCommonStore';
import nprogress from 'nprogress';
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const setAliveRef = usePublicStore(useShallow((state) => state.setAliveRef));
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { setPermissions, setUserInfo } = useUserStore(
    useShallow((state) => ({
      setPermissions: state.setPermissions,
      setUserInfo: state.setUserInfo,
    })),
  );
  const { menuList, setMenuList, toggleCollapsed, togglePhone } = useMenuStore(
    useShallow((state) => ({
      menuList: state.menuList,
      setMenuList: state.setMenuList,
      toggleCollapsed: state.toggleCollapsed,
      togglePhone: state.togglePhone,
    })),
  );

  const { permissions, isMaximize, isCollapsed, isPhone } = useCommonStore();
  const hasSidebar = permissions.length > 0 && menuList.length > 0;

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
  }, [keepaliveRef.current]);

  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    const requests: Promise<void>[] = [];
    const user = useUserStore.getState();
    if (!user.userInfo.id || !user.permissions.length) {
      requests.push(
        getUserRefreshPermissions({ refresh_cache: false }).then(({ code, data }) => {
          if (Number(code) !== 200) throw new Error('Failed to load user');
          setUserInfo(data.user);
          setPermissions(data.permissions);
        }),
      );
    }
    // 用户信息与菜单独立缓存，用户已就绪不能作为跳过菜单请求的依据。
    if (!useMenuStore.getState().menuList.length) {
      requests.push(
        getMenuList().then(({ code, data }) => {
          if (Number(code) !== 200) throw new Error('Failed to load menus');
          setMenuList(data || []);
        }),
      );
    }
    const results = await Promise.allSettled(requests);
    setLoadFailed(results.some((result) => result.status === 'rejected'));
    setLoading(false);
  }, [token, setUserInfo, setPermissions, setMenuList]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 组件卸载时确保关闭进度条（退出登录场景）
  useEffect(() => {
    return () => {
      setTimeout(() => {
        nprogress?.done?.();
      }, 300);
    };
  }, []);

  // 监测是否需要刷新
  useEffect(() => {
    nprogress?.done?.();

    requestAnimationFrame(() => {
      versionCheck(t, messageApi);
    });

    return () => {
      nprogress?.start?.();
    };
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
        z-50!
        ${styles.header}
        ${isCollapsed ? styles['header-close-menu'] : ''}
        ${isMaximize ? styles['header-none'] : ''}
        ${!hasSidebar ? styles['header-no-menu'] : ''}
        ${isPhone ? `!left-0 z-999` : ''}
      `,
    [hasSidebar, isCollapsed, isMaximize, isPhone],
  );

  const contentClassName = useMemo(
    () =>
      `
        overflow-auto
        transition-all
        ${styles.con}
        ${isMaximize ? styles['con-maximize'] : ''}
        ${isCollapsed ? styles['con-close-menu'] : ''}
        ${!hasSidebar ? styles['con-no-menu'] : ''}
        ${isPhone ? `!left-0 !w-full` : ''}
      `,
    [hasSidebar, isMaximize, isCollapsed, isPhone],
  );

  return (
    <div id="layout">
      {contextHolder}
      {hasSidebar && <Menu />}

      <div className={styles.layout_right}>
        <div id="header" className={headerClassName}>
          <Header />
          {hasSidebar && <Tabs aliveRef={keepaliveRef} />}
        </div>
        <div id="layout-content" className={contentClassName}>
          {isLoading && !hasSidebar && (
            <Skeleton active className="p-30px" paragraph={{ rows: 10 }} />
          )}
          {!isLoading && loadFailed && (
            <Result
              status="error"
              title={t('public.loadFailed')}
              extra={<Button onClick={() => void loadData()}>{t('public.reload')}</Button>}
            />
          )}
          {!isLoading && !loadFailed && !hasSidebar && Boolean(token) && <Forbidden />}
          <KeepAlive aliveRef={keepaliveRef} activeCacheKey={currentCacheKey} max={10}>
            {hasSidebar && !loadFailed && (
              <motion.div
                key={deferredPathname}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ErrorBoundary>{outlet}</ErrorBoundary>
              </motion.div>
            )}
          </KeepAlive>
        </div>
      </div>
    </div>
  );
}

export default memo(Layout);
