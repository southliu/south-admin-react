import ReactDOM from 'react-dom/client';
import Router from './router';
import '@/assets/css/public.less';
import '@/assets/fonts/font.less';

// 样式
import { StyleProvider, legacyLogicalPropertiesTransformer } from '@ant-design/cssinjs'; // 兼容低版本浏览器
import 'uno.css';
import 'nprogress/nprogress.css';
import '@/assets/css/scrollbar.less';
import '@/assets/css/theme-color.less';

// 国际化i18n
import './locales/config';

// antd
import '@/assets/css/antd.less';

// 时间设为中文
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

// 性能监控
import { initPerformanceMonitoring } from '@/utils/performance';
import { initSentry } from '@/utils/sentry';

// 初始化性能监控
initPerformanceMonitoring();

// 初始化 Sentry (需要在 .env 中配置 VITE_SENTRY_DSN)
initSentry();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StyleProvider hashPriority="high" transformers={[legacyLogicalPropertiesTransformer]}>
    <Router />
  </StyleProvider>,
);

// 关闭loading
const firstElement = document.getElementById('first');
if (firstElement && firstElement.style?.display !== 'none') {
  firstElement.style.display = 'none';
}
