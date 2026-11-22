import type { RouteObject } from 'react-router-dom';
import type { ComponentType } from 'react';
import { lazy, Suspense, useMemo } from 'react';
import { handleRoutes } from '../utils/helper';
import { useRoutes } from 'react-router-dom';
import ContentLoading from '@/layouts/components/ContentLoading';
import Login from '@/pages/login';
import Guards from './Guards';

const Forget = lazy(() => import('@/pages/forget'));
const NotFound = lazy(() => import('@/pages/404'));

type PageFiles = Record<string, () => Promise<{ default: ComponentType }>>;
const pages = import.meta.glob('../../pages/**/*.tsx', { eager: false }) as PageFiles;

function App() {
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
        element: (
          <Suspense fallback={<ContentLoading />}>
            <Forget />
          </Suspense>
        ),
      },
      {
        path: '',
        element: <Guards />,
        children: layouts,
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<ContentLoading />}>
            <NotFound />
          </Suspense>
        ),
      },
    ];
    return newRoutes;
  }, []);

  return <>{useRoutes(routes)}</>;
}

export default App;
