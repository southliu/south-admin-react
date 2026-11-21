import type { BaseFormData } from '#/form';
import type { PaginationData, PageServerResult, SideMenu } from '#/public';
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
 * 批量删除
 * @param ids - 删除id值数组
 */
export function batchDeleteMenu(ids: string[]) {
  return request.post(`${API.URL}/batchDelete`, { ids });
}

/**
 * 获取当前菜单数据
 * @param data - 请求数据
 */
export async function getMenuList() {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const result = await request.get<SideMenu[]>(`${API.URL}/list`);
      const code = Number(result?.code);
      // 登录失效由请求拦截器处理，空菜单则是正常的权限结果。
      if (code !== 200 && code !== 401 && code !== 403) {
        throw new Error('Failed to load menus');
      }
      return result;
    } catch (error) {
      if (attempt >= 1) throw error;
    }
  }
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
