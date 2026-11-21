import type { SelectProps, TreeSelectProps } from 'antd';
import type { ServerResult } from '@south/request';

export type ApiFn = (...params: object[]) => Promise<ServerResult<unknown>>;
export type ApiParams = object | unknown[];

// api参数
interface ApiParam {
  api?: ApiFn;
  params?: ApiParams;
  apiResultKey?: string;
}

// 带分页的api参数
interface ApiPageParam extends Omit<ApiParam, 'params'> {
  pageKey?: string;
  pageSizeKey?: string;
  queryKey?: string;
  page?: number;
  pageSize?: number;
  params?: ApiParams;
}

export type ApiSelectProps = ApiParam & SelectProps;

export type ApiTreeSelectProps = ApiParam & TreeSelectProps;

export type ApiPageSelectProps = ApiPageParam & SelectProps;
