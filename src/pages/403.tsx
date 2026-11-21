import { getFirstMenu, getMenuByKey } from '@/menus/utils/helper';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTabsStore } from '@/stores/tabs';
import { Button } from 'antd';
import styles from './all.module.less';

function Forbidden() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { permissions, menuList } = useCommonStore();
  const { addTabs, setActiveKey } = useTabsStore();

  /** 跳转首页 */
  const goIndex = () => {
    const firstMenu = getFirstMenu(menuList, permissions);
    navigate(firstMenu);
    const menuByKeyProps = { menus: menuList, permissions, key: firstMenu };
    const newItems = getMenuByKey(menuByKeyProps);
    if (newItems?.key) {
      setActiveKey(newItems.key);
      addTabs(newItems);
    }
  };

  return (
    <div className="text-center">
      <h1 className={`${styles.animation} w-full text-6rem font-bold`}>403</h1>
      <p className="w-full text-20px font-bold mt-15px">{t('public.notPermissionMessage')}</p>
      <Button className="mt-25px margin-auto" onClick={goIndex}>
        {t('public.returnHome')}
      </Button>
    </div>
  );
}

export default Forbidden;
