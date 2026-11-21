import { useCallback, useEffect, useMemo, useState, memo, Suspense } from 'react';
import { getUserRefreshPermissions } from '@/servers/system/user';
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useMenuStore, useUserStore } from '@/stores';
import { resolveErrorMessage } from '@south/request';
import { loadMenuList } from '@/menus/utils/load';
import { usePublicStore } from '@/stores/public';
import { Button, Result, message } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { versionCheck } from './utils/helper';
import { useOutlet } from 'react-router-dom';
import { useShallow } from 'zustand/shallow';
import { useToken } from '@/hooks/useToken';
import { debounce } from 'lodash';
import ContentLoading from './components/ContentLoading';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import styles from './index.module.less';
import Menu from './components/Menu';
import Tabs from './components/Tabs';
import Forbidden from '@/pages/403';
import nprogress from 'nprogress';
import axios from 'axios';

function Layout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
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
  const [isLoading, setLoading] = useState(true);
  const [isLoadFailed, setLoadFailed] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [getToken] = useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const token = getToken();
  const outlet = useOutlet();
  const keepaliveRef = useKeepAliveRef();
  const setAliveRef = usePublicStore(useShallow((state) => state.setAliveRef));
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const hasSidebar = permissions.length > 0 && menuList.length > 0;

  // 只在 ref 变化时更新 store，避免每次渲染都触发更新
  useEffect(() => {
    if (keepaliveRef.current && !aliveRef.current) {
      setAliveRef(keepaliveRef);
    }
  }, [aliveRef, keepaliveRef, setAliveRef]);

  const loadData = useCallback(async () => {
    if (!token) return;
    const requests: Promise<boolean>[] = [];
    const user = useUserStore.getState();
    if (!user.userInfo.id || !user.permissions.length) {
      requests.push(
        getUserRefreshPermissions({ refresh_cache: false }).then((response) => {
          const { code, data } = response;
          if (Number(code) !== 200) {
            setLoadError(resolveErrorMessage(response, t('public.networkError')));
            return false;
          }
          if (getToken() !== token) return false;
          setUserInfo(data.user);
          setPermissions(data.permissions);
          return true;
        }),
      );
    }
    // 用户信息与菜单独立缓存，用户已就绪不能作为跳过菜单请求的依据。
    if (!useMenuStore.getState().menuList.length) {
      requests.push(
        loadMenuList().then((response) => {
          const { code, data } = response;
          if (Number(code) !== 200) {
            setLoadError(resolveErrorMessage(response, t('public.networkError')));
            return false;
          }
          if (getToken() !== token) return false;
          setMenuList(data || []);
          return true;
        }),
      );
    }
    const results = await Promise.allSettled(requests);
    if (getToken() !== token) return;
    const rejected = results.find((result) => result.status === 'rejected');
    if (rejected?.status === 'rejected') {
      setLoadError(
        resolveErrorMessage(
          axios.isAxiosError(rejected.reason) ? rejected.reason.response?.data : undefined,
          t('public.networkError'),
        ),
      );
    }
    setLoadFailed(results.some((result) => result.status === 'rejected' || !result.value));
    setLoading(false);
  }, [token, getToken, setUserInfo, setPermissions, setMenuList, t]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadData();
    });
    return () => {
      active = false;
    };
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
  const handleIsPhone = useMemo(
    () =>
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
          {isLoading && <ContentLoading />}
          {!isLoading && isLoadFailed && (
            <Result
              status="error"
              title={loadError || t('public.networkError')}
              extra={
                <Button
                  onClick={() => {
                    setLoading(true);
                    setLoadFailed(false);
                    setLoadError(undefined);
                    void loadData();
                  }}
                >
                  {t('public.reload')}
                </Button>
              }
            />
          )}
          {!isLoading && !isLoadFailed && !hasSidebar && Boolean(token) && <Forbidden />}
          <KeepAlive aliveRef={keepaliveRef} activeCacheKey={pathname} max={10}>
            {hasSidebar && !isLoading && !isLoadFailed && (
              <ErrorBoundary>
                <Suspense fallback={<ContentLoading />}>
                  <div
                    key={pathname}
                    className={styles['page-enter']}
                  >
                    {outlet}
                  </div>
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
