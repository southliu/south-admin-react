import type { InputProps } from 'antd';
import { useClipboard } from '@/hooks/useClipboard';
import { useTranslation } from 'react-i18next';
import { Input, message } from 'antd';
import { useEffect } from 'react';

const { Search } = Input;

function CopyInput(props: InputProps) {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [isCopied, error, copyText] = useClipboard();

  useEffect(() => {
    if (isCopied && !error) {
      messageApi.success({ content: t('public.copySuccessfully'), key: 'copy' });
    }

    if (error) {
      messageApi.warning({ content: error || t('public.copyFailed'), key: 'copy' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCopied, error]);

  /**
   * 处理复制
   * @param value - 复制内容
   */
  const handleCopy = (value: string) => {
    if (!value) return messageApi.warning({ content: t('public.inputPleaseEnter'), key: 'copy' });
    try {
      copyText(value);
    } catch (e) {
      console.error(e);
      messageApi.warning({ content: t('public.copyFailed'), key: 'copy' });
    }
  };

  return (
    <>
      {contextHolder}
      <Search
        {...props}
        placeholder={t('public.inputPleaseEnter')}
        enterButton={t('public.copy')}
        onSearch={handleCopy}
      />
    </>
  );
}

export default CopyInput;
