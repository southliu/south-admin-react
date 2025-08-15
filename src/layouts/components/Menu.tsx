import type { MenuProps } from 'antd';
import type { SideMenu } from '#/public';
import type { ItemType, MenuItemType } from 'antd/es/menu/interface';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu } from 'antd';
import { isUrl } from '@/utils/is';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMenuStore } from '@/stores';
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
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const [menus, setMenus] = useState<SideMenu[]>([]);

  const { isMaximize, isCollapsed, isPhone, openKeys, selectedKeys, permissions, menuList } =
    useCommonStore();
  const { toggleCollapsed } = useMenuStore((state) => state);
  const [currentOpenKeys, setCurrentOpenKeys] = useState(openKeys || []);
  const [currentSelectedKeys, setCurrentSelectedKeys] = useState(
    selectedKeys ? [selectedKeys] : [],
  );

  /**
   * 转换菜单icon格式
   * @param menus - 菜单
   */
  const filterMenuIcon = useCallback((menus: SideMenu[]) => {
    for (let i = 0; i < menus.length; i++) {
      if (menus[i]?.icon) {
        menus[i].icon = <Icon icon={menus[i].icon as string} />;
      }

      if (menus[i]?.children?.length) {
        filterMenuIcon(menus[i].children as SideMenu[]);
      }
    }
  }, []);

  // 处理默认展开和过滤没权限菜单
  useEffect(() => {
    // 处理默认展开
    const newOpenKey = getOpenMenuByRouter(pathname);
    setCurrentOpenKeys(newOpenKey);
    setCurrentSelectedKeys([pathname]);

    // 过滤没权限菜单
    if (permissions.length > 0) {
      const newMenus = filterMenus(menuList, permissions);
      filterMenuIcon(newMenus);
      setMenus(newMenus || []);
    }
  }, [pathname, permissions, menuList, filterMenuIcon, i18n.language]);

  /**
   * 处理跳转
   * @param path - 路径
   */
  const goPath = (path: string) => {
    navigate(path);
  };

  /**
   * 点击菜单
   * @param e - 菜单事件
   */
  const onClickMenu: MenuProps['onClick'] = (e) => {
    // 如果点击的菜单是当前菜单则退出
    if (e.key === pathname) return;
    if (isPhone) hiddenMenu();

    // 如果是外链则跳转
    if (isUrl(e.key)) {
      window.open(e.key, '_blank');
      return;
    }

    setCurrentSelectedKeys([e.key]);
    goPath(e.key);
  };

  /**
   * 对比当前展开目录是否是同一层级
   * @param arr - 当前展开目录
   * @param lastArr - 最后展开的目录
   */
  const diffOpenMenu = (arr: string[], lastArr: string[]) => {
    let result = true;

    for (let j = 0; j < arr.length; j++) {
      if (arr[j] !== lastArr[j]) {
        result = false;
        break;
      }
    }

    return result;
  };

  /**
   * 展开/关闭回调
   * @param openKeys - 展开键值
   */
  const onOpenChange = (openKeys: string[]) => {
    startTransition(() => {
      const newOpenKey: string[] = [];
      let last = ''; // 最后一个目录结构

      // 当目录有展开值
      if (openKeys.length > 0) {
        last = openKeys[openKeys.length - 1];
        const lastArr: string[] = splitPath(last);
        newOpenKey.push(last);

        // 对比当前展开目录是否是同一层级
        for (let i = openKeys.length - 2; i >= 0; i--) {
          const arr = splitPath(openKeys[i]);
          const hasOpenKey = diffOpenMenu(arr, lastArr);
          if (hasOpenKey) newOpenKey.unshift(openKeys[i]);
        }
      }

      setCurrentOpenKeys(newOpenKey);
    });
  };

  /** 点击logo */
  const onClickLogo = () => {
    const firstMenu = getFirstMenu(menus, permissions);
    goPath(firstMenu);
    if (isPhone) hiddenMenu();
  };

  /** 隐藏菜单 */
  const hiddenMenu = () => {
    toggleCollapsed(true);
  };

  return useMemo(
    () => (
      <>
        <div
          className={`
            transition-all
            overflow-auto
            z-2
            ${styles.menu}
            ${isCollapsed ? styles['menu-close'] : ''}
            ${isMaximize || (isPhone && isCollapsed) ? styles['menu-none'] : ''}
            ${isPhone ? '!z-1002' : ''}
        `}
        >
          <div
            className={`
              text-white
              flex
              content-center
              px-5
              py-2
              cursor-pointer
              ${isCollapsed ? 'justify-center' : ''}
            `}
            onClick={onClickLogo}
          >
            <img src={Logo} width={30} height={30} className="object-contain" alt="logo" />

            <span
              className={`
                text-white
                ml-3
                text-xl
                font-bold
                truncate
                ${isCollapsed ? 'hidden' : ''}
              `}
            >
              {t('public.currentName')}
            </span>
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
            items={handleFilterMenus(menus) as ItemType<MenuItemType>[]}
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentOpenKeys, currentSelectedKeys, isCollapsed, isMaximize, isPhone, menus],
  );
}

export default LayoutMenu;
