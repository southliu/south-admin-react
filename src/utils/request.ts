import { TOKEN } from '@/utils/config';
import { creteRequest } from '@south/request';

// 生成环境所用的接口
const prefixUrl = import.meta.env.VITE_BASE_URL as string;
const baseURL = process.env.NODE_ENV !== 'development' ? prefixUrl : '/api';

// 请求配置
export const request = creteRequest(baseURL, TOKEN, {
  // 权限过期处理：当前为 HashRouter，先设 hash 路由再 reload 强制刷新以清理内存鉴权状态
  // 若后续切换为 BrowserRouter，改为 window.location.href = '/login' 即可
  onAuthExpired: () => {
    window.location.hash = '/login';
    window.location.reload();
  },
});

// 创建多个请求
// export const newRequest = creteRequest('/test', TOKEN);

/**
 * 取消请求
 * @param url - 链接
 */
export const cancelRequest = (url: string | string[]) => {
  return request.cancelRequest(url);
};

/** 取消全部请求 */
export const cancelAllRequest = () => {
  return request.cancelAllRequest();
};
