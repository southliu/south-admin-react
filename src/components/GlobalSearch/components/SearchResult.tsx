import type { SideMenu } from '#/public';
import { getMenuByKey, getOpenMenuByRouter } from '@/menus/utils/helper';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useMenuStore, useTabsStore } from '@/stores';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Fragment } from 'react';

interface Props {
  list: SideMenu[]; // 列表
  active: string; // 选中值
  onCancel: () => void; // 关闭模态框
  changActive: (value: string) => void; // 更改选中值
}

function SearchResult(props: Props) {
  const { list, active, onCancel, changActive } = props;
  const { t, i18n } = useTranslation();
  const { permissions, menuList } = useCommonStore();
  const { addTabs, setActiveKey } = useTabsStore((state) => state);
  const setOpenKeys = useMenuStore((state) => state.setOpenKeys);
  const navigate = useNavigate();
  // 获取当前语言
  const currentLanguage = i18n.language;

  /**
   * 点击菜单跳转页面
   * @param key - 唯一值
   */
  const onClick = (key: string) => {
    navigate(key);
    // 添加标签
    const menuByKeyProps = { menus: menuList, permissions, key };
    const newTab = getMenuByKey(menuByKeyProps);
    if (newTab) addTabs(newTab);
    setActiveKey(key);
    // 处理菜单展开
    const openKeys = getOpenMenuByRouter(key);
    setOpenKeys(openKeys);
    // 关闭
    onCancel();
  };

  /**
   * 鼠标进入事件
   * @param key - 唯一值
   */
  const onMouseEnter = (key: string) => {
    changActive(key);
  };

  return (
    <>
      {!list?.length && (
        <div className="flex flex-col items-center pt-5 text-warm-gray-400">
          <Icon className="text-40px" icon="mdi:archive-cancel-outline" />
          <span className="mt-1">{t('public.notSearchContent')}</span>
        </div>
      )}
      {list?.length > 0 && (
        <div className="mt-5">
          {list?.map((item) => (
            <div
              key={item.key}
              className={`
                h-56px
                mt-8px
                px-14px
                rounded-4px
                cursor-pointer
                flex
                items-center
                justify-between
                shadow-md
                border
                border-light-500
                ${active === item.key ? 'bg-blue-500 text-white' : ''}
              `}
              onClick={() => onClick(item.key)}
              onMouseEnter={() => onMouseEnter(item.key)}
            >
              <div className="flex items-center">
                <Icon className="text-lg mr-1" icon="gg:menu-boxed" />
                {item.nav &&
                  item.nav?.length > 0 &&
                  item.nav.map((item, index) => (
                    <Fragment key={item}>
                      {index > 0 && <span className="mx-5px">&gt;</span>}
                      <span>{item}</span>
                    </Fragment>
                  ))}
                {!item.nav && <span>{currentLanguage === 'en' ? item.labelEn : item.label}</span>}
              </div>
              <Icon className="icon text-20px p-2px mr-5px" icon="ant-design:enter-outlined" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default SearchResult;
