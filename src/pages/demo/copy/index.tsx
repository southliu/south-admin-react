import { useCommonStore } from '@/hooks/useCommonStore';
import { checkPermission } from '@/utils/permissions';
import { useTranslation } from 'react-i18next';
import BaseContent from '@/components/Content/BaseContent';
import CopyInput from '@/components/Copy/CopyInput';
import CopyBtn from '@/components/Copy/CopyBtn';

function CopyPage() {
  const { t } = useTranslation();
  const { permissions } = useCommonStore();
  const isPermission = checkPermission('/demo/copy', permissions);

  return (
    <BaseContent isPermission={isPermission}>
      <div className="max-w-350px m-10px p-5 rounded-3 bg">
        <h1>{t('content.clipboard')}：</h1>
        <CopyInput className="w-350px" />

        <div className="flex items-center mt-50px">
          <span className="text-lg">{t('content.clipboardMessage')}：</span>
          <CopyBtn text={t('public.copy')} value="admin" />
        </div>
      </div>
    </BaseContent>
  );
}

export default CopyPage;
