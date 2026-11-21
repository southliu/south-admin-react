import { ThemeType, usePublicStore } from '@/stores/public';
import { MouseEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { THEME_KEY } from '@/utils/config';
import { Icon } from '@iconify/react';
import { Tooltip } from 'antd';
import './index.module.less';

function Theme() {
  const { t } = useTranslation();
  const themeCache = (localStorage.getItem(THEME_KEY) || 'light') as ThemeType;
  const [theme, setTheme] = useState<ThemeType>(themeCache);
  const setThemeValue = usePublicStore((state) => state.setThemeValue);

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

  /**
   * 处理更新
   * @param type - 主题类型
   */
  const onChange = (e: MouseEvent, type: ThemeType) => {
    const transition = document.startViewTransition(() => {
      toggleThemeScheme(type);
    });

    transition.ready.then(() => {
      // 获取鼠标的坐标
      const { clientX, clientY } = e;

      // 计算最大半径
      const radius = Math.hypot(
        Math.max(clientX, innerWidth - clientX),
        Math.max(clientY, innerHeight - clientY),
      );

      // 圆形动画扩散
      document.documentElement.animate(
        [
          { clipPath: `circle(0% at ${clientX}px ${clientY}px)` },
          { clipPath: `circle(${radius}px at ${clientX}px ${clientY}px)` },
        ],
        {
          duration: 400,
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  /**
   * 切换主题
   */
  const toggleThemeScheme = (type: ThemeType) => {
    localStorage.setItem(THEME_KEY, type);
    setThemeValue(type);
    setTheme(type);

    switch (type) {
      case 'dark':
        document.body.className = 'theme-dark';
        break;

      default:
        document.body.className = 'theme-primary';
        break;
    }
  };

  return (
    <Tooltip title={t('public.themes')}>
      <div className={'flex items-center justify-center text-17px mr-4 cursor-pointer'}>
        <div
          style={{ display: theme === 'light' ? 'block' : 'none' }}
          onClick={(e) => onChange(e, 'dark')}
        >
          <Icon icon="mdi-white-balance-sunny" />
        </div>
        <div
          style={{ display: theme !== 'light' ? 'block' : 'none' }}
          onClick={(e) => onChange(e, 'light')}
        >
          <Icon icon="mdi-moon-waning-crescent" />
        </div>
      </div>
    </Tooltip>
  );
}

export default Theme;
