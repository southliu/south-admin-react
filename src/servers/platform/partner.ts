import { request } from '@/utils/request';

enum API {
  URL = '/platform/partner',
}

interface Result {
  id: string;
  name: string;
}

/**
 * 获取公司数据
 * @param data - 请求数据
 */
export function getPartner(data?: unknown) {
  return request.get<Result[]>(API.URL, { params: data });
}

/**
 * 获取公司数据-展示用的接口
 * @param url - 请求地址，用于指定数据接口
 * @param data - 请求数据
 */
export function getPartnerDemo(url: string, data?: unknown) {
  return request.get<Result[]>(url, { params: data });
}
