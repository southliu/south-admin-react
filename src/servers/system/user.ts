import { request } from '@/utils/request';

enum API {
  URL = '/system/user',
}

/**
 * 获取分页数据
 * @param data - 请求数据
 */
export function getUserPage(data: Partial<BaseFormData> & PaginationData) {
  return request.get<PageServerResult<BaseFormData[]>>(`${API.URL}/page`, { params: data });
}

/**
 * 根据ID获取数据
 * @param id - ID
 */
export function getUserById(id: string) {
  return request.get<BaseFormData>(`${API.URL}/detail?id=${id}`);
}

/**
 * 新增数据
 * @param data - 请求数据
 */
export function createUser(data: BaseFormData) {
  return request.post(`${API.URL}/create`, data);
}

/**
 * 修改数据
 * @param id - 修改id值
 * @param data - 请求数据
 */
export function updateUser(id: string, data: BaseFormData) {
  return request.put(`${API.URL}/update/${id}`, data);
}

/**
 * 删除
 * @param id - 删除id值
 */
export function deleteUser(id: string) {
  return request.delete(`${API.URL}/${id}`);
}

/**
 * 批量删除
 * @param data - 请求数据
 */
export function batchDeleteUser(data: BaseFormData) {
  return request.post(`${API.URL}/batchDelete`, data);
}
