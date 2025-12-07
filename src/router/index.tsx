import { useEffect } from 'react';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { HashRouter as Router } from 'react-router-dom';
import nprogress from 'nprogress';
import RouterPage from './components/Router';
import StaticMessage from '@south/message';

// antd
import { theme, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';

// 禁止进度条添加loading
nprogress.configure({ showSpinner: false });

// antd主题
const { defaultAlgorithm, darkAlgorithm } = theme;

import { useCommonStore } from '@/hooks/useCommonStore';

function Page() {
  const { i18n } = useTranslation();
  const { theme } = useCommonStore();
  // 获取当前语言
  const currentLanguage = i18n.language;

  useEffect(() => {
    // 关闭loading
    const firstElement = document.getElementById('first');
    if (firstElement && firstElement.style?.display !== 'none') {
      firstElement.style.display = 'none';
    }
  }, []);

  return (
    <Router>
      <ConfigProvider
        locale={currentLanguage === 'en' ? enUS : zhCN}
        theme={{
          algorithm: [theme === 'dark' ? darkAlgorithm : defaultAlgorithm],
        }}
      >
        <App>
          <StaticMessage />
          <RouterPage />
        </App>
      </ConfigProvider>
    </Router>
  );
}

export default Page;
