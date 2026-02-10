import type { MenuProps } from 'antd';
import type { SideMenu } from '#/public';
import type { ItemType, MenuItemType } from 'antd/es/menu/interface';
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Menu } from 'antd';
import { isUrl } from '@/utils/is';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';
import {
  filterMenus,
  getFirstMenu,
  getOpenMenuByRouter,
  handleFilterMenus,
  splitPath,
} from '@/menus/utils/helper';
import styles from '../index.module.less';
import Logo from '@/assets/images/logo.svg';

function LayoutMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const { isMaximize, isCollapsed, isPhone, openKeys, selectedKeys, permissions, menuList } =
    useCommonStore();
  const { toggleCollapsed, setSelectedKeys } = useMenuStore(
    useShallow((state) => ({
      toggleCollapsed: state.toggleCollapsed,
      setSelectedKeys: state.setSelectedKeys,
    })),
  );

  // 本地状态管理
  const [currentOpenKeys, setCurrentOpenKeys] = useState<string[]>(openKeys || []);
  const [currentSelectedKeys, setCurrentSelectedKeys] = useState<string[]>(
    selectedKeys ? [selectedKeys] : [],
  );

  /**
   * 转换菜单icon格式
   */
  const filterMenuIcon = useCallback((menus: SideMenu[]): SideMenu[] => {
    if (!menus?.length) return [];

    return menus.map((item) => {
      const newItem: SideMenu = { ...item };

      if (item?.icon) {
        newItem.icon = <Icon icon={item.icon as string} />;
      }

      if (item?.children?.length) {
        newItem.children = filterMenuIcon(item.children as SideMenu[]);
      }

      return newItem;
    });
  }, []);

  // 过滤菜单
  const filteredMenus = useMemo(() => {
    if (permissions.length === 0 || menuList.length === 0) return [];
    const newMenus = filterMenus(menuList, permissions);
    return filterMenuIcon(newMenus);
  }, [menuList, permissions, filterMenuIcon]);

  // 同步 pathname 变化
  useEffect(() => {
    const newOpenKey = getOpenMenuByRouter(pathname);
    setCurrentOpenKeys(newOpenKey);
    setCurrentSelectedKeys([pathname]);
    setSelectedKeys(pathname);
  }, [pathname, setSelectedKeys]);

  // 同步 store 中的 selectedKeys 变化
  useEffect(() => {
    if (selectedKeys) {
      setCurrentSelectedKeys([selectedKeys]);
    }
  }, [selectedKeys]);

  /**
   * 路由跳转
   */
  const goPath = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  /**
   * 隐藏菜单（手机端）
   */
  const hiddenMenu = useCallback(() => {
    toggleCollapsed(true);
  }, [toggleCollapsed]);

  /**
   * 点击菜单
   */
  const onClickMenu: MenuProps['onClick'] = useCallback(
    ({ key }: { key: string }) => {
      // 如果点击的菜单是当前菜单则退出
      if (key === pathname) return;

      // 手机端点击后隐藏菜单
      if (isPhone) {
        hiddenMenu();
      }

      // 如果是外链则跳转
      if (isUrl(key)) {
        window.open(key, '_blank');
        return;
      }

      // 直接更新状态和导航
      setCurrentSelectedKeys([key]);
      setSelectedKeys(key);
      navigate(key);
    },
    [pathname, isPhone, hiddenMenu, setSelectedKeys, navigate],
  );

  /**
   * 对比当前展开目录是否是同一层级
   */
  const diffOpenMenu = useCallback((arr: string[], lastArr: string[]) => {
    return arr.every((item, index) => item === lastArr[index]);
  }, []);

  /**
   * 展开/关闭回调
   */
  const onOpenChange = useCallback(
    (openKeys: string[]) => {
      const newOpenKey: string[] = [];

      if (openKeys.length > 0) {
        const last = openKeys[openKeys.length - 1];
        const lastArr: string[] = splitPath(last);
        newOpenKey.push(last);

        // 对比当前展开目录是否是同一层级
        for (let i = openKeys.length - 2; i >= 0; i--) {
          const arr = splitPath(openKeys[i]);
          const hasOpenKey = diffOpenMenu(arr, lastArr);
          if (hasOpenKey) {
            newOpenKey.unshift(openKeys[i]);
          }
        }
      }

      setCurrentOpenKeys(newOpenKey);
    },
    [diffOpenMenu],
  );

  /** 点击logo */
  const onClickLogo = useCallback(() => {
    const firstMenu = getFirstMenu(filteredMenus, permissions);
    goPath(firstMenu);
    if (isPhone) {
      hiddenMenu();
    }
  }, [filteredMenus, permissions, goPath, isPhone, hiddenMenu]);

  // 缓存菜单项
  const menuItems = useMemo(
    () => handleFilterMenus(filteredMenus) as ItemType<MenuItemType>[],
    [filteredMenus],
  );

  // 缓存 className
  const menuClassName = useMemo(
    () => `
      transition-all
      overflow-auto
      z-2
      ${styles.menu}
      ${isCollapsed ? styles['menu-close'] : ''}
      ${isMaximize || (isPhone && isCollapsed) ? styles['menu-none'] : ''}
      ${isPhone ? '!z-1002' : ''}
    `,
    [isCollapsed, isMaximize, isPhone],
  );

  const logoClassName = useMemo(
    () => `
      text-white
      flex
      content-center
      px-5
      py-2
      cursor-pointer
      ${isCollapsed ? 'justify-center' : ''}
    `,
    [isCollapsed],
  );

  const titleClassName = useMemo(
    () => `
      text-white
      ml-3
      text-xl
      font-bold
      truncate
      ${isCollapsed ? 'hidden' : ''}
    `,
    [isCollapsed],
  );

  return (
    <>
      <div className={menuClassName}>
        <div className={logoClassName} onClick={onClickLogo}>
          <img src={Logo} width={30} height={30} className="object-contain" alt="logo" />
          <span className={titleClassName}>{t('public.currentName')}</span>
        </div>

        <Menu
          id="layout-menu"
          className="z-1000"
          selectedKeys={currentSelectedKeys}
          openKeys={currentOpenKeys}
          mode="inline"
          theme="dark"
          forceSubMenuRender
          inlineCollapsed={isPhone ? false : isCollapsed}
          items={menuItems}
          onClick={onClickMenu}
          onOpenChange={onOpenChange}
        />
      </div>

      {isPhone && !isCollapsed && (
        <div
          className={`
            ${styles.cover}
            fixed
            w-full
            h-full
            bg-gray-500
            bg-opacity-10
            z-1001
          `}
          onClick={hiddenMenu}
        />
      )}
    </>
  );
}

export default memo(LayoutMenu);
