import { request } from '@/utils/request';

enum API {
  URL = '/system/menu',
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
 * 获取当前菜单数据
 * @param data - 请求数据
 */
export function getMenuList() {
  return request.get<SideMenu[]>(`${API.URL}/list`);
}

/**
 * 更改菜单状态
 * @param data - 请求数据
 */
export function changeMenuState(data: object) {
  return request.put(`${API.URL}/changeState`, data);
}

/** 获取菜单权限列表 */
export function getMenuPermissionList() {
  return request.get(`${API.URL}/permissionList`);
}
