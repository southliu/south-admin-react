import type { TFunction } from 'i18next';

// 对应 south-admin-fastApi 的 sys_* 字段与 schemas/fields.py。
export const USER_LENGTH = { username: 100, name: 100, phone: 20, email: 100, password: 72 };
export const MENU_LENGTH = { label: 50, labelEn: 50, icon: 100, router: 255, rule: 100 };
export const ROLE_LENGTH = { name: 50, description: 65535 };
export const LOG_LENGTH = { username: 100, ip: 50 };
export const ARTICLE_LENGTH = { title: 200, author: 100, content: 65535 };

export function utf8ByteRule(t: TFunction, max: number) {
  return {
    validator: (_: unknown, value: unknown) => {
      if (typeof value !== 'string' || new TextEncoder().encode(value).length <= max)
        return Promise.resolve();
      return Promise.reject(new Error(t('public.byteLimit', { max })));
    },
  };
}
