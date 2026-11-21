import type { DefaultOptionType } from 'antd/es/select';
import type { ApiFn, ApiParams } from '../types';
import { fetchOptions, getOptions } from '../utils/apiOptions';
import { useEffect, useState } from 'react';

export function useApiOptions(
  {
    api,
    params,
    key,
    revision = 0,
  }: { api?: ApiFn; params?: ApiParams; key?: string; revision?: number },
  enabled: boolean,
) {
  const [options, setOptions] = useState<DefaultOptionType[]>([]);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setOptions([]);
      setLoading(Boolean(api && enabled));
      if (!api || !enabled) return;
      try {
        const data = await fetchOptions(api, params);
        if (active) setOptions(getOptions(data, key));
      } catch {
        // 请求层已展示错误，失败时不保留上一组参数的选项。
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [api, params, key, enabled, revision]);
  return { options, isLoading };
}
