import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useCommonStore } from '@/hooks/useCommonStore';
import { lazy, memo, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLogout } from '@/hooks/useLogout';
import { App, Dropdown, Spin } from 'antd';
import { useMenuStore } from '@/stores';
import GlobalSearch from '@/components/GlobalSearch';
import Fullscreen from '@/components/Fullscreen';
import Avatar from '@/assets/images/avatar.png';
import styles from '../index.module.less';
import Github from '@/components/Github';
import Theme from '@/components/Theme';
import I18n from '@/components/I18n';
import Nav from './Nav';

const UpdatePassword = lazy(() => import('./UpdatePassword'));

type MenuKey = 'password' | 'logout';

function Header() {
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { isCollapsed, isMaximize, username, name, nav, permissions, menuList } = useCommonStore([
    'isCollapsed',
    'isMaximize',
    'username',
    'name',
    'nav',
    'permissions',
    'menuList',
  ]);
  const [isPasswordLoaded, setPasswordLoaded] = useState(false);
  const [isPasswordOpen, setPasswordOpen] = useState(false);
  const [handleLogout] = useLogout();
  const toggleCollapsed = useMenuStore((state) => state.toggleCollapsed);

  // 下拉菜单内容
  const items: MenuProps['items'] = [
    {
      key: 'password',
      label: <span>{t('public.changePassword')}</span>,
      icon: <FormOutlined className="mr-1" />,
    },
    {
      key: 'logout',
      label: <span>{t('public.signOut')}</span>,
      icon: <LogoutOutlined className="mr-1" />,
    },
  ];

  /** 点击菜单 */
  const onClick: MenuProps['onClick'] = (e) => {
    switch (e.key as MenuKey) {
      case 'password':
        setPasswordLoaded(true);
        setPasswordOpen(true);
        break;

      case 'logout':
        onLogout();
        break;

      default:
        break;
    }
  };

  /** 退出登录 */
  const onLogout = () => {
    modal.confirm({
      title: t('public.kindTips'),
      icon: <ExclamationCircleOutlined />,
      content: t('public.signOutMessage'),
      onOk() {
        handleLogout();
      },
    });
  };

  /** 右侧组件抽离减少重复渲染 */
  const rightRender = (
    <div className="flex items-center">
      <Github />
      <GlobalSearch />
      <Fullscreen />
      <I18n />
      <Theme />
      <Dropdown
        className="min-w-50px"
        menu={{ items, onClick }}
      >
        <div
          className="ant-dropdown-link flex items-center cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          <img
            src={Avatar}
            width={27}
            height={27}
            alt="Avatar"
            className="rounded-1/2 overflow-hidden object-cover bg-light-500"
          />
          <span className="ml-2 text-15px min-w-50px truncate">
            {name || username || 'south-admin'}
          </span>
        </div>
      </Dropdown>
    </div>
  );

  return (
    <>
      <header
        className={`
          border-bottom
          flex
          items-center
          justify-between
          px-6
          py-6px
          box-border
          transition-all
          ${styles['header-driver']}
          ${isMaximize ? styles.none : ''}
        `}
      >
        <div className="flex item-center">
          {permissions.length > 0 && menuList.length > 0 && (
            <button
              type="button"
              className="text-lg cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
              aria-label={t(isCollapsed ? 'public.expandMenu' : 'public.collapseMenu')}
              onClick={() => toggleCollapsed(!isCollapsed)}
            >
              {isCollapsed && <MenuUnfoldOutlined />}
              {!isCollapsed && <MenuFoldOutlined />}
            </button>
          )}

          <Nav
            className="ml-15px"
            list={nav}
          />
        </div>

        {rightRender}
      </header>

      {isPasswordLoaded && (
        <Suspense
          fallback={
            <Spin
              fullscreen
              description={t('public.loading')}
            />
          }
        >
          <UpdatePassword
            isOpen={isPasswordOpen}
            onClose={() => setPasswordOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default memo(Header);
