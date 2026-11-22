import type { TFunction } from 'i18next';

/**
 * 获取当前语言的系统标题后缀
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 */
export const TITLE_SUFFIX = (t: TFunction) => t('public.currentName'); // 标题后缀
export const WATERMARK_PREFIX = 'admin'; // 水印前缀
export const TOKEN = 'admin_token'; // token名称
export const LANG = 'lang'; // 语言
export const VERSION = 'admin_version'; // 版本
export const EMPTY_VALUE = '-'; // 空值显示
export const THEME_KEY = 'theme_key'; // 主题

// 初始化分页数据
export const INIT_PAGINATION = {
  page: 1,
  pageSize: 20,
};

// 日期格式化
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_PICKER_FORMAT = 'HH:mm:ss';

// 公共组件默认值
export const FORM_REQUIRED = [{ required: true }]; // 表单必填校验

/**
 * 新增/编辑标题
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 * @param title - 业务标题，用于拼接新增页面或弹窗标题
 */
export const ADD_TITLE = (t: TFunction, title?: string) =>
  t('public.createTitle', { title: title ?? '' });
export const EDIT_TITLE = (t: TFunction, name: string, title?: string) =>
  `${t('public.editTitle', { title: title ?? '' })}${name ? `(${name})` : ''}`;

/**
 * 密码规则
 * @param t - 国际化翻译函数，用于生成当前语言的文案
 */
export const PASSWORD_RULE = (t: TFunction) => ({
  pattern: /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*+\.\_\-*]{6,30}$/,
  message: t('login.passwordRuleMessage'),
});

// 环境判断
const ENV = import.meta.env.VITE_ENV as string;
// 生成环境所用的接口
const URL = import.meta.env.VITE_BASE_URL as string;
// 上传地址
export const FILE_API = `${ENV === 'development' ? '/api' : URL}/authority/file/upload-file`;
