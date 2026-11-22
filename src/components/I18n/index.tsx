import type { MenuProps } from 'antd';
import { getTabTitle } from '@/layouts/utils/helper';
import { useShallow } from 'zustand/react/shallow';
import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setTitle } from '@/utils/helper';
import { useTabsStore } from '@/stores';
import { Icon } from '@iconify/react';
import { LANG } from '@/utils/config';
import { Dropdown } from 'antd';

export type Langs = 'zh' | 'en';

function I18n() {
  const { t, i18n } = useTranslation();
  const { pathname, search } = useLocation();
  const { tabs } = useTabsStore(useShallow((state) => ({ tabs: state.tabs })));

  useEffect(() => {
    const lang = localStorage.getItem(LANG);
    // 获取当前语言
    const currentLanguage = i18n.language;

    if (!lang) {
      localStorage.setItem(LANG, 'zh');
      i18n.changeLanguage('zh');
    } else if (currentLanguage !== lang) {
      i18n.changeLanguage(lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 下拉菜单内容
  const items: MenuProps['items'] = [
    {
      key: 'zh',
      label: <span>中文</span>,
    },
    {
      key: 'en',
      label: <span>English</span>,
    },
  ];

  /** 设置浏览器标签 */
  const handleSetTitle = useCallback(() => {
    const path = `${pathname}${search || ''}`;
    // 通过路由获取标签名
    const title = getTabTitle(tabs, path);
    if (title) setTitle(t, title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /**
   * 点击更换语言
   * @param e - 语言菜单点击事件，用于读取目标语言标识
   */
  const onClick: MenuProps['onClick'] = (e) => {
    i18n.changeLanguage(e.key as Langs);
    localStorage.setItem(LANG, e.key);
    handleSetTitle();
  };

  return (
    <Dropdown
      placement="bottom"
      trigger={['click']}
      menu={{ items, onClick }}
    >
      <div
        className="ant-dropdown-link flex items-center cursor-pointer"
        onClick={(e) => e.preventDefault()}
      >
        <Icon
          className="flex items-center justify-center text-lg mr-3 cursor-pointer"
          icon="cil:language"
        />
      </div>
    </Dropdown>
  );
}

export default I18n;
