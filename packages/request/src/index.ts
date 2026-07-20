import type { CreateRequestOptions, RequestCancel } from './types';
import { message } from '@south/message';
import { getLocalInfo, removeLocalInfo } from '@south/utils';
import axios from 'axios';
import AxiosRequest from './request';

/**
 * 权限过期提示在 localStorage 中的存储 key
 * 请求拦截器在整页跳转前写入，登录页挂载后读取并清除
 */
const LOGIN_EXPIRED_MSG = 'login:expiredMsg';

/**
 * 创建请求
 * @param url - 链接地址
 * @param tokenKey - 存token的key值
 * @param options - 扩展选项（onAuthExpired 权限过期回调，由应用层注入）
 */
function creteRequest(url: string, tokenKey: string, options?: CreateRequestOptions) {
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
        message.error('请求超时！');
        return err;
      },
      // 接口响应拦截
      responseInterceptors(res) {
        const { data } = res;
        // 权限不足
        if (data?.code === 401) {
          const lang = localStorage.getItem('lang');
          const enMsg = 'Insufficient permissions, please log in again!';
          const zhMsg = '权限不足，请重新登录！';
          const msg = lang === 'en' ? enMsg : zhMsg;
          removeLocalInfo(tokenKey);
          console.error('错误信息:', data?.message || msg);

          // 存储过期值
          localStorage.setItem(LOGIN_EXPIRED_MSG, msg);

          // 跳转登录页
          if (options?.onAuthExpired) {
            options.onAuthExpired();
          } else {
            window.location.href = '/login';
          }
          return res;
        }

        // blob 响应（文件下载）跳过业务 code 校验，交由调用方处理（如 ExportModal 解析错误 blob）
        if (data instanceof Blob || res.config?.responseType === 'blob') {
          return res;
        }

        // 错误处理（FastAPI HTTPException 返回 {detail} 无 message/code，故兜底 detail）
        if (data?.code !== 200) {
          handleError(data?.message || data?.detail);
          return res;
        }

        return res;
      },
      responseInterceptorsCatch(err) {
        // 取消重复请求则不报错
        if (axios.isCancel(err)) {
          err.data = err.data || {};
          return err;
        }

        handleError((err as RequestCancel)?.response?.data?.message || '服务器错误！');
        return err;
      },
    },
  });
}

/**
 * 异常处理
 * @param error - 错误信息
 * @param content - 自定义内容
 */
const handleError = (error: string, content?: string) => {
  console.error('错误信息:', error);
  message.error({
    content: content || error || '服务器错误',
    key: 'error',
  });
};

export { creteRequest, LOGIN_EXPIRED_MSG };
export type * from './types';
