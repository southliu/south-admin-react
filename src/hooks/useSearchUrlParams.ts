import type { BaseFormData } from '#/form';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useTabsStore } from '@/stores/tabs';
import { useEffect, useMemo } from 'react';
/** 将搜索参数带入url中 */
import { getUrlAllParam } from '@/utils/helper';
import { type FormInstance } from 'antd';

export const useSearchUrlParams = (form: FormInstance) => {
  const { pathname, search } = useLocation();
  const { setTabs } = useTabsStore(useShallow((state) => ({ setTabs: state.setTabs })));
  const [, setSearchParams] = useSearchParams();
  const searchData = useMemo(() => getUrlAllParam(search), [search]);

  /** url参数带入搜索表单中 */
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue(searchData);
  }, [form, searchData]);

  /**
   * 将搜索参数带入url中
   * @param searchParams - 搜索表单数据，用于更新地址栏查询参数
   */
  const handleSetSearchParams = (searchParams: BaseFormData) => {
    // 去除 values 中值为 undefined 的属性
    const filteredValues = Object.fromEntries(
      Object.entries(searchParams).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;

    // 将对象转换为 url 参数字符串
    let urlParams = new URLSearchParams(filteredValues).toString();
    if (urlParams?.length) {
      urlParams = `?${urlParams}`;
    }

    setSearchParams(filteredValues);
    setTabs(pathname, urlParams);
    return urlParams === search;
  };

  return [handleSetSearchParams, searchData] as const;
};
