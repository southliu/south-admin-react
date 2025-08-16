import type { Key } from 'react';
import type { DataNode } from 'antd/es/tree';
import { request } from '@/utils/request';

enum API {
  URL = '/menu',
}

/**
 * 获取分页数据
 * @param data - 请求数据
 */
export function getMenuPage(data: Partial<BaseFormData> & PaginationData) {
  return request.get<PageServerResult<BaseFormData[]>>(`${API.URL}/page`, { params: data });
}

/**
 * 根据ID获取数据
 * @param id - ID
 */
export function getMenuById(id: string) {
  return request.get<BaseFormData>(`${API.URL}/detail?id=${id}`);
}

/**
 * 新增数据
 * @param data - 请求数据
 */
export function createMenu(data: BaseFormData) {
  return request.post(`${API.URL}/create`, data);
}

/**
 * 修改数据
 * @param id - 修改id值
 * @param data - 请求数据
 */
export function updateMenu(id: string, data: BaseFormData) {
  return request.put(`${API.URL}/update/${id}`, data);
}

/**
 * 删除
 * @param id - 删除id值
 */
export function deleteMenu(id: string) {
  return request.delete(`${API.URL}/${id}`);
}

/**
 * 获取权限列表
 * @param data - 搜索数据
 */
interface PermissionResult {
  treeData: DataNode[];
  defaultCheckedKeys: Key[];
}
export function getPermission(data: object) {
  return request.get<PermissionResult>(`${API.URL}/tree`, { params: data });
}

/**
 * 保存权限列表
 * @param data - 权限数据
 */
export function savePermission(data: object) {
  return request.put(`${API.URL}/authorize/save`, data);
}

/**
 * 获取当前菜单数据
 * @param data - 请求数据
 */
export function getMenuList() {
  return request.get<SideMenu[]>(`${API.URL}/list`);
}
