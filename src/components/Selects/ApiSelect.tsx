import type { ApiSelectProps } from './types';
import { useApiOptions } from './hooks/useApiOptions';
import { useTranslation } from 'react-i18next';
import { MAX_TAG_COUNT } from './index';
import { useState, memo } from 'react';
import { Select } from 'antd';
import Loading from './components/Loading';

function ApiSelect({ api, params, apiResultKey, value, onOpenChange, ...props }: ApiSelectProps) {
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
    <Select
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      optionFilterProp={props.fieldNames?.label || 'label'}
      placeholder={t('public.inputPleaseSelect')}
      {...props}
      value={value}
      loading={isLoading}
      options={options}
      notFoundContent={isLoading && <Loading />}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setRevision((previous) => previous + 1);
        onOpenChange?.(next);
      }}
    />
  );
}
export default memo(ApiSelect);
