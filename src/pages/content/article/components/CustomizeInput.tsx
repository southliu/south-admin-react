import type { InputProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { Input } from 'antd';

/**
 * 自定义输入
 */
function CustomizeInput(props: InputProps) {
  const { t } = useTranslation();

  return (
    <>
      <Input {...props} placeholder={t('public.inputPleaseEnter')} />
      <div className="mb-5px text-red">{t('content.sensitiveInfo')}</div>
    </>
  );
}

export default CustomizeInput;
