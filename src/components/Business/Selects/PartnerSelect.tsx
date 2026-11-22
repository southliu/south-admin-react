import type { SelectProps } from 'antd';
import { getPartner } from '@/servers/platform/partner';
import { ApiSelect } from '@/components/Selects';

/**
 * 合作公司下拉组件
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function PartnerSelect(props: SelectProps) {
  return (
    <ApiSelect
      {...props}
      api={getPartner}
      mode="multiple"
      fieldNames={{ label: 'name', value: 'id' }}
    />
  );
}

export default PartnerSelect;
