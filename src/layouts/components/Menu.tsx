import type { MenuProps } from 'antd';
import type { SideMenu } from '#/public';
import type { ItemType, MenuItemType } from 'antd/es/menu/interface';
import { useCallback, useEffect, useMemo, useState, memo, startTransition } from 'react';
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
  const { isMaximize, isCollapsed, isPhone, openKeys, selectedKeys, permissions, menuList } =
    useCommonStore();
  const { toggleCollapsed, setSelectedKeys } = useMenuStore((state) => state);
  const [currentOpenKeys, setCurrentOpenKeys] = useState(openKeys || []);
  const [currentSelectedKeys, setCurrentSelectedKeys] = useState(
    selectedKeys ? [selectedKeys] : [],
  );

  /**
   * 转换菜单icon格式
   * @param menus - 菜单
   */
  const filterMenuIcon = useCallback((menus: SideMenu[]) => {
    const newMenus = [...menus];
    for (let i = 0; i < newMenus.length; i++) {
      if (newMenus[i]?.icon) {
        newMenus[i] = { ...newMenus[i], icon: <Icon icon={newMenus[i].icon as string} /> };
      }

      if (newMenus[i]?.children?.length) {
        newMenus[i] = {
          ...newMenus[i],
          children: filterMenuIcon(newMenus[i].children as SideMenu[]),
        };
      }
    }
    return newMenus;
  }, []);

  // 使用 useMemo 缓存过滤后的菜单，只在 menuList 或 permissions 变化时重新计算
  const filteredMenus = useMemo(() => {
    if (permissions.length === 0 || menuList.length === 0) return [];
    const newMenus = filterMenus(menuList, permissions);
    return filterMenuIcon(newMenus);
  }, [menuList, permissions, filterMenuIcon, i18n.language]);

  // 只在 pathname 变化时更新选中状态和展开状态（使用 startTransition 标记为非紧急更新）
  useEffect(() => {
    startTransition(() => {
      const newOpenKey = getOpenMenuByRouter(pathname);
      setCurrentOpenKeys(newOpenKey);
      setCurrentSelectedKeys([pathname]);
      setSelectedKeys(pathname);
    });
  }, [pathname, setSelectedKeys]);

  // 菜单选中值更新而变化
  useEffect(() => {
    if (selectedKeys) {
      setCurrentSelectedKeys([selectedKeys]);
    }
  }, [selectedKeys]);

  /**
   * 处理跳转
   * @param path - 路径
   */
  const goPath = (path: string) => {
    startTransition(() => {
      navigate(path);
    });
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

    startTransition(() => {
      setCurrentSelectedKeys([e.key]);
      setSelectedKeys(e.key);
      navigate(e.key);
    });
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
    const firstMenu = getFirstMenu(filteredMenus, permissions);
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
            items={handleFilterMenus(filteredMenus) as ItemType<MenuItemType>[]}
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
    [currentOpenKeys, currentSelectedKeys, isCollapsed, isMaximize, isPhone, filteredMenus],
  );
}

export default memo(LayoutMenu);
