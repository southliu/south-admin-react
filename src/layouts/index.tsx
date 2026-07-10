import { useToken } from '@/hooks/useToken';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  memo,
  useDeferredValue,
  Suspense,
  useRef,
} from 'react';
import { useOutlet } from 'react-router-dom';
import { Skeleton, message } from 'antd';
import { debounce } from 'lodash';
import { useShallow } from 'zustand/shallow';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { versionCheck } from './utils/helper';
import { getMenuList } from '@/servers/system/menu';
import { useMenuStore, useUserStore } from '@/stores';
import { getUserRefreshPermissions } from '@/servers/system/user';
import type { LoginResult } from '@/pages/login/model';
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react';
import { useCommonStore } from '@/hooks/useCommonStore';
import nprogress from 'nprogress';
import Menu from './components/Menu';
import Header from './components/Header';
import Tabs from './components/Tabs';
import Forbidden from '@/pages/403';
import ErrorBoundary from './components/ErrorBoundary';
import styles from './index.module.less';

const BOOTSTRAP_CACHE_KEY = 'layout-bootstrap';

interface BootstrapCache {
  user: LoginResult['user'];
  permissions: string[];
  menuList: SideMenu[];
}

function readBootstrapCache(): BootstrapCache | null {
  try {
    const rawCache = sessionStorage.getItem(BOOTSTRAP_CACHE_KEY);
    if (!rawCache) return null;

    const cache = JSON.parse(rawCache) as BootstrapCache;
    const isValid =
      cache.user?.id &&
      Array.isArray(cache.permissions) &&
      cache.permissions.length > 0 &&
      Array.isArray(cache.menuList) &&
      cache.menuList.length > 0;

    return isValid ? cache : null;
  } catch {
    return null;
  }
}

function writeBootstrapCache(cache: BootstrapCache) {
  try {
    sessionStorage.setItem(BOOTSTRAP_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage is optional; a blocked quota must not prevent the page from loading.
  }
}

function Layout() {
  const [getToken] = useToken();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const token = getToken();
  const outlet = useOutlet();
  const keepaliveRef = useKeepAliveRef();
  const [isLoading, setLoading] = useState(true);
  const bootstrapCacheRef = useRef<BootstrapCache | null>(readBootstrapCache());
  const [messageApi, contextHolder] = message.useMessage();
  const setAliveRef = usePublicStore(useShallow((state) => state.setAliveRef));
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { setPermissions, setUserInfo, userInfo } = useUserStore(
    useShallow((state) => ({
      setPermissions: state.setPermissions,
      setUserInfo: state.setUserInfo,
      userInfo: state.userInfo,
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

  const { permissions, userId, isMaximize, isCollapsed, isPhone } = useCommonStore();

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

  /** 获取用户信息和权限 */
  const getUserInfo = useCallback(async () => {
    try {
      const { code, data } = await getUserRefreshPermissions({ refresh_cache: false });
      if (Number(code) !== 200) return null;
      const { user, permissions } = data;
      setUserInfo(user);
      setPermissions(permissions);
      return { user, permissions };
    } catch (err) {
      console.error('获取用户数据失败:', err);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 获取菜单数据 */
  const getMenuData = useCallback(async () => {
    try {
      const { code, data } = await getMenuList();
      if (Number(code) !== 200) return null;
      setMenuList(data || []);
      return data || [];
    } catch (err) {
      console.error('Failed to load menu bootstrap data:', err);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 当用户信息缓存不存在时则重新获取
    if (!token) return;

    if (userId) {
      if (permissions.length && menuList.length) {
        writeBootstrapCache({ user: userInfo, permissions, menuList });
      }
      return;
    }

    const cachedBootstrap = bootstrapCacheRef.current;
    if (cachedBootstrap) {
      setUserInfo(cachedBootstrap.user);
      setPermissions(cachedBootstrap.permissions);
      setMenuList(cachedBootstrap.menuList);
      setLoading(false);
    }

    let isUnmounted = false;

    const initializeLayout = async () => {
      if (!cachedBootstrap) setLoading(true);

      const [userData, menuData] = await Promise.all([getUserInfo(), getMenuData()]);
      if (isUnmounted) return;

      if (userData && menuData?.length) {
        writeBootstrapCache({
          user: userData.user,
          permissions: userData.permissions,
          menuList: menuData,
        });
      }

      setLoading(false);
    };

    initializeLayout();

    return () => {
      isUnmounted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {permissions.length > 0 && menuList.length > 0 && <Menu />}

      <div className={styles.layout_right}>
        <div id="header" className={headerClassName}>
          <Header />
          {permissions.length > 0 && menuList.length > 0 && <Tabs aliveRef={keepaliveRef} />}
        </div>
        <div id="layout-content" className={contentClassName}>
          {isLoading && permissions.length === 0 && (
            <Skeleton active className="p-30px" paragraph={{ rows: 10 }} />
          )}
          {!isLoading && permissions.length === 0 && <Forbidden />}
          <KeepAlive aliveRef={keepaliveRef} activeCacheKey={currentCacheKey} max={10}>
            {permissions.length > 0 && (
              <motion.div
                key={deferredPathname}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
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
              </motion.div>
            )}
          </KeepAlive>
        </div>
      </div>
    </div>
  );
}

export default memo(Layout);
