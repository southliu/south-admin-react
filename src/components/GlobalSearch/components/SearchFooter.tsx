import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import styles from '../index.module.less';

function SearchFooter() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center text-dark-50">
      <span className="mr-14px flex items-center">
        <Icon
          className={`${styles.icon} text-20px p-2px mr-5px`}
          icon="ant-design:enter-outlined"
        />
        <span>{t('public.confirm')}</span>
      </span>
      <span className="mr-14px flex items-center">
        <Icon className={`${styles.icon} text-20px p-2px mr-5px`} icon="mdi-arrow-up-thin" />
        <Icon className={`${styles.icon} text-20px p-2px mr-5px`} icon="mdi-arrow-down-thin" />
        <span>{t('public.switch')}</span>
      </span>
      <span className="flex items-center">
        <Icon className={`${styles.icon} text-20px p-2px mr-5px`} icon="mdi:keyboard-esc" />
        <span>{t('public.close')}</span>
      </span>
    </div>
  );
}

export default SearchFooter;
