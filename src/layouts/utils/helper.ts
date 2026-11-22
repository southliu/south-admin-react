import type { MessageInstance } from 'antd/es/message/interface';
import type { TabsData } from '@/stores/tabs';
import type { TFunction } from 'i18next';
import { LANG, VERSION } from '@/utils/config';
import { createElement } from 'react';
import axios from 'axios';

/** 版本监控 */
export const versionCheck = async (t: TFunction, messageApi: MessageInstance) => {
  if (import.meta.env.MODE === 'development') return;

  try {
    const versionLocal = localStorage.getItem(VERSION);
    const {
      data: { version },
    } = await axios.get('version.json', {
      // 添加超时和强制刷新参数
      timeout: 5000,
      params: { t: Date.now() },
    });

    // 首次进入则缓存本地数据
    if (version && !versionLocal) {
      return localStorage.setItem(VERSION, String(version));
    }

    if (version && versionLocal !== String(version)) {
      const refresh = () => {
        localStorage.setItem(VERSION, String(version));
        window.location.reload();
      };
      messageApi.info({
        content: createElement(
          'button',
          {
            type: 'button',
            className: 'cursor-pointer border-0 bg-transparent text-inherit',
            onClick: refresh,
          },
          t('public.reloadPageMsg'),
        ),
        key: 'reload',
        duration: 0,
      });
    }
  } catch (error) {
    console.error('版本检查失败:', error);
  }
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
