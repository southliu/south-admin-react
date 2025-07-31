import { TreeSelect, type TreeSelectProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { MAX_TAG_COUNT } from './index';

function BaseTreeSelect(props: TreeSelectProps) {
  const { treeData } = props;
  const { t } = useTranslation();

  const currentTreeData =
    treeData?.map((item) => {
      // 如果数组不是对象，则拼接数组
      if (typeof item !== 'object') {
        return { label: item, value: item };
      }
      return item;
    }) || [];

  return (
    <TreeSelect
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      treeNodeFilterProp={props?.fieldNames?.label || 'label'}
      placeholder={t('public.inputPleaseSelect')}
      {...props}
      treeData={currentTreeData}
    />
  );
}

export default BaseTreeSelect;
