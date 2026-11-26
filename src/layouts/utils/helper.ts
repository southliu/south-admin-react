import type { MessageInstance } from 'antd/es/message/interface';
import type { TabsData } from '@/stores/tabs';
import type { TFunction } from 'i18next';
import { LANG } from '@/utils/config';
import axios from 'axios';

let isRefreshScheduled = false;
let isChecking = false;
// 比较实际加载的构建，不能用首次响应给旧页面建立“最新”基准。
const currentVersion = import.meta.env.VITE_BUILD_VERSION;

/**
 * 版本监控
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param messageApi - 消息提示实例，用于展示版本更新提醒
 */
export const versionCheck = async (t: TFunction, messageApi: MessageInstance) => {
  if (import.meta.env.MODE === 'development' || !currentVersion || isRefreshScheduled || isChecking)
    return;

  isChecking = true;
  try {
    const {
      data: { version },
    } = await axios.get(`${import.meta.env.BASE_URL}version.json`, {
      // 添加超时和强制刷新参数
      timeout: 5000,
      params: { t: Date.now() },
    });

    if ((typeof version !== 'string' && typeof version !== 'number') || !String(version).trim())
      return;
    const target = new URL(window.location.href);
    const isHashRouter = target.hash.startsWith('#/');
    const route = isHashRouter ? new URL(target.hash.slice(1), target.origin) : target;
    const legacyVersion = isHashRouter ? target.searchParams.get('__app_version') : null;
    if (legacyVersion !== null) {
      if (!route.searchParams.has('__app_version')) {
        route.searchParams.set('__app_version', legacyVersion);
      }
      target.searchParams.delete('__app_version');
      target.hash = `${route.pathname}${route.search}`;
      window.history.replaceState(window.history.state, '', target.href);
    }
    const latestVersion = String(version);

    if (currentVersion !== latestVersion && !isRefreshScheduled) {
      // 同一版本已尝试绕过首页缓存时，不因服务器部署不一致而反复刷新。
      if (route.searchParams.get('__app_version') === latestVersion) return;
      route.searchParams.set('__app_version', latestVersion);
      if (isHashRouter) target.hash = `${route.pathname}${route.search}`;
      const seconds = Math.floor(Math.random() * 3) + 1;
      isRefreshScheduled = true;
      setTimeout(() => {
        if (isHashRouter) {
          // 仅改变 Hash 不会重新加载构建，更新地址后必须显式整页刷新。
          window.history.replaceState(window.history.state, '', target.href);
          window.location.reload();
        } else {
          window.location.replace(target.href);
        }
      }, seconds * 1000);
      messageApi.info({
        content: t('public.reloadPageMsg', { seconds }),
        key: 'reload',
        duration: seconds,
      });
    }
  } catch (error) {
    console.error('版本检查失败:', error);
  } finally {
    isChecking = false;
  }
};

/**
 * 持续检查新版本，并返回停止监控的方法
 * @param t - 国际化翻译函数，用于生成更新提示
 * @param messageApi - 消息提示实例，用于展示刷新倒计时
 */
export const startVersionCheck = (t: TFunction, messageApi: MessageInstance) => {
  if (import.meta.env.MODE === 'development') return;
  void versionCheck(t, messageApi);
  const timer = setInterval(() => {
    void versionCheck(t, messageApi);
  }, 2000);
  return () => clearInterval(timer);
};

/**
 * 通过路由获取标签名
 * @param tabs - 标签
 * @param path - 路由路径
 */
export const getTabTitle = (tabs: TabsData[], path: string): string => {
  const lang = localStorage.getItem(LANG);

  for (let i = 0; i < tabs?.length; i++) {
    const item = tabs[i];

    if (item.key === path) {
      const { label, labelEn, labelZh } = item;
      const result = lang === 'en' ? labelEn : labelZh || label;
      return result as string;
    }
  }

  return '';
};
