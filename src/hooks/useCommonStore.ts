import { useMenuStore, usePublicStore, useTabsStore, useUserStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';

const selectUser = (state: ReturnType<typeof useUserStore.getState>) => ({
  permissions: state.permissions,
  userId: state.userInfo.id,
  roles: state.userInfo.roles,
  username: state.userInfo.username,
  name: state.userInfo.name,
});

const selectTabs = (state: ReturnType<typeof useTabsStore.getState>) => ({
  isMaximize: state.isMaximize,
  nav: state.nav,
  tabs: state.tabs,
});

const selectMenu = (state: ReturnType<typeof useMenuStore.getState>) => ({
  isCollapsed: state.isCollapsed,
  isPhone: state.isPhone,
  openKeys: state.openKeys,
  selectedKeys: state.selectedKeys,
  menuList: state.menuList,
});

const selectPublic = (state: ReturnType<typeof usePublicStore.getState>) => ({
  isRefresh: state.isRefresh,
  isFullscreen: state.isFullscreen,
  theme: state.theme,
});

type CommonState = ReturnType<typeof selectUser> &
  ReturnType<typeof selectTabs> &
  ReturnType<typeof selectMenu> &
  ReturnType<typeof selectPublic>;

function pick<T extends object>(state: T, keys?: readonly PropertyKey[]): Partial<T> {
  if (!keys) return state;
  return Object.fromEntries(
    keys.filter((key) => Object.hasOwn(state, key)).map((key) => [key, state[key as keyof T]]),
  ) as Partial<T>;
}

/**
 * 只订阅调用方需要的字段，避免标签、菜单变化带动无关页面渲染。
 * @param keys - 需要订阅的状态字段，用于避免无关状态变化触发重渲染
 */
export function useCommonStore<K extends keyof CommonState = keyof CommonState>(
  keys?: readonly K[],
) {
  const userStore = useUserStore(useShallow((state) => pick(selectUser(state), keys)));
  const tabsStore = useTabsStore(useShallow((state) => pick(selectTabs(state), keys)));
  const menuStore = useMenuStore(useShallow((state) => pick(selectMenu(state), keys)));
  const publicStore = usePublicStore(useShallow((state) => pick(selectPublic(state), keys)));
  return { ...userStore, ...tabsStore, ...menuStore, ...publicStore } as Pick<CommonState, K>;
}
