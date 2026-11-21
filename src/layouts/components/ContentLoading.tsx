import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';

function ContentLoading() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t('public.loading')}
      className="absolute inset-0 flex flex-col items-center justify-center gap-16px"
    >
      <Spin size="large" />
      <span className="text-14px text-gray-500">{t('public.loading')}...</span>
    </div>
  );
}

export default ContentLoading;
