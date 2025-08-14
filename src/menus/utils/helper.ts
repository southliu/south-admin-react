import type { SideMenu } from '#/public';
import type { Langs } from '@/components/I18n';
import { cloneDeep } from 'lodash';
import { LANG } from '@/utils/config';

/**
 * 根据路由获取展开菜单数组
 * @param router - 路由
 */
export function getOpenMenuByRouter(router: string): string[] {
  const arr = splitPath(router),
    result: string[] = [];

  // 取第一个单词大写为新展开菜单key
  if (arr.length > 0) result.push(`/${arr[0]}`);

  // 当路由处于多级目录时
  if (arr.length > 2) {
    let str = '/' + arr[0];
    for (let i = 1; i < arr.length - 1; i++) {
      str += '/' + arr[i];
      result.push(str);
    }
  }

  return result;
}

/**
 * 匹配路径内的字段
 * @param path - 路径
 * @param arr - 路径经过数组
 */
function matchPath(lang: Langs, path: string, arr: MenuPath[]): string[] {
  const result: string[] = [];

  // 分割路径
  const pathArr = splitPath(path);
  let left = 0;
  const right = pathArr.length;

  for (let i = 0; i < arr.length; i++) {
    const { path } = arr[i];
    if (path?.[left] === pathArr[left]) {
      result.push(lang === 'en' ? arr[i].labelEn : arr[i].label);
      if (left < right - 1) left++;
    }
    if (left === right) return result;
  }

  return result;
}

/**
 * 分割路径且去除首个字符串
 * @param path - 路径
 */
export function splitPath(path: string): string[] {
  // 路径为空或非字符串格式则返回空数组
  if (!path || typeof path !== 'string') return [];
  // 分割路径
  const result = path?.split('/') || [];
  // 去除第一个空字符串
  if (result?.[0] === '') result.shift();
  return result;
}

/**
 * 搜索相应菜单值
 * @param menus - 菜单
 * @param permissions - 权限列表
 * @param value - 匹配值
 * @param currentPath - 当前路径
 * @param result - 返回值
 */

interface MenuPath {
  label: string;
  labelZh: string;
  labelEn: string;
  path: string[];
}
interface SearchMenuProps {
  menus: SideMenu[] | undefined;
  permissions: string[];
  value: string;
  currentPath?: MenuPath[];
  result?: SideMenu[];
}

/**
 * 搜索菜单数据
 * @param data - 菜单、权限和搜索值等数据
 */
export function searchMenuValue(data: SearchMenuProps): SideMenu[] {
  const { menus, permissions, value } = data;
  let { currentPath, result } = data;
  if (!menus?.length || !value) return [];
  if (!currentPath) currentPath = [];
  if (!result) result = [];
  const lang = localStorage.getItem(LANG);

  for (let i = 0; i < menus.length; i++) {
    const { key, label, labelZh, labelEn, children } = menus[i];
    // 如果存在子数组则递归
    if (hasChildren(menus[i])) {
      currentPath.push({
        label,
        labelZh: labelZh || label,
        labelEn,
        path: splitPath(key),
      });

      // 递归子数组，返回结果
      const childrenData = {
        menus: children,
        permissions,
        value,
        currentPath,
        result,
      };
      const childResult = searchMenuValue(childrenData);

      // 当子数组返回值有值时则合并数组
      if (childResult.length) {
        result.concat(childResult);
      } else {
        currentPath.pop();
      }
    } else if (
      ((lang === 'en' &&
        menus[i]?.labelEn?.toLocaleUpperCase()?.includes(value?.toLocaleUpperCase())) ||
        (lang !== 'en' &&
          (menus[i]?.labelZh?.includes(value) || menus[i]?.label?.includes(value)))) &&
      hasPermission(menus[i], permissions)
    ) {
      // 匹配到value值时添加到result中
      const { label, labelZh, labelEn, key } = menus[i];
      currentPath.push({
        label: label,
        labelZh: labelZh || label,
        labelEn: labelEn,
        path: splitPath(key),
      });
      const nav = matchPath(lang as Langs, key, currentPath);
      result.push({ label, labelZh, labelEn, key, nav });
    }
  }

  return result;
}

export interface NavData {
  label: string;
  labelZh: string;
  labelEn: string;
}
interface GetMenuByKeyResult {
  label: string;
  labelZh: string;
  labelEn: string;
  key: string;
  nav: NavData[];
}
interface GetMenuByKeyProps {
  menus: SideMenu[] | undefined;
  permissions: string[];
  key: string;
  fatherNav?: NavData[];
  result?: GetMenuByKeyResult;
}

/**
 * 根据key获取菜单当前值
 * @param menus - 菜单
 * @param permissions - 权限列表
 * @param key - 路由值
 * @param fatherNav - 父级面包屑
 * @param result - 返回值
 */
export function getMenuByKey(data: GetMenuByKeyProps): GetMenuByKeyResult | undefined {
  const { menus, permissions, key } = data;
  const lang = localStorage.getItem(LANG);
  let { fatherNav, result } = data;
  if (!menus?.length) return result;
  if (!fatherNav) fatherNav = [];
  if (!result?.key)
    result = {
      key: '',
      label: '',
      labelZh: '',
      labelEn: '',
      nav: [],
    };

  for (let i = 0; i < menus.length; i++) {
    if (!key || (result as GetMenuByKeyResult).key) return result;

    const { label, labelZh, labelEn, children } = menus[i];
    const currentLabel = lang === 'en' ? labelEn : labelZh || label;

    // 过滤子数据中值
    if (hasChildren(menus[i])) {
      fatherNav.push({
        label: currentLabel,
        labelZh: labelZh || label,
        labelEn,
      });

      // 递归子数组，返回结果
      const childProps = {
        menus: children,
        permissions,
        key,
        fatherNav,
        result,
      };
      const childResult = getMenuByKey(childProps);

      // 当子数组返回值
      if (childResult?.key) {
        result = childResult;
      } else {
        // 下次递归前删除面包屑前一步错误路径
        fatherNav.pop();
      }
    } else if (menus[i]?.key === key && hasPermission(menus[i], permissions)) {
      const { key } = menus[i];
      fatherNav.push({
        label: currentLabel,
        labelZh: labelZh || label,
        labelEn,
      });
      if (key)
        result = {
          label,
          labelZh: labelZh || label,
          labelEn,
          key,
          nav: fatherNav,
        };
    }
  }

  return result;
}

/**
 * 获取菜单名
 * @param list - 菜单列表
 * @param path - 路径
 * @param lang - 语言
 */
export const getMenuName = (list: SideMenu[], path: string, lang: string) => {
  let result = '';

  const deepData = (list: SideMenu[], path: string) => {
    if (result) return result;

    for (let i = 0; i < list?.length; i++) {
      const item = list[i];

      if (item.key === path) {
        result = lang === 'en' ? item.labelEn : item.labelZh || item.label;
        return result;
      }

      if (item.children?.length) {
        const childResult = deepData(item.children, path);
        if (childResult) {
          result = childResult;
          return result;
        }
      }
    }

    return result;
  };
  deepData(list, path);

  return result;
};

/**
 * 过滤权限菜单
 * @param menus - 菜单
 * @param permissions - 权限列表
 */
export function filterMenus(menus: SideMenu[], permissions: string[]): SideMenu[] {
  const result: SideMenu[] = [];
  const newMenus = cloneDeep(menus);
  const lang = localStorage.getItem(LANG);

  for (let i = 0; i < newMenus.length; i++) {
    const item = newMenus[i];
    // 处理子数组
    if (hasChildren(item)) {
      const result = filterMenus(item.children as SideMenu[], permissions);

      // 有子权限数据则保留
      item.children = result?.length ? result : undefined;
    }

    // 有权限或有子数据累加
    if (hasPermission(item, permissions) || hasChildren(item)) {
      if (lang === 'en') {
        item.labelZh = item.labelZh || item.label;
        item.label = item.labelEn;
      }
      result.push(item);
    }
  }

  return result;
}

/**
 * 获取第一个有效权限路由
 * @param menus - 菜单
 * @param permissions - 权限
 */
export function getFirstMenu(menus: SideMenu[], permissions: string[], result = ''): string {
  // 有结构时直接返回
  if (result) return result;

  for (let i = 0; i < menus.length; i++) {
    // 处理子数组
    if (hasChildren(menus[i]) && !result) {
      const childResult = getFirstMenu(menus[i].children as SideMenu[], permissions, result);

      // 有结果则赋值
      if (childResult) {
        result = childResult;
        return result;
      }
    }

    // 有权限且没有有子数据
    if (hasPermission(menus[i], permissions) && !hasChildren(menus[i]) && !result)
      result = menus[i].key;
  }

  return result;
}

/**
 * 获取子数据的key
 * @param menus - 菜单数据
 * @param level - 层级
 */
function getChildrenKey(menus: SideMenu[] | undefined, level: number) {
  if (!menus?.length) return 'none';
  let result = '';

  const deep = (menus: SideMenu[], level: number) => {
    if (result) return result;
    const newLevel = level + 1;

    for (let i = 0; i < menus?.length; i++) {
      const item = menus[i];
      if (item.key) {
        const arr = item.key.split('/');
        for (let j = 1; j < arr?.length && j <= newLevel; j++) {
          const key = arr[j];
          result += `/${key}`;
        }
        return result;
      }

      if (item.children) {
        deep(item.children, newLevel);
      }
    }
  };
  deep(menus, level);

  return result;
}

/**
 * 菜单数据处理-去除多余字段
 * @param menus - 菜单数据
 * @param level - 层级
 */
export function handleFilterMenus(menus: SideMenu[], level = 0): SideMenu[] {
  const currentItem: SideMenu[] = [];

  for (let i = 0; i < menus?.length; i++) {
    const item = menus[i];
    let children: SideMenu[] = [];

    // 如果菜单children为空数组则删除
    if (item.children !== undefined && !item.children?.length) {
      delete item.children;
    }

    if (item.children?.length) {
      const newLevel = level + 1;
      children = handleFilterMenus(item.children, newLevel);
    }

    const data: Partial<SideMenu> = { ...item };
    if (children?.length) (data as SideMenu).children = children;
    if (!data.key) data.key = getChildrenKey(data.children, level);
    delete data.labelZh;
    delete data.labelEn;

    currentItem.push(data as SideMenu);
  }

  return currentItem;
}

/**
 * 路由是否权限
 * @param route - 路由
 * @param permissions - 权限
 */
function hasPermission(route: SideMenu, permissions: string[]): boolean {
  return permissions?.includes(route?.rule || '');
}

/**
 * 是否有子路由
 * @param route - 路由
 */
function hasChildren(route: SideMenu): boolean {
  return Boolean(route.children?.length);
}
