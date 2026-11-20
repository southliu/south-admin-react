import { useEffect } from 'react';
import type { ButtonProps } from 'antd';
import { Button, message } from 'antd';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useClipboard } from '@/hooks/useClipboard';

interface Props extends ButtonProps {
  text: string;
  value: string;
}

function CopyBtn(props: Props) {
  const { text, value } = props;
  const { t } = useTranslation();
  const [isCopied, error, copyText] = useClipboard();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isCopied && !error) {
      messageApi.success({ content: t('public.copySuccessfully'), key: 'copy' });
    }

    if (error) {
      messageApi.warning({ content: error || t('public.copyFailed'), key: 'copy' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCopied, error]);

  /** 点击处理 */
  const onClick = () => {
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
      <Button {...props} icon={<Icon icon="ant-design:copy-outlined" />} onClick={onClick}>
        {text}
      </Button>
    </>
  );
}

export default CopyBtn;
