import type { PasswordModal } from './UpdatePassword';
import type { MenuProps } from 'antd';
import { useMemo, useRef } from 'react';
import { App, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useMenuStore } from '@/stores';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import Avatar from '@/assets/images/avatar.png';
import styles from '../index.module.less';
import Fullscreen from '@/components/Fullscreen';
import GlobalSearch from '@/components/GlobalSearch';
import Github from '@/components/Github';
import I18n from '@/components/I18n';
import Theme from '@/components/Theme';
import UpdatePassword from './UpdatePassword';
import Nav from './Nav';

type MenuKey = 'password' | 'logout';

function Header() {
  const [handleLogout] = useLogout();
  const { t } = useTranslation();
  const { modal } = App.useApp();
  const { isCollapsed, isMaximize, username, nav } = useCommonStore();
  // 是否窗口最大化
  const passwordRef = useRef<PasswordModal>(null);
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
        passwordRef.current?.open();
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
  const RightRender = () => {
    return useMemo(
      () => (
        <div className="flex items-center">
          <Github />
          <GlobalSearch />
          <Fullscreen />
          <I18n />
          <Theme />
          <Dropdown className="min-w-50px" menu={{ items, onClick }}>
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
                {username || 'south-admin'}
              </span>
            </div>
          </Dropdown>
        </div>
      ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [username],
    );
  };

  /** icon渲染 */
  const IconRender = () => {
    return (
      <div className="text-lg cursor-pointer" onClick={() => toggleCollapsed(!isCollapsed)}>
        {isCollapsed && <MenuUnfoldOutlined />}
        {!isCollapsed && <MenuFoldOutlined />}
      </div>
    );
  };

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
          <IconRender />

          <Nav className="ml-15px" list={nav} />
        </div>

        <RightRender />
      </header>

      <UpdatePassword passwordRef={passwordRef} />
    </>
  );
}

export default Header;
