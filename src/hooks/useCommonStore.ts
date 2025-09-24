import { useMenuStore, usePublicStore, useTabsStore, useUserStore } from '@/stores';

/**
 * 获取常用的状态数据
 */
export const useCommonStore = () => {
  // 权限
  const permissions = useUserStore((state) => state.permissions);
  // 用户ID
  const userId = useUserStore((state) => state.userInfo.id);
  // 角色
  const roles = useUserStore((state) => state.userInfo.roles);
  // 用户名
  const username = useUserStore((state) => state.userInfo.username);
  // 是否窗口最大化
  const isMaximize = useTabsStore((state) => state.isMaximize);
  // 导航数据
  const nav = useTabsStore((state) => state.nav);
  // 菜单是否收缩
  const isCollapsed = useMenuStore((state) => state.isCollapsed);
  // 是否手机端
  const isPhone = useMenuStore((state) => state.isPhone);
  // 是否重新加载
  const isRefresh = usePublicStore((state) => state.isRefresh);
  // 是否全屏
  const isFullscreen = usePublicStore((state) => state.isFullscreen);
  // 菜单打开的key
  const openKeys = useMenuStore((state) => state.openKeys);
  // 菜单选中的key
  const selectedKeys = useMenuStore((state) => state.selectedKeys);
  // 标签栏
  const tabs = useTabsStore((state) => state.tabs);
  // 主题
  const theme = usePublicStore((state) => state.theme);
  // 菜单数据
  const menuList = useMenuStore((state) => state.menuList);

  return {
    isMaximize,
    isCollapsed,
    isPhone,
    isRefresh,
    isFullscreen,
    nav,
    permissions,
    userId,
    username,
    openKeys,
    selectedKeys,
    tabs,
    theme,
    menuList,
    roles,
  } as const;
};
