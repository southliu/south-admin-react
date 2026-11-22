import type { addComponent } from '../Form/utils/componentMap';
import { lazy } from 'react';

// 自定义组件名
export type BusinessComponents = 'GameSelect' | 'PartnerSelect';

/**
 * 组件注入
 * @param register - 组件注册函数，用于将业务组件加入表单映射
 */
export function CreateBusiness(register: typeof addComponent) {
  register(
    'GameSelect',
    lazy(() => import('./Selects/GameSelect')),
  );
  register(
    'PartnerSelect',
    lazy(() => import('./Selects/PartnerSelect')),
  );
}
