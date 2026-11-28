import type { ThemeType } from '@/stores/public';
import type { SideMenu } from '#/public';
import type { LoginData } from './model';
import type { FormProps } from 'antd';
import { getUserRefreshPermissions } from '@/servers/system/user';
import { Form, Button, Input, Checkbox, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLoginRedirect, setTitle } from '@/utils/helper';
import { THEME_KEY, PASSWORD_RULE } from '@/utils/config';
import { useCommonStore } from '@/hooks/useCommonStore';
import { getFirstMenu } from '@/menus/utils/helper';
import { useShallow } from 'zustand/react/shallow';
import { LOGIN_EXPIRED_MSG } from '@south/request';
import { cancelAllRequest } from '@/utils/request';
import { USER_LENGTH } from '@/utils/fieldLimits';
import { loadMenuList } from '@/menus/utils/load';
import { usePublicStore } from '@/stores/public';
import { useTranslation } from 'react-i18next';
import { useMenuStore } from '@/stores/menu';
import { useUserStore } from '@/stores/user';
import { useToken } from '@/hooks/useToken';
import { useState, useEffect } from 'react';
import { login } from '@/servers/login';
import Logo from '@/assets/images/logo.svg';
import Theme from '@/components/Theme';
import I18n from '@/components/I18n';

const USER_USERNAME = 'login_username';
const CHECK_REMEMBER = 'remember_me';
const showDefaultAccount = import.meta.env.VITE_SHOW_DEFAULT_ACCOUNT === 'true';
const defaultUsername = showDefaultAccount ? 'admin' : '';
const defaultPassword = showDefaultAccount ? 'admin123456' : '';

function Login() {
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const { permissions } = useCommonStore(['permissions']);
  const { setPermissions, setUserInfo } = useUserStore(
    useShallow((state) => ({
      setPermissions: state.setPermissions,
      setUserInfo: state.setUserInfo,
    })),
  );
  const [isLoading, setLoading] = useState(false);
  const [isRemember, setRemember] = useState(() => localStorage.getItem(CHECK_REMEMBER) !== 'false');
  const [form] = Form.useForm();
  const [getToken, setToken] = useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const setMenuList = useMenuStore((state) => state.setMenuList);
  const setThemeValue = usePublicStore((state) => state.setThemeValue);
  const themeCache = (localStorage.getItem(THEME_KEY) || 'light') as ThemeType;

  useEffect(() => {
    if (!themeCache) {
      localStorage.setItem(THEME_KEY, 'light');
    }
    if (themeCache === 'dark') {
      document.body.className = 'theme-dark';
    }
    setThemeValue(themeCache === 'dark' ? 'dark' : 'light');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeCache]);

  // 语言切换修改title
  useEffect(() => {
    setTitle(t, t('login.login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  /** 获取用户权限 */
  async function getUserPermissions() {
    try {
      setLoading(true);
      const { code, data } = await getUserRefreshPermissions({ refresh_cache: false });
      if (Number(code) !== 200) return;
      const { user, permissions } = data;
      setUserInfo(user);
      setPermissions(permissions);
      await handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  }

  /** 获取菜单数据 */
  const getMenuData = async () => {
    const cached = useMenuStore.getState().menuList;
    if (cached?.length) return cached;
    let result: SideMenu[] | undefined;

    try {
      setLoading(true);
      const { code, data } = await loadMenuList();
      if (Number(code) !== 200) return;
      setMenuList(data || []);
      result = data || [];
    } catch (error) {
      console.error('获取菜单数据失败:', error);
    } finally {
      setLoading(false);
    }

    return result;
  };

  /**
   * 菜单跳转
   * @param permissions - 权限列表
   */
  async function handleGoMenu(permissions: string[]) {
    let menuData: SideMenu[] | undefined = useMenuStore.getState().menuList;
    if (!menuData?.length) {
      menuData = await getMenuData();
    }

    if (!menuData) return;

    // 成功返回空菜单时留在登录页，避免带着空菜单进入布局。
    if (!menuData?.length) {
      return messageApi.error({ content: t('login.notPermissions'), key: 'permissions' });
    }

    // 如果存在重定向
    const redirect = getLoginRedirect(search);
    if (redirect) {
      navigate(redirect);
      return;
    }

    // 有权限则直接跳转
    const firstMenu = getFirstMenu(menuData, permissions);
    if (!firstMenu) {
      return messageApi.error({ content: t('login.notPermissions'), key: 'permissions' });
    }
    navigate(firstMenu);
  }

  useEffect(() => {
    // 清除上一会话的残留请求
    cancelAllRequest();

    // 如果存在token，则直接进入页面
    if (getToken()) {
      // 如果不存在缓存则获取权限
      if (!permissions.length) {
        getUserPermissions();
      } else {
        // 有权限则直接跳转
        handleGoMenu(permissions);
      }
    }

    // 迁移旧缓存：只记住账号，取消勾选时不恢复用户名。
    localStorage.removeItem('login_password');
    if (!isRemember) localStorage.removeItem(USER_USERNAME);

    // 读取权限过期提示（由请求拦截器在整页跳转前写入 localStorage）
    const expiredMsg = localStorage.getItem(LOGIN_EXPIRED_MSG);
    if (expiredMsg) {
      messageApi.error({ content: expiredMsg, key: 'permission-expired' });
      localStorage.removeItem(LOGIN_EXPIRED_MSG);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 处理登录
   * @param values - 表单数据
   */
  const handleFinish: FormProps['onFinish'] = async (values: LoginData) => {
    try {
      handleRemember(isRemember, values.username);
      setLoading(true);
      const { code, data } = await login(values);
      if (Number(code) !== 200) return;
      const { token, user, permissions } = data;

      if (!permissions?.length || !token) {
        return messageApi.error({ content: t('login.notPermissions'), key: 'permissions' });
      }

      setToken(token);
      setUserInfo(user);
      setPermissions(permissions);

      await handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理失败
   * @param errors - 错误信息
   */
  const handleFinishFailed: FormProps['onFinishFailed'] = (errors) => {
    console.error('错误信息:', errors);
  };

  /**
   * 保存账号记忆偏好及用户名
   * @param checked - 是否记住账号，取消时立即清除缓存
   * @param username - 当前输入的用户名，不保存密码
   */
  const handleRemember = (checked: boolean, username: string = form.getFieldValue('username') || '') => {
    setRemember(checked);
    localStorage.setItem(CHECK_REMEMBER, String(checked));
    if (checked && username) localStorage.setItem(USER_USERNAME, username);
    else localStorage.removeItem(USER_USERNAME);
  };

  /** 点击忘记密码 */
  const onForgetPassword = () => {
    navigate(`/forget${search}`);
  };

  return (
    <>
      {contextHolder}
      <div
        className={`
          ${themeCache === 'dark' ? 'bg-black text-white' : 'bg-light-400'}
          w-screen
          h-screen
          relative
        `}
      >
        <div className="flex absolute top-5 right-5">
          <I18n />
          <Theme />
        </div>
        <div
          className={`
            ${themeCache === 'dark' ? 'bg-black bg-dark-200' : 'bg-white'}
            w-340px
            px-1.8rem
            py-1rem
            rounded-10px
            box-border
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            shadow-[2px_5px_20px_rgba(0,0,0,0.1)]
          `}
        >
          <div className="pb-20px pt-10px flex items-center justify-center">
            <img
              className="mr-2 object-contain"
              width="32"
              height="32"
              src={Logo}
              alt="LOGO"
            />
            <span className="text-22px font-bold tracking-2px">{t('login.systemLogin')}</span>
          </div>
          <Form
            form={form}
            layout="vertical"
            name="horizontal_login"
            autoComplete="on"
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            initialValues={{ username: (isRemember ? localStorage.getItem(USER_USERNAME) : '') || defaultUsername, password: defaultPassword }}
            onValuesChange={(changed) => {
              if ('username' in changed) handleRemember(isRemember, changed.username);
            }}
          >
            <div className="text-#AAA6A6 text-14px mb-8px">{t('login.username')}</div>

            <Form.Item
              name="username"
              className="!mb-15px"
              rules={[
                { required: true, message: t('public.pleaseEnter', { name: t('login.username') }) },
              ]}
            >
              <Input
                maxLength={USER_LENGTH.username}
                allow-clear="true"
                placeholder={t('public.pleaseEnter', { name: t('login.username') })}
                autoComplete="username"
              />
            </Form.Item>

            <div className="text-#AAA6A6 text-14px mb-8px">{t('login.password')}</div>

            <Form.Item
              name="password"
              className="!mb-15px"
              rules={[
                { required: true, message: t('public.pleaseEnter', { name: t('login.password') }) },
                PASSWORD_RULE(t),
              ]}
            >
              <Input.Password
                maxLength={USER_LENGTH.password}
                placeholder={t('public.pleaseEnter', { name: t('login.password') })}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full mt-15px mb-25px rounded-5px tracking-2px"
              loading={isLoading}
            >
              {t('login.login')}
            </Button>
          </Form>

          <div className="flex justify-between items-center mb-5px px-1px">
            <Checkbox checked={isRemember} onChange={(event) => handleRemember(event.target.checked)}>
              {t('login.rememberAccount')}
            </Checkbox>
            <div
              className="text-blue-500 cursor-pointer"
              onClick={onForgetPassword}
            >
              {t('login.forgetPassword')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
