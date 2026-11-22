import { encryption, decryption } from './crypto';
import { message } from '@south/message';

/** @description: localStorage封装 */

// 默认缓存期限为2天
const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 2;

interface StorageData {
  value: unknown;
  expire: number | null;
}

/**
 * 设置本地缓存
 * @param key - 唯一值
 * @param value - 缓存值
 * @param expire - 缓存期限
 */
export function setLocalInfo(
  key: string,
  value: unknown,
  expire: number | null = DEFAULT_CACHE_TIME,
) {
  // 缓存时间
  const time = expire !== null ? new Date().getTime() + expire * 1000 : null;
  // 缓存数据
  const data: StorageData = { value, expire: time };
  const json = encryption(data);
  localStorage.setItem(key, json);
}

/**
 * 获取本地缓存数据
 * @param key - 唯一值
 */
export function getLocalInfo<T>(key: string) {
  const json = localStorage.getItem(key);

  if (json) {
    let data: StorageData | null = null;
    try {
      data = decryption(json);
    } catch {
      // 解密失败
      message.error({ content: '数据解密失败', key: 'decryption' });
    }

    // 当有数据时
    if (data) {
      const { value, expire } = data;
      // 在有效期内直接返回
      if (expire === null || expire >= Date.now()) {
        return value as T;
      }
    }

    // 缓存过期或无数据清空当前本地缓存
    removeLocalInfo(key);
    return null;
  }
  return null;
}

/**
 * 移除指定本地缓存
 * @param key - 唯一值
 */
export function removeLocalInfo(key: string) {
  localStorage.removeItem(key);
}

/** 清空本地缓存 */
export function clearLocalInfo() {
  localStorage.clear();
}
