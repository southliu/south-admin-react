import type { RouteObject } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { handleRoutes } from '../utils/helper';
import { useLocation, useRoutes } from 'react-router-dom';
import Login from '@/pages/login';
import Forget from '@/pages/forget';
import NotFound from '@/pages/404';
import nprogress from 'nprogress';
import Guards from './Guards';

type PageFiles = Record<string, () => Promise<any>>;
const pages = import.meta.glob('../../pages/**/*.tsx', { eager: false }) as PageFiles;

// 预加载组件
const components = import.meta.glob('../../../components/**/*.tsx', { eager: false }) as PageFiles;

// 预加载的路由集合
const preloadedRoutes = new Set<string>();
// 预加载的组件集合
const preloadedComponents = new Set<string>();

function App() {
  const location = useLocation();

  // 预加载路由和组件，在空闲时间加载
  useEffect(() => {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if ('requestIdleCallback' in window) {
      const idleCallbackId = (requestIdleCallback as any)(() => {
        // 预加载页面路由
        Object.entries(pages).forEach(([path]) => {
          if (preloadedRoutes.has(path)) return;
          preloadedRoutes.add(path);
          pages[path]().catch(() => {
            console.error('预加载路由错误：', path);
          });
        });

        // 预加载组件
        Object.entries(components).forEach(([path]) => {
          if (preloadedComponents.has(path)) return;
          preloadedComponents.add(path);
          components[path]().catch(() => {
            console.error('预加载组件错误：', path);
          });
        });
      });

      return () => {
        if ('cancelIdleCallback' in window) {
          (cancelIdleCallback as any)(idleCallbackId);
        }
      };
    }
  }, []);

  // 使用 useMemo 缓存路由配置，避免每次渲染都重新创建
  const routes = useMemo(() => {
    const layouts = handleRoutes(pages);
    const newRoutes: RouteObject[] = [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'forget',
        element: <Forget />,
      },
      {
        path: '',
        element: <Guards />,
        children: layouts,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ];
    return newRoutes;
  }, []);

  // 使用 ref 跟踪进度条状态，避免频繁操作
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 路由切换进度条管理
  useEffect(() => {
    // 清除之前的定时器
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }

    // 路由切换时启动进度条
    nprogress.start();

    // 延迟关闭进度条，避免快速切换时闪烁
    progressTimerRef.current = setTimeout(() => {
      nprogress.done();
      progressTimerRef.current = null;
    }, 100);

    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      nprogress.done();
    };
  }, [location]);

  return <>{useRoutes(routes)}</>;
}

export default App;
