import type { ArrayData } from '#/public';
import type { Constant } from './constants';
import type { TFunction } from 'i18next';
import { TITLE_SUFFIX } from '@/utils/config';

/**
 * 首字母大写
 * @param str - 传入英文字符串
 */
export function firstCapitalize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * 金额格式化3000->3,000
 * @param amount - 金额
 */
export function amountFormatter(amount: number) {
  return `${amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 生成随机数
 * @param min - 最小值
 * @param max - 最大值
 */
export function randomNum(min: number, max: number): number {
  const num = Math.floor(Math.random() * (min - max) + max);
  return num;
}

/**
 * 值转化为label
 * @param value - 值
 * @param arr - 常量值
 */
export function valueToLabel(value: string | number | boolean, arr: Constant[]): string {
  for (let i = 0; i < arr?.length; i++) {
    if (arr[i].value === value) {
      return arr[i].label;
    }
  }

  return '';
}

/**
 * 获取url中的全部参数
 * @param search - url参数
 */

export function getUrlAllParam(search: string): Record<string, string> {
  if (!search) return {};
  // 去除首个字符串问号
  if (search?.[0] === '?') search = search.substring(1, search.length);

  const arr = search.split('&'); // 分割数组
  const result: Record<string, string> = {};

  for (let i = 0; i < arr.length; i++) {
    const value = arr[i]?.split('=');
    if (value?.length === 2) {
      result[value[0]] = value[1];
    }
  }

  return result;
}

/**
 * 获取url中参数某个值
 * @param search - url参数
 * @param key - 搜索值
 */
export function getUrlParam(search: string, key: string) {
  if (!search || !key) return '';
  // 去除首个字符串问号
  if (search?.[0] === '?') search = search.substring(1, search.length);
  const urlParams = getUrlAllParam(search);
  return urlParams?.[key] || '';
}

/**
 * 过滤空数据
 * @param obj - 传入对象
 */
type EmptyData = Record<string, unknown>;
export function filterEmptyValue(obj: EmptyData): EmptyData {
  const res: EmptyData = {};

  for (let key in obj) {
    // 去除key中多余的空格
    key = key.trim();

    // undefined过滤
    if (obj[key] === undefined) continue;

    // null过滤
    if (obj[key] === null) continue;

    // 空数组过滤
    if (obj[key]?.constructor === Array && (obj[key] as ArrayData).length === 0) continue;

    // 空字符串过滤
    if (obj[key]?.constructor === String && (obj[key] as string).length === 0) continue;

    // 空对象过滤
    if (obj[key]?.constructor === Object && Object.keys(obj[key] as object).length === 0) continue;

    // 去除字符串多余空格
    if (obj[key]?.constructor === String) {
      res[key] = (obj[key] as string).trim();
    } else {
      res[key] = obj[key];
    }
  }

  return res;
}

/**
 * 递归数据
 * @param data - 数据源
 */
interface RecursiveChildren<T> {
  children?: T[];
}
export function recursiveData<T extends RecursiveChildren<T>, U>(
  data: T[],
  callback: (data: T) => U,
): U[] {
  if (data.length === 0) return [];
  const res: U[] = [];

  for (let i = 0; i < data.length; i++) {
    const element = data[i];
    const filterData = callback(element);
    const children = element.children ? recursiveData(element.children, callback) : undefined;
    res.push({ ...filterData, children });
  }

  return res;
}

/**
 * 设置标题
 * @param t - 国际化
 * @param title - 标题
 */
export function setTitle(t: TFunction, title: string) {
  const value = `${title ? title + '-' : ''}${TITLE_SUFFIX(t)}`;
  if (document.title === value) return;
  document.title = value;
}
