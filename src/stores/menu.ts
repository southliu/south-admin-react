import type { SideMenu } from '#/public';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

interface MenuState {
  isPhone: boolean;
  isCollapsed: boolean;
  selectedKeys: string; // 菜单选中值
  openKeys: string[]; // 菜单展开项
  menuList: SideMenu[]; // 菜单列表数据
  toggleCollapsed: (isCollapsed: boolean) => void;
  togglePhone: (isPhone: boolean) => void;
  setSelectedKeys: (selectedKeys: string) => void;
  setOpenKeys: (openKeys: string[]) => void;
  setMenuList: (menuList: SideMenu[]) => void;
}

export const useMenuStore = create<MenuState>()(
  devtools(
    (set) => ({
      isPhone: false,
      isCollapsed: false,
      selectedKeys: 'dashboard', // 菜单选中值
      openKeys: ['Dashboard'], // 菜单展开项
      menuList: [], // 菜单列表数据
      toggleCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
      togglePhone: (isPhone: boolean) => set({ isPhone }),
      setSelectedKeys: (selectedKeys: string) => set({ selectedKeys }),
      setOpenKeys: (openKeys: string[]) => set({ openKeys }),
      setMenuList: (menuList: SideMenu[]) => set({ menuList }),
    }),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'menuStore',
    },
  ),
);
