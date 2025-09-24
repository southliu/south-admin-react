import type { LoginResult } from '@/pages/login/model';
import { request } from '@/utils/request';
import { PermissionResult } from './role';

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

/**
 * 获取权限列表
 * @param data - 搜索数据
 */
export function getUserPermission(data: object) {
  return request.get<PermissionResult>(`${API.URL}/authorize`, { params: data });
}

/**
 * 保存用户权限
 * @param data - 权限数据
 */
export function saveUserPermission(data: object) {
  return request.put(`${API.URL}/authorize/save`, data);
}

/**
 * 获取用户刷新权限
 * @param data - 请求数据
 */
export function getUserRefreshPermissions(data: object) {
  return request.get<LoginResult>(`${API.URL}/refreshPermissions`, { params: data });
}
