import { useToken } from '@/hooks/useToken';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useOutlet } from 'react-router-dom';
import { Skeleton, message } from 'antd';
import { Icon } from '@iconify/react';
import { debounce } from 'lodash';
import { useLocation } from 'react-router-dom';
import { versionCheck } from './utils/helper';
import { getMenuList } from '@/servers/system/menu';
import { useMenuStore, useUserStore } from '@/stores';
import { getPermissions } from '@/servers/permissions';
import { useCommonStore } from '@/hooks/useCommonStore';
import KeepAlive from 'react-activation';
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
  const [isLoading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const { setPermissions, setUserInfo } = useUserStore((state) => state);
  const { setMenuList, toggleCollapsed, togglePhone } = useMenuStore((state) => state);

  const { permissions, userId, isMaximize, isCollapsed, isPhone, isRefresh } = useCommonStore();

  /** 获取用户信息和权限 */
  const getUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      const { code, data } = await getPermissions({ refresh_cache: false });
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
  const handleIsPhone = debounce(() => {
    const isPhone = window.innerWidth <= 768;
    // 手机首次进来收缩菜单
    if (isPhone) toggleCollapsed(true);
    togglePhone(isPhone);
  }, 500);

  // 监听是否是手机端
  useEffect(() => {
    handleIsPhone();
    window.addEventListener('resize', handleIsPhone);

    return () => {
      window.removeEventListener('resize', handleIsPhone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="layout">
      {contextHolder}
      <Menu />
      <div className={styles.layout_right}>
        <div
          id="header"
          className={`
            border-bottom
            transition-all
            ${styles.header}
            ${isCollapsed ? styles['header-close-menu'] : ''}
            ${isMaximize ? styles['header-none'] : ''}
            ${isPhone ? `!left-0 z-999` : ''}
          `}
        >
          <Header />
          <Tabs />
        </div>
        <div
          id="layout-content"
          className={`
            overflow-auto
            transition-all
            ${styles.con}
            ${isMaximize ? styles['con-maximize'] : ''}
            ${isCollapsed ? styles['con-close-menu'] : ''}
            ${isPhone ? `!left-0 !w-full` : ''}
          `}
        >
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
          {permissions.length > 0 && (
            <ErrorBoundary key={pathname}>
              {/* 限制最多缓存10个页面，避免过多页面导致卡顿 */}
              <KeepAlive id={pathname} name={pathname} max={10} strategy="LRU">
                <div
                  className={`
                  content-transition
                `}
                >
                  <Suspense
                    fallback={
                      <div className="p-30px">
                        <Skeleton active paragraph={{ rows: 10 }} />
                      </div>
                    }
                  >
                    {outlet}
                  </Suspense>
                </div>
              </KeepAlive>
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}

export default Layout;
