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

// 初始化全局错误处理（防止应用崩溃和自动刷新）- 必须同步执行
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    console.error('Unhandled promise rejection:', event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.message);
  });
}

// 优先渲染应用，减少首屏加载时间
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

// 延迟初始化非关键服务，不阻塞首屏渲染
// 使用 requestIdleCallback 在浏览器空闲时初始化，或使用 setTimeout 作为降级方案
const deferredInit = () => {
  // 初始化性能监控
  initPerformanceMonitoring();

  // 初始化 Sentry (需要在 .env 中配置 VITE_SENTRY_DSN)
  initSentry();
};

// 检查是否支持 requestIdleCallback
if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(() => deferredInit());
} else {
  // 降级方案：使用 setTimeout 延迟执行
  setTimeout(deferredInit, 0);
}
