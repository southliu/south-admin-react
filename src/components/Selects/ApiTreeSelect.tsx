import type { ApiTreeSelectProps } from './types';
import { TreeSelect, type TreeSelectProps } from 'antd';
import { useApiOptions } from './hooks/useApiOptions';
import { useTranslation } from 'react-i18next';
import { MAX_TAG_COUNT } from './index';
import { useState, memo } from 'react';
import Loading from './components/Loading';

function ApiTreeSelect({
  api,
  params,
  apiResultKey,
  value,
  onOpenChange,
  ...props
}: ApiTreeSelectProps) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const hasValue =
    value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
  const { options, isLoading } = useApiOptions(
    { api, params, key: apiResultKey, revision },
    isOpen || hasValue,
  );
  return (
    <TreeSelect
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      treeNodeFilterProp={props.fieldNames?.label || 'label'}
      placeholder={t('public.inputPleaseSelect')}
      {...props}
      value={value}
      loading={isLoading}
      treeData={options as TreeSelectProps['treeData']}
      notFoundContent={isLoading && <Loading />}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRevision((previous) => previous + 1);
        onOpenChange?.(next);
      }}
    />
  );
}
export default memo(ApiTreeSelect);
