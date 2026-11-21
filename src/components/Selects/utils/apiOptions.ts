import type { DefaultOptionType } from 'antd/es/select';
import type { ApiFn, ApiParams } from '../types';

export async function fetchOptions(api: ApiFn, params?: ApiParams, pagination?: object) {
  const args = Array.isArray(params)
    ? params.map((item) => (item && typeof item === 'object' ? { ...item, ...pagination } : item))
    : [{ ...params, ...pagination }];
  const response: Awaited<ReturnType<ApiFn>> = await Reflect.apply(api, undefined, args);
  if (Number(response.code) !== 200) throw response;
  return response.data;
}

export function getOptions(data: unknown, key?: string): DefaultOptionType[] {
  const value =
    key && data && typeof data === 'object' ? (data as Record<string, unknown>)[key] : data;
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'items' in value && Array.isArray(value.items))
    return value.items;
  return [];
}
