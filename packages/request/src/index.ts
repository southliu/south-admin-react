import type { CreateRequestOptions, RequestCancel } from './types';
import { getLocalInfo, removeLocalInfo } from '@south/utils';
import { message } from '@south/message';
import AxiosRequest from './request';
import axios from 'axios';

/**
 * 权限过期提示在 localStorage 中的存储 key
 * 请求拦截器在整页跳转前写入，登录页挂载后读取并清除
 */
const LOGIN_EXPIRED_MSG = 'login:expiredMsg';

export function resolveErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    for (const key of ['message', 'detail']) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return fallback;
}

/**
 * 创建请求
 * @param url - 链接地址
 * @param tokenKey - 存token的key值
 * @param options - 扩展选项（onAuthExpired 权限过期回调，由应用层注入）
 */
function creteRequest(url: string, tokenKey: string, options?: CreateRequestOptions) {
  const networkErrorMessage = () =>
    options?.getNetworkErrorMessage?.() ||
    (localStorage.getItem('lang')?.startsWith('en')
      ? 'Network error, please try again later'
      : '网络异常，请稍后重试');
  const handleError = (data?: unknown) => {
    const content = resolveErrorMessage(data, networkErrorMessage());
    console.error('错误信息:', content);
    message.error({ content, key: 'error' });
  };
  const expireSession = (config: RequestCancel['config'], serverMessage?: string) => {
    const token = getLocalInfo(tokenKey) || '';
    const requestToken = String(config?.headers?.Authorization || '').replace('Bearer ', '');
    if (!requestToken) {
      handleError({ message: serverMessage });
      return;
    }
    // 已退出或已切换账号的旧请求不能清除当前会话。
    if (!token || requestToken !== token) return;
    const msg = serverMessage || networkErrorMessage();
    removeLocalInfo(tokenKey);
    handleError({ message: msg });
    localStorage.setItem(LOGIN_EXPIRED_MSG, msg);
    if (options?.onAuthExpired) {
      options.onAuthExpired();
    } else {
      const current = `${window.location.pathname}${window.location.search}`;
      const redirect =
        current && current !== '/login' ? `?redirect=${encodeURIComponent(current)}` : '';
      window.location.href = `/login${redirect}`;
    }
  };
  return new AxiosRequest({
    baseURL: url,
    timeout: 180 * 1000,
    interceptors: {
      // 接口请求拦截
      requestInterceptors(res) {
        const tokenLocal = getLocalInfo(tokenKey) || '';
        if (res?.headers && tokenLocal) {
          res.headers.Authorization = `Bearer ${tokenLocal}` as string;
        }
        return res;
      },
      // 请求拦截超时
      requestInterceptorsCatch(err) {
        handleError();
        return Promise.reject(err);
      },
      // 接口响应拦截
      responseInterceptors(res) {
        const { data } = res;
        // 权限过期
        if (Number(data?.code) === 401) {
          expireSession(res.config, resolveErrorMessage(data, networkErrorMessage()));
          return res;
        }

        // blob 响应（文件下载）跳过业务 code 校验，交由调用方处理（如 ExportModal 解析错误 blob）
        if (data instanceof Blob || res.config?.responseType === 'blob') {
          return res;
        }

        // 错误处理（FastAPI HTTPException 返回 {detail} 无 message/code，故兜底 detail）
        if (Number(data?.code) !== 200) {
          handleError(data);
          return res;
        }

        return res;
      },
      responseInterceptorsCatch(err) {
        // 取消重复请求则不报错
        if (axios.isCancel(err)) {
          return Promise.reject(err);
        }

        const responseData = (err as RequestCancel)?.response?.data;
        if (err.response?.status === 401 || Number(responseData?.code) === 401) {
          expireSession(err.config, resolveErrorMessage(responseData, networkErrorMessage()));
          return Promise.reject(err);
        }
        handleError(responseData);
        return Promise.reject(err);
      },
    },
  });
}

export { creteRequest, LOGIN_EXPIRED_MSG };
export type * from './types';
