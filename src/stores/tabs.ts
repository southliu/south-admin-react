import type { KeepAliveRef } from 'keepalive-for-react';
import type { NavData } from '@/menus/utils/helper';
import type { TabPaneProps } from 'antd';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

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

function updateFirstTabClosable(tabs: TabsData[]): TabsData[] {
  const isClosable = tabs.length > 1;
  if (!tabs.length || tabs[0].closable === isClosable) return tabs;
  return tabs.map((tab, index) => (index === 0 ? { ...tab, closable: isClosable } : tab));
}

export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set, get) => ({
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
          set((state) => ({
            tabs: state.tabs.map((tab) => ({
              ...tab,
              label: label === 'en' ? tab.labelEn : tab.labelZh,
            })),
          })),
        addTabs: (payload) =>
          set((state) => {
            if (state.tabs.some((tab) => tab.key === payload.key)) return state;
            return { tabs: updateFirstTabClosable([...state.tabs, payload]) };
          }),
        setTabs: (key, searchParams) =>
          set((state) => ({
            tabs: state.tabs.map((tab) =>
              tab.key === key ? { ...tab, urlParams: searchParams } : tab,
            ),
          })),
        sortTabs: (payload) => set({ tabs: updateFirstTabClosable([...payload]) }),
        closeTabs: (key, dropScope) => {
          const state = get();
          const index = state.tabs.findIndex((tab) => tab.key === key);
          if (index < 0) return;
          const tabs = updateFirstTabClosable(state.tabs.filter((tab) => tab.key !== key));
          set({
            tabs,
            ...(state.activeKey === key
              ? {
                  activeKey: tabs[index]?.key || tabs[index - 1]?.key || '',
                  isCloseTabsLock: true,
                }
              : {}),
          });
          dropScope?.(key);
        },
        closeTabGoNext: ({ key, nextPath, dropScope }) => {
          const state = get();
          const tabs = updateFirstTabClosable(state.tabs.filter((tab) => tab.key !== key));
          set({
            tabs,
            ...(state.activeKey === key ? { activeKey: nextPath, isCloseTabsLock: true } : {}),
          });
          dropScope?.(key);
        },
        closeLeft: (key, dropScope) => {
          const state = get();
          const index = state.tabs.findIndex((tab) => tab.key === key);
          if (index < 0) return;
          const removed = state.tabs.slice(0, index);
          set({
            tabs: updateFirstTabClosable(state.tabs.slice(index)),
            activeKey: key,
            ...(state.activeKey !== key ? { isCloseTabsLock: true } : {}),
          });
          removed.forEach((tab) => dropScope?.(tab.key));
        },
        closeRight: (key, dropScope) => {
          const state = get();
          const index = state.tabs.findIndex((tab) => tab.key === key);
          if (index < 0) return;
          const removed = state.tabs.slice(index + 1);
          set({
            tabs: updateFirstTabClosable(state.tabs.slice(0, index + 1)),
            activeKey: key,
            ...(state.activeKey !== key ? { isCloseTabsLock: true } : {}),
          });
          removed.forEach((tab) => dropScope?.(tab.key));
        },
        closeOther: (key, dropScope) => {
          const state = get();
          if (!state.tabs.some((tab) => tab.key === key)) return;
          const removed = state.tabs.filter((tab) => tab.key !== key);
          set({
            tabs: updateFirstTabClosable(state.tabs.filter((tab) => tab.key === key)),
            activeKey: key,
            ...(state.activeKey !== key ? { isCloseTabsLock: true } : {}),
          });
          removed.forEach((tab) => dropScope?.(tab.key));
        },
        closeAllTab: () => set({ tabs: [], activeKey: '' }),
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
