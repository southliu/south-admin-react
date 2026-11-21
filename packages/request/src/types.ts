import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
  CreateAxiosDefaults,
  AxiosError,
} from 'axios';

export type RequestCancel = AxiosError<{
  code?: number;
  message?: string;
  detail?: string;
}>;

export interface RequestInterceptors<T> {
  // 请求拦截
  requestInterceptors?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestInterceptorsCatch?: (err: RequestCancel) => void;
  // 响应拦截
  responseInterceptors?: (config: T) => T;
  responseInterceptorsCatch?: (err: RequestCancel) => void;
}

// 自定义传入的参数
export interface CreateRequestConfig<T = AxiosResponse> extends CreateAxiosDefaults {
  interceptors?: RequestInterceptors<T>;
}

// creteRequest 扩展选项
export interface CreateRequestOptions {
  /** 由应用层提供当前语言的网络异常兜底文案。 */
  getNetworkErrorMessage?: () => string;
  /**
   * 权限过期（响应 code 401）时的处理回调
   * 由应用层注入，与具体路由模式（HashRouter / BrowserRouter）解耦
   */
  onAuthExpired?: () => void;
}

// 接口响应数据
export interface ServerResult<T = unknown> {
  code: number;
  message?: string;
  data: T;
}
