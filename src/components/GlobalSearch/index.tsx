import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Spin, Tooltip } from 'antd';

const SearchModal = lazy(() => import('./components/SearchModal'));

/** 全局搜索菜单组件 */
function GlobalSearch() {
  const { t } = useTranslation();
  const [isSearchLoaded, setSearchLoaded] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);

  /** 切换显示 */
  const toggle = () => {
    setSearchLoaded(true);
    setSearchOpen(true);
  };

  return (
    <>
      <Tooltip title={t('public.search')}>
        <button
          type="button"
          aria-label={t('public.search')}
          className="flex items-center justify-center text-lg mr-3 cursor-pointer border-0 bg-transparent p-0"
          onClick={toggle}
        >
          <Icon icon="uil:search" />
        </button>
      </Tooltip>

      {isSearchLoaded && (
        <Suspense
          fallback={
            <Spin
              fullscreen
              description={t('public.loading')}
            />
          }
        >
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setSearchOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default GlobalSearch;
