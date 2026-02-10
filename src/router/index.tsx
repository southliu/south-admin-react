import { useEffect, useState, useMemo } from 'react';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { HashRouter as Router } from 'react-router-dom';
import nprogress from 'nprogress';
import RouterPage from './components/Router';
import StaticMessage from '@south/message';

// antd
import { theme, ConfigProvider } from 'antd';

// 禁止进度条添加loading
nprogress.configure({ showSpinner: false });

// antd主题
const { defaultAlgorithm, darkAlgorithm } = theme;

import { useCommonStore } from '@/hooks/useCommonStore';

function Page() {
  const { i18n } = useTranslation();
  const { theme } = useCommonStore();
  const [locale, setLocale] = useState<any>(null);

  // 获取当前语言
  const currentLanguage = i18n.language;

  // 懒加载 antd locale，减少首屏加载体积
  useEffect(() => {
    let isMounted = true;

    const loadLocale = async () => {
      try {
        const localeModule = await import(
          /* @vite-ignore */
          currentLanguage === 'en' ? 'antd/es/locale/en_US' : 'antd/es/locale/zh_CN'
        );
        if (isMounted) {
          setLocale(localeModule.default);
        }
      } catch (error) {
        console.error('Failed to load antd locale:', error);
        if (isMounted) {
          const zhCN = await import(
            /* @vite-ignore */
            'antd/es/locale/zh_CN'
          );
          setLocale(zhCN.default);
        }
      }
    };

    loadLocale();

    return () => {
      isMounted = false;
    };
  }, [currentLanguage]);

  useEffect(() => {
    // 关闭loading
    const firstElement = document.getElementById('first');
    if (firstElement && firstElement.style?.display !== 'none') {
      firstElement.style.display = 'none';
    }
  }, []);

  // 缓存 ConfigProvider 的 theme 配置
  const themeConfig = useMemo(
    () => ({
      algorithm: [theme === 'dark' ? darkAlgorithm : defaultAlgorithm],
    }),
    [theme],
  );

  // 在 locale 加载前显示 loading 或使用默认值
  if (!locale) {
    return (
      <Router>
        <ConfigProvider theme={themeConfig}>
          <App>
            <StaticMessage />
            <RouterPage />
          </App>
        </ConfigProvider>
      </Router>
    );
  }

  return (
    <Router>
      <ConfigProvider locale={locale} theme={themeConfig}>
        <App>
          <StaticMessage />
          <RouterPage />
        </App>
      </ConfigProvider>
    </Router>
  );
}

export default Page;
