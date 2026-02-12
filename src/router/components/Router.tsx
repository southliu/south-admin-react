import type { RouteObject } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { handleRoutes } from '../utils/helper';
import { useRoutes } from 'react-router-dom';
import Login from '@/pages/login';
import Forget from '@/pages/forget';
import NotFound from '@/pages/404';
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

  return <>{useRoutes(routes)}</>;
}

export default App;
