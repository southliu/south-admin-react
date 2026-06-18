import { getFirstMenu, getMenuByKey } from '@/menus/utils/helper';
import { getMenuList } from '@/servers/system/menu';
import { getUserRefreshPermissions } from '@/servers/system/user';
import { useMenuStore, useUserStore } from '@/stores';
import { Button } from 'antd';
import styles from './all.module.less';

function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { permissions, menuList } = useCommonStore();
  const { setMenuList } = useMenuStore();
  const { setPermissions, setUserInfo } = useUserStore();
  const { addTabs, setActiveKey } = useTabsStore();

  /** 获取用户权限 */
  const fetchPermissions = async (): Promise<string[]> => {
    try {
      const { code, data } = await getUserRefreshPermissions({ refresh_cache: false });
      if (Number(code) === 200 && data) {
        const { user, permissions } = data;
        setUserInfo(user);
        setPermissions(permissions);
        return permissions;
      }
    } catch (err) {
      console.error('获取权限数据失败:', err);
    }
    return [];
  };

  /** 获取菜单数据 */
  const fetchMenuList = async (): Promise<SideMenu[]> => {
    try {
      const { code, data } = await getMenuList();
      if (Number(code) === 200 && data) {
        setMenuList(data);
        return data;
      }
    } catch (err) {
      console.error('获取菜单数据失败:', err);
    }
    return [];
  };

  /** 跳转首页 */
  const goIndex = async () => {
    let currentPermissions = permissions;
    let currentMenuList = menuList;

    // 如果 permissions 为空，先获取权限
    if (currentPermissions.length === 0) {
      currentPermissions = await fetchPermissions();
    }

    // 如果 menuList 为空，获取菜单数据
    if (currentMenuList.length === 0) {
      currentMenuList = await fetchMenuList();
    }

    // 如果仍然为空，直接返回
    if (currentMenuList.length === 0) return;

    const firstMenu = getFirstMenu(currentMenuList, currentPermissions);
    navigate(firstMenu || '/');
    const menuByKeyProps = {
      menus: currentMenuList,
      permissions: currentPermissions,
      key: firstMenu,
    };
    const newItems = getMenuByKey(menuByKeyProps);
    if (newItems?.key) {
      setActiveKey(newItems.key);
      addTabs(newItems);
    }
  };

  return (
    <div className="absolute left-50% top-50% -translate-x-1/2 -translate-y-1/2 text-center">
      <h1 className={`${styles.animation} w-full text-6rem font-bold`}>404</h1>
      <p className="w-full text-20px font-bold mt-15px">{t('public.notFindMessage')}</p>
      <Button className="mt-25px margin-auto" onClick={goIndex}>
        {t('public.returnHome')}
      </Button>
    </div>
  );
}

export default NotFound;
