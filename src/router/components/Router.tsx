import type { RouteObject } from 'react-router-dom';
import { useMemo, type ComponentType } from 'react';
import { handleRoutes } from '../utils/helper';
import { useRoutes } from 'react-router-dom';
import Forget from '@/pages/forget';
import NotFound from '@/pages/404';
import Login from '@/pages/login';
import Guards from './Guards';

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
