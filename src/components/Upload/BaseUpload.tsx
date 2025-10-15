import { Button, Upload, type UploadProps } from 'antd';

function BaseUpload(props: UploadProps) {
  const { t } = useTranslation();
  const [getToken] = useToken();
  const token = getToken();

  return (
    <Upload {...props} headers={{ ...props?.headers, Authorization: `Bearer ${token}` }}>
      <Button>{t('public.uploadFile')}</Button>
    </Upload>
  );
}

export default BaseUpload;
