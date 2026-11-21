import type { ComponentType, BaseFormList, ComponentProps } from '#/form';
import type { FormInstance, InputProps } from 'antd';
import type { TFunction } from 'i18next';
import { CreateBusiness } from '@/components/Business';
import { type KeyboardEvent, lazy } from 'react';
import { initCompProps } from './helper';
import { cloneDeep } from 'lodash';
import { Input } from 'antd';
import LoadingComponent from '@/components/Form/components/LoadingComponent';
import LazyComponentWrapper from '../components/LazyComponentWrapper';

// 存储已加载的组件
const loadedComponents = new Map<string, React.ElementType>();

// 使用React.lazy创建懒加载组件
const lazyComponents = new Map<string, ReturnType<typeof lazy>>();

// 注册懒加载组件
lazyComponents.set(
  'TextArea',
  lazy(() => import('antd').then((module) => ({ default: module.Input.TextArea }))),
);
lazyComponents.set(
  'InputNumber',
  lazy(() => import('antd').then((module) => ({ default: module.InputNumber }))),
);
lazyComponents.set(
  'InputPassword',
  lazy(() => import('antd').then((module) => ({ default: module.Input.Password }))),
);
lazyComponents.set(
  'AutoComplete',
  lazy(() => import('antd').then((module) => ({ default: module.AutoComplete }))),
);
lazyComponents.set(
  'Select',
  lazy(() => import('@/components/Selects/BaseSelect')),
);
lazyComponents.set(
  'TreeSelect',
  lazy(() => import('@/components/Selects/BaseTreeSelect')),
);
lazyComponents.set(
  'Checkbox',
  lazy(() => import('antd').then((module) => ({ default: module.Checkbox }))),
);
lazyComponents.set(
  'CheckboxGroup',
  lazy(() => import('antd').then((module) => ({ default: module.Checkbox.Group }))),
);
lazyComponents.set(
  'RadioGroup',
  lazy(() => import('antd').then((module) => ({ default: module.Radio.Group }))),
);
lazyComponents.set(
  'Switch',
  lazy(() => import('antd').then((module) => ({ default: module.Switch }))),
);
lazyComponents.set(
  'Rate',
  lazy(() => import('antd').then((module) => ({ default: module.Rate }))),
);
lazyComponents.set(
  'Slider',
  lazy(() => import('antd').then((module) => ({ default: module.Slider }))),
);
lazyComponents.set(
  'Upload',
  lazy(() => import('@/components/Upload/BaseUpload')),
);
lazyComponents.set(
  'Transfer',
  lazy(() => import('@/components/Transfer/BaseTransfer')),
);
lazyComponents.set(
  'DatePicker',
  lazy(() => import('@/components/Dates').then((module) => ({ default: module.BaseDatePicker }))),
);
lazyComponents.set(
  'RangePicker',
  lazy(() => import('@/components/Dates').then((module) => ({ default: module.BaseRangePicker }))),
);
lazyComponents.set(
  'TimePicker',
  lazy(() => import('@/components/Dates').then((module) => ({ default: module.BaseTimePicker }))),
);
lazyComponents.set(
  'TimeRangePicker',
  lazy(() =>
    import('@/components/Dates').then((module) => ({ default: module.BaseTimeRangePicker })),
  ),
);
lazyComponents.set(
  'ApiSelect',
  lazy(() => import('@/components/Selects/ApiSelect')),
);
lazyComponents.set(
  'ApiTreeSelect',
  lazy(() => import('@/components/Selects/ApiTreeSelect')),
);
lazyComponents.set(
  'ApiPageSelect',
  lazy(() => import('@/components/Selects/ApiPageSelect')),
);
lazyComponents.set(
  'PasswordStrength',
  lazy(() => import('@/components/PasswordStrength')),
);
lazyComponents.set(
  'RichEditor',
  lazy(() => import('@/components/WangEditor')),
);

/**
 * 处理输入框组件多余参数
 * @param componentProps - 组件参数
 */
const handleInputProps = (componentProps?: ComponentProps) => {
  interface CurrentInputProps {
    children: unknown;
    api: unknown;
    apiResultKey: unknown;
    fieldNames: unknown;
  }

  const newComponentProps = cloneDeep(componentProps) as unknown as CurrentInputProps;
  delete newComponentProps?.children;
  delete newComponentProps?.api;
  delete newComponentProps?.apiResultKey;
  delete newComponentProps?.fieldNames;

  return (newComponentProps || {}) as unknown as InputProps;
};

/**
 * 获取组件
 * @param t - i18n 转换函数
 * @param item - 表单项
 */
export function getComponent(t: TFunction, item: BaseFormList, form: FormInstance) {
  const { component, componentProps, name } = item;

  const handlePressEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const onPressEnter = (componentProps as InputProps)?.onPressEnter;

    if (onPressEnter) {
      onPressEnter?.(e);
    } else {
      form.submit();
    }
  };

  // 输入框渲染
  const renderInput = (
    <Input
      {...(initCompProps(t, 'Input') as InputProps)}
      {...handleInputProps(componentProps)}
      onPressEnter={handlePressEnter}
    />
  );

  // 当组件类型为自定义时
  if (component === 'customize') {
    const { render } = item;
    // 获取组件自定义渲染失败直接返回空标签
    if (!render) return renderInput;
    addComponent('customize', render);
  }

  // 对于Input组件，直接返回
  if (component === 'Input') {
    return renderInput;
  }

  // 查找懒加载组件
  const LazyComponent = lazyComponents.get(component);

  // 如果找到对应的懒加载组件，返回包装后的组件
  if (LazyComponent) {
    return (
      <LazyComponentWrapper
        componentType={component}
        component={LazyComponent}
        t={t}
        componentProps={componentProps}
        fallback={<LoadingComponent />}
        form={form}
        name={name}
      />
    );
  }

  // 尝试获取已加载的组件
  const Comp = loadedComponents.get(component);

  // 获取组件失败直接返回空标签
  if (!Comp) return renderInput;

  return (
    <Comp
      {...initCompProps(t, component as ComponentType)}
      {...componentProps}
      onPressEnter={handlePressEnter}
    />
  );
}

/**
 * 添加组件
 * @param name - 组件名
 * @param component - 组件
 */
export function addComponent(name: ComponentType, component: React.ElementType): void {
  loadedComponents.set(name, component);
}

/**
 * 删除组件
 * @param name - 组件名
 */
export function deleteComponent(name: ComponentType): void {
  loadedComponents.delete(name);
  lazyComponents.delete(name);
}

// 业务组件注入
CreateBusiness();
