import type { KeepAliveRef } from 'keepalive-for-react';
import type { RefObject } from 'react';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

export type ThemeType = 'dark' | 'light';

interface PublicState {
  theme: ThemeType; // 主题
  isFullscreen: boolean; // 是否全屏
  isRefresh: boolean; // 重新加载
  isRefreshPage: boolean; // 重新加载页面
  aliveRef: RefObject<KeepAliveRef | null>; // keepalive ref
  /**
   * 设置主题
   * @param theme - 目标主题，用于切换界面配色
   */
  setThemeValue: (theme: ThemeType) => void;
  /**
   * 设置全屏
   * @param isFullscreen - 是否开启全屏，用于同步全屏显示状态
   */
  setFullscreen: (isFullscreen: boolean) => void;
  /**
   * 设置重新加载
   * @param isRefresh - 是否触发刷新，用于通知页面重新获取数据
   */
  setRefresh: (isRefresh: boolean) => void;
  /**
   * 设置重新加载页面
   * @param isRefreshPage - 是否重新加载页面，用于标记标签刷新状态
   */
  setRefreshPage: (isRefreshPage: boolean) => void;
  /**
   * 设置keepalive ref
   * @param ref - 页面缓存引用，用于操作标签对应的缓存实例
   */
  setAliveRef: (ref: RefObject<KeepAliveRef | null>) => void;
}

export const usePublicStore = create<PublicState>()(
  devtools(
    (set) => ({
      theme: 'light',
      isFullscreen: false,
      isRefresh: false,
      isRefreshPage: false,
      aliveRef: { current: null },
      setThemeValue: (theme: ThemeType) => set({ theme }),
      setFullscreen: (isFullscreen: boolean) => set({ isFullscreen }),
      setRefresh: (isRefresh: boolean) => set({ isRefresh }),
      setRefreshPage: (isRefreshPage: boolean) => set({ isRefreshPage }),
      setAliveRef: (ref: RefObject<KeepAliveRef | null>) => set({ aliveRef: ref }),
    }),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'publicStore',
    },
  ),
);
