import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { message } from '@south/message';
import { getLocalInfo } from '@south/utils';
import { TOKEN } from '@/utils/config';
import { Spin } from 'antd';
import nprogress from 'nprogress';
import Layout from '@/layouts';

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

  useEffect(() => {
    nprogress.start();

    if (shouldRedirect) {
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
      nprogress.done();
      return;
    }

    nprogress.done();

    return () => {
      nprogress.start();
    };
  }, [shouldRedirect, redirectPath, navigate]);

  // 重定向时不渲染任何内容
  if (shouldRedirect || redirected) {
    return (
      <div className="absolute left-50% top-50% -translate-x-1/2 -translate-y-1/2 text-center">
        <Spin spinning={true} />
      </div>
    );
  }

  /** 渲染页面 */
  const renderPage = () => {
    // 访问登录页且有token，但useEffect还没执行跳转时
    if (location.pathname === '/login' && token) {
      return <div>{outlet}</div>;
    }

    // 有权限访问其他页面，渲染布局
    if (isValid && token) {
      return <Layout />;
    }

    // 无权限或跳转情况，渲染登录页
    return <div>{outlet}</div>;
  };

  return <>{renderPage()}</>;
}

export default Guards;
