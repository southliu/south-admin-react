import { useCommonStore } from '@/hooks/useCommonStore';
import { checkPermission } from '@/utils/permissions';
import { useParams } from 'react-router-dom';
import BaseContent from '@/components/Content/BaseContent';
import BaseCard from '@/components/Card/BaseCard';

function Dynamic() {
  const { id } = useParams();
  const { permissions } = useCommonStore();
  const isPermission = checkPermission('/demo/dynamic', permissions);

  return (
    <BaseContent isPermission={isPermission}>
      <BaseCard className="mt-10px mx-5px">
        <div>/demo/123/dynamic中的123为动态参数，可自由修改，文件路径为：/demo/[id]/dynamic。</div>
        <div>
          id: <span className="font-bold">{id}</span>
        </div>
      </BaseCard>
    </BaseContent>
  );
}

export default Dynamic;
