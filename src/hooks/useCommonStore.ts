import { useMenuStore, usePublicStore, useTabsStore, useUserStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';

/**
 * 获取常用的状态数据
 * 使用 useShallow 优化性能，只在相关状态变化时重新渲染
 */
export const useCommonStore = () => {
  // 使用 useShallow 优化，避免不必要的重新渲染
  const userStore = useUserStore(
    useShallow((state) => ({
      permissions: state.permissions,
      userId: state.userInfo.id,
      roles: state.userInfo.roles,
      username: state.userInfo.username,
    })),
  );

  const tabsStore = useTabsStore(
    useShallow((state) => ({
      isMaximize: state.isMaximize,
      nav: state.nav,
      tabs: state.tabs,
    })),
  );

  const menuStore = useMenuStore(
    useShallow((state) => ({
      isCollapsed: state.isCollapsed,
      isPhone: state.isPhone,
      openKeys: state.openKeys,
      selectedKeys: state.selectedKeys,
      menuList: state.menuList,
    })),
  );

  const publicStore = usePublicStore(
    useShallow((state) => ({
      isRefresh: state.isRefresh,
      isFullscreen: state.isFullscreen,
      theme: state.theme,
    })),
  );

  return {
    ...userStore,
    ...tabsStore,
    ...menuStore,
    ...publicStore,
  } as const;
};
