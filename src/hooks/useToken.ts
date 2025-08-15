import { setLocalInfo, getLocalInfo, removeLocalInfo } from '@south/utils';
import { TOKEN } from '@/utils/config';

/**
 * token存取方法
 */
export function useToken() {
  /** 获取token */
  const getToken = () => {
    return getLocalInfo<string>(TOKEN) || '';
  };

  /**
   * 设置token
   * @param value - token值
   */
  const setToken = (value: string) => {
    setLocalInfo(TOKEN, value);
  };

  /** 删除token */
  const removeToken = () => {
    removeLocalInfo(TOKEN);
  };

  return [getToken, setToken, removeToken] as const;
}
