import type { FormProps } from 'antd';
import { InputNumber, message } from 'antd';
import { Form, Button, Input } from 'antd';
import { setTitle } from '@/utils/helper';
import { message as globalMessage } from '@south/message';
import { forgetPassword } from '@/servers/login';
import Logo from '@/assets/images/logo.svg';

interface ForgetData {
  username: string;
  newPassword: string;
  confirmPassword: string;
  phone: number;
  verification: number;
}

function Forget() {
  const { t, i18n } = useTranslation();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [verificationTime, setVerificationTime] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
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

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current as NodeJS.Timeout);
        timer.current = null;
      }
    };
  }, []);

  // 语言切换修改title
  useEffect(() => {
    setTitle(t, t('login.resetPassword'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  /**
   * 修改密码
   * @param values - 表单数据
   */
  const handleFinish: FormProps['onFinish'] = async (values: ForgetData) => {
    // 当密码和确认密码不同时则提示错误
    if (values.newPassword !== values.confirmPassword) {
      return messageApi.warning({
        content: t('login.confirmPasswordMessage'),
        key: 'confirmPassword',
      });
    }

    try {
      setLoading(true);
      const { code } = await forgetPassword(values);
      if (Number(code) !== 200) return;

      globalMessage.success({
        content: t('login.verificationPassed'),
        key: 'success',
      });
      navigate(`/login${search}`);
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

  /** 点击获取验证码 */
  const onVerificationCode = () => {
    const phone = form.getFieldValue('phone');

    if (!phone) {
      return messageApi.warning({
        content: t('public.pleaseEnter', { name: t('login.phoneNumber') }),
        key: 'phone',
      });
    }

    // 匹配是否是正确手机号码
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      return messageApi.warning({
        content: t('login.phoneNumberError'),
        key: 'phone',
      });
    }

    setVerificationTime(60);
    timer.current = setInterval(() => {
      setVerificationTime((prev) => {
        if (prev <= 1) {
          if (timer.current) {
            clearInterval(timer.current as NodeJS.Timeout);
            timer.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // ...获取验证码逻辑
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
            w-400px
            p-2rem
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
          <div className="pb-30px flex items-center justify-center">
            <img className="mr-2 object-contain" width="32" height="32" src={Logo} alt="LOGO" />
            <span className="text-22px font-bold tracking-2px">{t('login.resetPassword')}</span>
          </div>
          <Form
            form={form}
            name="horizontal_login"
            autoComplete="on"
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('public.pleaseEnter', { name: t('login.username') }) },
              ]}
            >
              <Input allow-clear="true" placeholder={t('login.username')} autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: t('public.pleaseEnter', { name: t('login.password') }) },
                PASSWORD_RULE(t),
              ]}
            >
              <PasswordStrength placeholder={t('login.password')} autoComplete="current-password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                {
                  required: true,
                  message: t('public.pleaseEnter', { name: t('login.confirmPassword') }),
                },
                PASSWORD_RULE(t),
              ]}
            >
              <PasswordStrength
                placeholder={t('login.confirmPassword')}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                {
                  required: true,
                  message: t('public.pleaseEnter', { name: t('login.phoneNumber') }),
                },
                { pattern: /^1[3-9]\d{9}$/, message: t('login.phoneNumberError') },
              ]}
            >
              <InputNumber
                controls={false}
                className="!w-full"
                placeholder={t('login.phoneNumber')}
                autoComplete="phone"
              />
            </Form.Item>

            <div className="flex justify-between">
              <Form.Item
                name="verification"
                rules={[
                  {
                    required: true,
                    message: t('public.pleaseEnter', { name: t('login.verificationCode') }),
                  },
                ]}
              >
                <InputNumber
                  controls={false}
                  className="!w-210px"
                  placeholder={t('login.verificationCode')}
                />
              </Form.Item>

              <Button
                type="primary"
                className="w-120px"
                disabled={verificationTime > 0}
                onClick={onVerificationCode}
              >
                {verificationTime > 0 ? (
                  <span>{t('login.reacquire', { time: verificationTime })}</span>
                ) : (
                  t('login.getVerificationCode')
                )}
              </Button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full mt-5px rounded-5px tracking-2px"
              loading={isLoading}
            >
              {t('public.confirm')}
            </Button>
          </Form>

          <Button
            htmlType="submit"
            className="w-full mt-12px mb-10px rounded-5px tracking-2px"
            onClick={() => navigate(`/login${search}`)}
          >
            {t('public.back')}
          </Button>
        </div>
      </div>
    </>
  );
}

export default Forget;
