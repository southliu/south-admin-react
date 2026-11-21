import { getMenuList } from '@/servers/system/menu';
import axios from 'axios';

/** 布局和登录共用的菜单恢复流程，接口文件只声明请求。 */
export async function loadMenuList() {
  try {
    const result = await getMenuList();
    if ([200, 401, 403].includes(Number(result?.code))) return result;
  } catch (error) {
    if (
      axios.isCancel(error) ||
      (axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0))
    ) {
      throw error;
    }
  }
  return getMenuList();
}
