/*
 * From Uiverse.io by arthur_6104 - https://uiverse.io/arthur_6104/spotty-snake-91
 * MIT License, Copyright (c) alexruix (Alex Ruiz), arthur_6104 (Arthur Feltz)
 */
import { useTranslation } from 'react-i18next';
import styles from './ContentLoading.module.less';

function ContentLoading() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t('public.loading')}
      aria-busy="true"
      className="absolute inset-0 flex items-center justify-center"
    >
      <div aria-hidden="true" className={styles.loader}>
        <div className={styles.box1} />
        <div className={styles.box2} />
        <div className={styles.box3} />
      </div>
    </div>
  );
}

export default ContentLoading;
