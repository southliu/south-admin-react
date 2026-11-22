import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  roles: number[];
}

interface UserState {
  permissions: string[];
  userInfo: UserInfo;
  setPermissions: (permissions: string[]) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  clearInfo: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      permissions: [],
      userInfo: {
        id: 0,
        username: '',
        name: '',
        email: '',
        phone: '',
        roles: [],
      },
      /**
       * 设置用户权限
       * @param permissions - 用户权限列表，用于判断可访问的菜单或操作
       */
      setPermissions: (permissions) => set({ permissions }),
      /**
       * 设置用户信息
       * @param userInfo - 用户信息，用于更新当前登录状态
       */
      setUserInfo: (userInfo) => set({ userInfo }),
      /** 清除用户信息 */
      clearInfo: () =>
        set({
          userInfo: { id: 0, username: '', name: '', email: '', phone: '', roles: [] },
        }),
    }),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'userStore',
    },
  ),
);
