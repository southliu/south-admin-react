import type { TabPaneProps } from 'antd';
import type { NavData } from '@/menus/utils/helper';
import type { KeepAliveRef } from 'keepalive-for-react';
import { persist, createJSONStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface TabsData extends Omit<TabPaneProps, 'tab'> {
  key: string;
  label: React.ReactNode;
  labelZh: React.ReactNode;
  labelEn: React.ReactNode;
  nav: NavData[];
  urlParams?: string; // url参数
}

interface TabsGoNext {
  key: string;
  nextPath: string;
  dropScope: KeepAliveRef['destroy'] | undefined;
}

interface TabsState {
  isCloseTabsLock: boolean;
  isMaximize: boolean;
  activeKey: string;
  nav: NavData[];
  tabs: TabsData[];
  toggleCloseTabsLock: (isCloseTabsLock: boolean) => void;
  toggleMaximize: (isMaximize: boolean) => void;
  setActiveKey: (key: string) => void;
  setNav: (nav: NavData[]) => void;
  switchTabsLang: (label: string) => void;
  addTabs: (payload: TabsData) => void;
  setTabs: (key: string, searchParams?: string) => void;
  sortTabs: (payload: TabsData[]) => void;
  closeTabs: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeTabGoNext: (payload: TabsGoNext) => void;
  closeLeft: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeRight: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeOther: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeAllTab: () => void;
}

export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set) => ({
        isCloseTabsLock: false,
        isMaximize: false,
        activeKey: '',
        nav: [],
        tabs: [],
        toggleCloseTabsLock: (isCloseTabsLock) => set({ isCloseTabsLock }),
        toggleMaximize: (isMaximize) => set({ isMaximize }),
        setActiveKey: (key) => set({ activeKey: key }),
        setNav: (nav) => set({ nav }),
        switchTabsLang: (label) =>
          set((state) => {
            const { tabs } = state;
            for (let i = 0; i < tabs?.length; i++) {
              const item = tabs[i];
              item.label = label === 'en' ? item.labelEn : item.labelZh;
            }
            return { tabs };
          }),
        addTabs: (payload) =>
          set((state) => {
            const { tabs } = state;
            const has = tabs.find((item) => item.key === payload.key);
            if (!has) tabs.push(payload);

            if (tabs.length) tabs[0].closable = tabs.length > 1;

            return { tabs };
          }),
        setTabs: (key, searchParams) =>
          set((state) => {
            const { tabs } = state;
            const has = tabs.find((item) => item.key === key);
            if (has) {
              has.urlParams = searchParams;
            }
            return { tabs };
          }),
        sortTabs: (payload) => {
          set({ tabs: payload });
        },
        closeTabs: (payload, dropScope) =>
          set((state) => {
            const { tabs } = state;
            const index = tabs.findIndex((item) => item.key === payload);
            if (index >= 0) tabs.splice(index, 1);

            if (payload === state.activeKey) {
              let target = '';
              if (index < tabs.length) {
                target = tabs?.[index]?.key || '';
              } else {
                target = tabs[index - 1]?.key || '';
              }
              set({ activeKey: target, isCloseTabsLock: true });
            }

            if (tabs.length) tabs[0].closable = tabs.length > 1;

            // 清除当前标签的keepalive缓存
            dropScope?.(payload);

            return { tabs };
          }),
        closeTabGoNext: (payload) =>
          set((state) => {
            const { tabs } = state;
            const { key, nextPath, dropScope } = payload;
            const index = tabs.findIndex((item) => item.key === key);
            if (index >= 0) tabs.splice(index, 1);

            if (key === state.activeKey) {
              set({ activeKey: nextPath, isCloseTabsLock: true });
            }

            if (tabs.length) tabs[0].closable = tabs.length > 1;

            // 清除非当前的keepalive缓存
            dropScope?.(key);

            return { tabs };
          }),
        closeLeft: (payload, dropScope) =>
          set((state) => {
            const { tabs, activeKey } = state;
            const index = tabs.findIndex((item) => item.key === payload);
            if (index >= 0) tabs.splice(0, index);
            set({ activeKey: tabs[0]?.key || '' });

            // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
            if (activeKey !== payload) {
              set({ isCloseTabsLock: true });
            }

            if (tabs.length) tabs[0].closable = tabs.length > 1;

            // 清除非当前的keepalive缓存
            for (let i = 0; i < tabs?.length; i++) {
              const item = tabs[i];
              if (item.key !== payload) {
                dropScope?.(item.key);
              }
            }

            return { tabs };
          }),
        closeRight: (payload, dropScope) =>
          set((state) => {
            const { tabs, activeKey } = state;

            // 清除非当前的keepalive缓存
            for (let i = 0; i < tabs?.length; i++) {
              const item = tabs[i];
              if (item.key !== payload) {
                dropScope?.(item.key);
              }
            }

            const index = tabs.findIndex((item) => item.key === payload);
            if (index >= 0) tabs.splice(index + 1, tabs.length - index - 1);
            set({ activeKey: tabs[tabs.length - 1]?.key || '' });

            // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
            if (activeKey !== payload) {
              set({ isCloseTabsLock: true });
            }

            if (tabs.length) tabs[0].closable = tabs.length > 1;

            return { tabs };
          }),
        closeOther: (payload, dropScope) =>
          set((state) => {
            const { tabs, activeKey } = state;
            // 保留当前标签，关闭其他标签
            const filteredTabs: TabsData[] = [];

            for (let i = 0; i < tabs?.length; i++) {
              const item = tabs[i];

              // 如果当前标签不是要关闭的标签，就保留
              if (item.key === payload) {
                filteredTabs.push(item);
              } else {
                // 清除非当前的keepalive缓存
                dropScope?.(item.key);
              }
            }

            tabs.filter((item) => item.key === payload);

            // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
            if (activeKey !== payload) {
              set({ isCloseTabsLock: true });
            }

            set({ tabs: filteredTabs, activeKey: payload });

            if (filteredTabs.length) filteredTabs[0].closable = filteredTabs.length > 1;

            return {
              tabs: filteredTabs,
              activeKey: payload,
            };
          }),
        closeAllTab: () => {
          set({ tabs: [], activeKey: '' });

          return {
            tabs: [],
            activeKey: '',
          };
        },
      }),
      {
        name: 'tabs_storage', // 存储中的项目名称，必须是唯一的
        storage: createJSONStorage(() => localStorage), // 使用sessionStorage作为存储
      },
    ),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'tabsStore',
    },
  ),
);
