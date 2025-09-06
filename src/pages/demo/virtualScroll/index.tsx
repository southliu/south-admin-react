import { useTranslation } from 'react-i18next';
import { checkPermission } from '@/utils/permissions';
import { useCommonStore } from '@/hooks/useCommonStore';
import VirtualList from './components/VirtualList';
import VirtualTable from './components/VirtualTable';
import BaseContent from '@/components/Content/BaseContent';

function VirtualScroll() {
  const { t } = useTranslation();
  const { permissions, isPhone } = useCommonStore();
  const isPermission = checkPermission('/demo/virtualScroll', permissions);

  return (
    <BaseContent isPermission={isPermission}>
      <div className={`flex overflow-auto ${isPhone ? 'flex-wrap' : ''} px-30px h-full py-5 bg`}>
        <div className="flex flex-col mr-30px mb-20px">
          <h2>{t('content.virtualScroll1')}：</h2>
          <div className="h-500px w-300px b b-#ececec">
            <VirtualList />
          </div>
        </div>

        <div className="overflow-auto">
          <h2>{t('content.virtualScroll2')}：</h2>
          <VirtualTable />
        </div>
      </div>
    </BaseContent>
  );
}

export default VirtualScroll;
