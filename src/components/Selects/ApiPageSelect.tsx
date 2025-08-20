import type { ApiPageSelectProps } from './types';
import type { DefaultOptionType, SelectProps } from 'antd/es/select';
import { debounce } from 'lodash';
import { Select, Spin } from 'antd';
import { MAX_TAG_COUNT } from './index';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import Loading from './components/Loading';

/**
 * @description: 根据API获取分页数据下拉组件
 */
function ApiPageSelect(props: ApiPageSelectProps) {
  const {
    pageKey = 'page',
    pageSizeKey = 'pageSize',
    queryKey = 'query',
    page = 1,
    pageSize = 20,
  } = props;
  const { t } = useTranslation();
  const [isLoading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [options, setOptions] = useState<DefaultOptionType[]>([]);
  const [isFetch, setFetch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const hasMore = useRef(true);

  // 清除自定义属性
  const params: Partial<ApiPageSelectProps> = { ...props };
  delete params.api;
  delete params.params;
  delete params.apiResultKey;
  delete params.pageKey;
  delete params.pageSizeKey;

  useEffect(() => {
    if (isFetch) {
      setFetch(false);
      getApiData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetch]);

  /** 获取接口数据 */
  const getApiData = useCallback(async () => {
    if (!props.api || !hasMore.current) return;
    try {
      const { api, params, apiResultKey } = props;

      const apiPageFun = {
        [pageKey]: currentPage,
        [pageSizeKey]: pageSize,
        [queryKey]: searchValue || undefined,
      };

      if (Array.isArray(params)) {
        for (let i = 0; i < params?.length; i++) {
          const item = params[i];

          if (item.constructor === Object) {
            params[i] = { ...item, ...apiPageFun };
          }
        }
      }

      setLoading(true);
      if (api) {
        const apiFun = Array.isArray(params) ? api(...params) : api({ ...params, ...apiPageFun });
        const { code, data } = await apiFun;
        if (Number(code) !== 200) return;
        const result = (
          apiResultKey ? (data as { [apiResultKey: string]: unknown })?.[apiResultKey] : data
        ) as DefaultOptionType[];
        if (result?.length) {
          const newOption = options.concat(result);
          setOptions(newOption);
        }
        hasMore.current = !!result?.length;

        // 如果不存在更多数据，尾部显示没有更多数据且居中
        if (!hasMore.current) {
          setOptions((prev) => {
            if (prev.length) {
              return prev.concat([
                {
                  [props?.fieldNames?.label || 'label']: t('public.noMoreData'),
                  [props?.fieldNames?.value || 'value']: t('public.noMoreData'),
                  disabled: true,
                  className: 'text-center',
                },
              ]);
            }
            return prev;
          });
        }
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchValue]);

  useEffect(() => {
    // 当有值且列表为空时，自动获取接口
    if (props.value && options.length === 0) {
      getApiData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  /**
   * 展开下拉回调
   * @param open - 是否展开
   */
  const onOpenChange = (open: boolean) => {
    if (open && !options?.length) getApiData();

    props.onOpenChange?.(open);
  };

  /** 滚动事件处理 */
  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const threshold = 10; // 距离底部阈值

      // 触底判断
      if (scrollTop + clientHeight >= scrollHeight - threshold && !isLoading && hasMore) {
        setCurrentPage(currentPage + 1);
        setFetch(true);
      }
    },
    [isLoading, hasMore, currentPage],
  );

  /** 自定义下拉框内容 */
  const popupRender = (menu: React.ReactNode) => (
    <>
      {menu}
      <div className="py-3px text-center">
        {isLoading && hasMore && !!options?.length && <Spin size="small" spinning />}
      </div>
    </>
  );

  /** 初始化 */
  const handleInit = () => {
    setOptions([]);
    setCurrentPage(page);
    hasMore.current = true;
  };

  /** 处理搜索 */
  const handleSearch: SelectProps['onSearch'] = debounce((value) => {
    props?.onSearch?.(value);

    handleInit();
    setSearchValue(value);
    setFetch(true);
  }, 200);

  return (
    <Select
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      placeholder={t('public.inputPleaseSelect')}
      optionFilterProp={params?.fieldNames?.label || 'label'}
      {...params}
      onSearch={handleSearch}
      onPopupScroll={handleScroll}
      popupRender={popupRender}
      loading={isLoading}
      options={options}
      notFoundContent={isLoading && <Loading />}
      onOpenChange={onOpenChange}
    />
  );
}

export default ApiPageSelect;
