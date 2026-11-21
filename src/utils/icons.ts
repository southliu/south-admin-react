import { addCollection, getIcon, setCustomIconLoader } from '@iconify/react';
import initialIcons from '@/assets/icons.json';
import i18n from '@/locales/config';

for (const collection of Object.values(initialIcons)) addCollection(collection);

const prefixes = [
  'ant-design',
  'cil',
  'gg',
  'gridicons',
  'icon-park',
  'icon-park-outline',
  'ion',
  'mdi',
  'uil',
  'la',
  'fluent',
  'majesticons',
  'material-symbols',
];
const pendingCollections = new Map<string, Promise<void>>();

// 完整集合由构建脚本输出为本站静态 JSON，不进入首屏或 legacy JS。
for (const prefix of prefixes) {
  setCustomIconLoader(async (name) => {
    let pending = pendingCollections.get(prefix);
    if (!pending) {
      pending = fetch(`${import.meta.env.BASE_URL}icons/${prefix}.json`)
        .then(async (response) => {
          if (!response.ok) throw new Error(i18n.t('public.networkError'));
          addCollection(await response.json());
        })
        .catch((error: unknown) => {
          pendingCollections.delete(prefix);
          throw error;
        });
      pendingCollections.set(prefix, pending);
    }
    await pending;
    return getIcon(`${prefix}:${name}`) || null;
  }, prefix);
}
