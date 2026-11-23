import type { MessageInstance } from 'antd/es/message/interface';
import type { TabsData } from '@/stores/tabs';
import type { TFunction } from 'i18next';
import { LANG } from '@/utils/config';
import axios from 'axios';

let isRefreshScheduled = false;
let isChecking = false;
// 每个页面独立建立基准，新标签和整页刷新不会继承旧页面的版本。
let currentVersion: string | undefined;

/**
 * 版本监控
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param messageApi - 消息提示实例，用于展示版本更新提醒
 */
export const versionCheck = async (t: TFunction, messageApi: MessageInstance) => {
  if (import.meta.env.MODE === 'development' || isRefreshScheduled || isChecking) return;

  isChecking = true;
  try {
    const {
      data: { version },
    } = await axios.get('version.json', {
      // 添加超时和强制刷新参数
      timeout: 5000,
      params: { t: Date.now() },
    });

    if (!version) return;
    const latestVersion = String(version);
    if (currentVersion === undefined) {
      currentVersion = latestVersion;
      return;
    }

    if (currentVersion !== latestVersion && !isRefreshScheduled) {
      const seconds = Math.floor(Math.random() * 3) + 1;
      isRefreshScheduled = true;
      setTimeout(() => {
        window.location.reload();
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
  }, 1000);
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
