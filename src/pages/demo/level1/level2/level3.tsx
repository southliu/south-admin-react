import { useCommonStore } from '@/hooks/useCommonStore';
import { checkPermission } from '@/utils/permissions';
import { useTranslation } from 'react-i18next';
import BaseContent from '@/components/Content/BaseContent';

function Page() {
  const { t } = useTranslation();
  const { permissions } = useCommonStore();
  const isPermission = checkPermission('/demo/level', permissions);

  return (
    <BaseContent isPermission={isPermission}>
      <div className="m-30px">{t('content.threeTierStructure')}</div>
    </BaseContent>
  );
}

export default Page;
