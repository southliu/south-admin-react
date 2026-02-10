import { useEffect, useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from '@south/message';
import { getLocalInfo } from '@south/utils';
import { TOKEN } from '@/utils/config';
import { Spin } from 'antd';
import nprogress from 'nprogress';

// 懒加载 Layout 组件，减少首屏加载体积
const Layout = lazy(() => import('@/layouts'));

// 同步方式获取token
function getTokenSync() {
  try {
    return getLocalInfo<string>(TOKEN) || '';
  } catch {
    return '';
  }
}

function Guards() {
  const { t } = useTranslation();
  const outlet = useOutlet();
  const navigate = useNavigate();
  const location = useLocation();

  // 同步检查权限，避免异步导致的页面闪动
  const { token, isValid, shouldRedirect, redirectPath } = useMemo(() => {
    const token = getTokenSync();
    const isLoginRoute = location.pathname === '/login';

    // 有token且访问登录页，需要重定向到首页
    if (token && isLoginRoute) {
      const redirect = new URLSearchParams(location.search).get('redirect');
      return {
        token,
        isValid: false,
        shouldRedirect: true,
        redirectPath: redirect || '/',
      };
    }

    // 无token且访问非登录页，需要重定向到登录页
    if (!token && !isLoginRoute) {
      const param =
        location.pathname?.length > 1 ? `?redirect=${location.pathname}${location.search}` : '';
      return {
        token,
        isValid: false,
        shouldRedirect: true,
        redirectPath: `/login${param}`,
      };
    }

    // 其他情况正常渲染
    return { token, isValid: !!token || isLoginRoute, shouldRedirect: false, redirectPath: '' };
  }, [location.pathname, location.search]);

  const [redirected, setRedirected] = useState(false);
  const isRedirectingRef = useRef(false);

  useEffect(() => {
    // 防止重复重定向
    if (shouldRedirect && !isRedirectingRef.current) {
      isRedirectingRef.current = true;
      nprogress.start();

      // 执行重定向
      navigate(redirectPath, { replace: true });
      setRedirected(true);

      // 如果是跳转到登录页，显示提示信息
      if (redirectPath.startsWith('/login') && location.pathname !== '/') {
        message.warning({
          content: t('public.noLoginVisit'),
          key: 'noLoginVisit',
        });
      }

      // 延迟关闭进度条，确保路由切换完成
      const timer = setTimeout(() => {
        nprogress.done();
        isRedirectingRef.current = false;
      }, 100);

      return () => {
        clearTimeout(timer);
        nprogress.done();
      };
    }
  }, [shouldRedirect, redirectPath, navigate, location.pathname, t]);

  // 重定向时不渲染任何内容
  if (shouldRedirect || redirected) {
    return (
      <div className="absolute left-50% top-50% -translate-x-1/2 -translate-y-1/2 text-center">
        <Spin spinning={true} />
      </div>
    );
  }

  // 使用 useMemo 缓存 Layout 组件，只在 token 和 isValid 变化时重新渲染
  const layoutElement = useMemo(() => {
    if (isValid && token) {
      return (
        <Suspense
          fallback={
            <div className="absolute left-50% top-50% -translate-x-1/2 -translate-y-1/2 text-center">
              <Spin spinning={true} />
            </div>
          }
        >
          <Layout />
        </Suspense>
      );
    }
    return null;
  }, [token, isValid]);

  // 渲染页面内容
  if (location.pathname === '/login' && token) {
    return <div>{outlet}</div>;
  }

  if (layoutElement) {
    return layoutElement;
  }

  return <div>{outlet}</div>;
}

export default Guards;
