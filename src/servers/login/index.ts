import type { LoginData, LoginResult } from '@/pages/login/model';
import { request } from '@/utils/request';

/**
 * 登录
 * @param data - 请求数据
 */
export function login(data: LoginData) {
  return request.post<LoginResult>('/system/user/login', data);
}

/**
 * 修改密码
 * @param data - 请求数据
 */
export function updatePassword(data: object) {
  return request.post('/system/user/updatePassword', data);
}

/**
 * 忘记密码
 * @param data - 请求数据
 */
export function forgetPassword(data: object) {
  return request.post('/system/user/forgetPassword', data);
}
