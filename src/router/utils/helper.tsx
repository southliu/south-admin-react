import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import { ROUTER_EXCLUDE } from './config';

/**
 * 路由添加layout
 * @param routes - 路由数据
 */
export function layoutRoutes(routes: RouteObject[]): RouteObject[] {
  const layouts: RouteObject[] = []; // layout内部组件

  for (let i = 0; i < routes.length; i++) {
    const { path } = routes[i];
    // 路径为登录页不添加layouts
    if (path !== 'login') {
      layouts.push(routes[i]);
    }
  }

  return layouts;
}

/**
 * 处理路由
 * @param routes - 路由数据
 */
export function handleRoutes(routes: Record<string, () => Promise<any>>): RouteObject[] {
  const layouts: RouteObject[] = []; // layout内部组件

  for (const key in routes) {
    // 是否在排除名单中
    const isExclude = handleRouterExclude(key);
    if (isExclude) continue;

    const path = getRouterPage(key);
    if (path === '/login') continue;

    // 使用 React.lazy 包装动态导入的组件
    const LazyComponent = lazy(async () => {
      const module = await routes[key]();
      // 处理不同的模块导出格式
      const Component = module?.default || module;
      return {
        default: Component,
      };
    });

    layouts.push({
      path,
      element: <LazyComponent />,
    });
  }

  return layouts;
}

// 预处理正则表达式，避免重复创建
const ROUTER_EXCLUDE_REGEX = new RegExp(
  ROUTER_EXCLUDE.map((item) => (!item.includes('.') ? `/${item}/` : item)).join('|'),
  'i',
);

/**
 * 匹配路由是否在排查名单中
 * @param path - 路径
 */
function handleRouterExclude(path: string): boolean {
  return ROUTER_EXCLUDE_REGEX.test(path);
}

/**
 * 处理动态参数路由
 * @param path - 路由
 */
const handleRouterDynamic = (path: string): string => {
  path = path.replace(/\[/g, ':');
  path = path.replace(/\]/g, '');

  return path;
};

/**
 * 获取路由路径
 * @param path - 路径
 */
function getRouterPage(path: string): string {
  // 获取page数据后面数据
  const pageIndex = path.indexOf('pages') + 5;
  // 文件后缀
  const lastIndex = path.lastIndexOf('.');
  // 去除pages和文件后缀
  let result = path.substring(pageIndex, lastIndex);

  // 如果是首页则直接返回/
  if (result === '/index') return '/';

  // 如果结尾是index则去除
  if (result.includes('index')) {
    const indexIdx = result.lastIndexOf('index') + 5;
    if (indexIdx === result.length) {
      result = result.substring(0, result.length - 6);
    }
  }

  // 如果是动态参数路由
  if (result.includes('[') && result.includes(']')) {
    result = handleRouterDynamic(result);
  }

  return result;
}
