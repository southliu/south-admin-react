import type { TreeSelectProps } from 'antd';
import type { ApiTreeSelectProps } from './types';
import { TreeSelect } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect, useState, memo } from 'react';
import { MAX_TAG_COUNT } from './index';
import Loading from './components/Loading';

/**
 * @description: 根据API获取数据下拉树形组件
 */
function ApiTreeSelect(props: ApiTreeSelectProps) {
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const [options, setOptions] = useState<TreeSelectProps['treeData']>([]);

  // 清除自定义属性
  const params: Partial<ApiTreeSelectProps> = { ...props };
  delete params.api;
  delete params.params;
  delete params.apiResultKey;

  /** 获取接口数据 */
  const getApiData = useCallback(async () => {
    if (!props.api) return;
    try {
      const { api, params, apiResultKey } = props;

      setLoading(true);
      if (api) {
        const apiFun = Array.isArray(params) ? api(...params) : api(params);
        const { code, data } = await apiFun;
        if (Number(code) !== 200) return;
        const result = apiResultKey
          ? (data as { [apiResultKey: string]: unknown })?.[apiResultKey]
          : data;
        setOptions(result as TreeSelectProps['treeData']);
      }
    } finally {
      setLoading(false);
    }
  }, [props.api, props.params, props.apiResultKey]);

  useEffect(() => {
    // 当有值且列表为空时，自动获取接口
    if (props.value && options?.length === 0) {
      getApiData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  /**
   * 展开下拉回调
   * @param open - 是否展开
   */
  const onOpenChange = (open: boolean) => {
    if (open) getApiData();

    props.onOpenChange?.(open);
  };

  return (
    <TreeSelect
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      treeNodeFilterProp={params?.fieldNames?.label || 'label'}
      placeholder={t('public.inputPleaseSelect')}
      {...params}
      loading={isLoading}
      treeData={options}
      notFoundContent={isLoading && <Loading />}
      onOpenChange={onOpenChange}
    />
  );
}

export default memo(ApiTreeSelect, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && prevProps.api === nextProps.api;
});
