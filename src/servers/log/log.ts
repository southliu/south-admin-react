import { request } from '@/utils/request';

enum API {
  URL = '/log',
}

/**
 * 获取分页数据
 * @param data - 请求数据
 */
export function getLogPage(data: Partial<BaseFormData> & PaginationData) {
  return request.get<PageServerResult<BaseFormData[]>>(`${API.URL}/page`, { params: data });
}

/**
 * 新增数据
 * @param data - 请求数据
 */
export function createLog(data: BaseFormData) {
  return request.post(`${API.URL}/create`, data);
}

/**
 * 删除
 * @param id - 删除id值
 */
export function deleteLog(id: string) {
  return request.delete(`${API.URL}/${id}`);
}

/**
 * 批量删除
 * @param data - 请求数据
 */
export function batchDeleteLog(data: BaseFormData) {
  return request.post(`${API.URL}/batchDelete`, data);
}
