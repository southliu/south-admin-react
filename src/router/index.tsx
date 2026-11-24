import { startVersionCheck } from '@/layouts/utils/helper';
import { HashRouter as Router } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { App } from 'antd';
import RouterPage from './components/Router';
import StaticMessage from '@south/message';
import nprogress from 'nprogress';
import dayjs from 'dayjs';

// antd
import { theme, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

// 禁止进度条添加loading
nprogress.configure({ showSpinner: false });

// antd主题
const { defaultAlgorithm, darkAlgorithm } = theme;

import { useCommonStore } from '@/hooks/useCommonStore';

/** 在登录页和业务页面统一监测构建更新 */
function VersionMonitor() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  useEffect(() => startVersionCheck(t, message), [t, message]);
  return null;
}

function Page() {
  const { i18n } = useTranslation();
  const { theme } = useCommonStore(['theme']);
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language).startsWith('en');
  const locale = isEnglish ? enUS : zhCN;

  useEffect(() => {
    dayjs.locale(isEnglish ? 'en' : 'zh-cn');
  }, [isEnglish]);

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

  return (
    <Router>
      <ConfigProvider locale={locale} theme={themeConfig}>
        <App>
          <VersionMonitor />
          <StaticMessage />
          <RouterPage />
        </App>
      </ConfigProvider>
    </Router>
  );
}

export default Page;
