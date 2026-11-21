import type { DefaultOptionType } from 'antd/es/select';
import type { ApiPageSelectProps } from './types';
import { fetchOptions, getOptions } from './utils/apiOptions';
import { useState, useEffect, memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_TAG_COUNT } from './index';
import { Select, Spin } from 'antd';
import Loading from './components/Loading';

function ApiPageSelect({
  api,
  params,
  apiResultKey,
  pageKey = 'page',
  pageSizeKey = 'pageSize',
  queryKey = 'query',
  page = 1,
  pageSize = 20,
  value,
  onSearch,
  onOpenChange,
  onPopupScroll,
  ...props
}: ApiPageSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  const [options, setOptions] = useState<DefaultOptionType[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestId = useRef(0);
  const hasValue =
    value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
  const enabled = open || hasValue;

  const [source, setSource] = useState({ api, params, apiResultKey, page, pageSize });
  if (
    source.api !== api ||
    source.params !== params ||
    source.apiResultKey !== apiResultKey ||
    source.page !== page ||
    source.pageSize !== pageSize
  ) {
    setSource({ api, params, apiResultKey, page, pageSize });
    setCurrentPage(page);
    setOptions([]);
    setHasMore(true);
  }

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(
      async () => {
        if (!api || !enabled) {
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const data = await fetchOptions(api, params, {
            [pageKey]: currentPage,
            [pageSizeKey]: pageSize,
            [queryKey]: query || undefined,
          });
          if (id !== requestId.current) return;
          const result = getOptions(data, apiResultKey);
          setOptions((previous) => (currentPage === page ? result : [...previous, ...result]));
          setHasMore(result.length >= pageSize);
        } catch {
          // 请求层负责错误提示。
        } finally {
          if (id === requestId.current) setLoading(false);
        }
      },
      query ? 200 : 0,
    );
    return () => {
      clearTimeout(timer);
      requestId.current += 1;
    };
  }, [
    api,
    params,
    apiResultKey,
    enabled,
    currentPage,
    page,
    pageSize,
    pageKey,
    pageSizeKey,
    queryKey,
    query,
  ]);

  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      maxTagCount={MAX_TAG_COUNT}
      placeholder={t('public.inputPleaseSelect')}
      {...props}
      value={value}
      loading={isLoading}
      options={options}
      notFoundContent={isLoading && <Loading />}
      onSearch={(text) => {
        requestId.current += 1;
        setOptions([]);
        setCurrentPage(page);
        setHasMore(true);
        setQuery(text);
        onSearch?.(text);
      }}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
      onPopupScroll={(event) => {
        const target = event.currentTarget;
        if (
          target.scrollTop + target.clientHeight >= target.scrollHeight - 10 &&
          !isLoading &&
          hasMore
        ) {
          setLoading(true);
          setCurrentPage((previous) => previous + 1);
        }
        onPopupScroll?.(event);
      }}
      popupRender={(menu) => (
        <>
          {menu}
          {isLoading && <Spin size="small" />}
          {!hasMore && options.length > 0 && (
            <div className="text-center">{t('public.noMoreData')}</div>
          )}
        </>
      )}
    />
  );
}
export default memo(ApiPageSelect);
