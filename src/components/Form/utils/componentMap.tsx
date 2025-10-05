import type { TFunction } from 'i18next';
import type { ComponentType, BaseFormList } from '#/form';
import { initCompProps } from './helper';
import { CreateBusiness } from '@/components/Business';
import type { FormInstance, InputProps } from 'antd';
import { Input, Spin } from 'antd';
import { type KeyboardEvent, lazy, Suspense } from 'react';

// 存储已加载的组件
const loadedComponents = new Map<string, React.ComponentType<any>>();

// 使用React.lazy创建懒加载组件
const lazyComponents = new Map<string, React.LazyExoticComponent<any>>();

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
  lazy(() => import('antd').then((module) => ({ default: module.Upload }))),
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

// 创建一个包装组件，确保在Suspense加载期间也能保持表单数据
function LazyComponentWrapper({
  componentType,
  t,
  componentProps,
  fallback,
  form,
  name,
}: {
  componentType: ComponentType;
  t: TFunction;
  componentProps: any;
  fallback: React.ReactNode;
  form: FormInstance;
  name: string | string[];
}) {
  const LazyComponent = lazyComponents.get(componentType as ComponentType);

  if (!LazyComponent) {
    return fallback;
  }

  // 使用getFieldValue获取表单字段的当前值，否则在懒加载中会获取不到值
  const fieldValue = form ? form.getFieldValue(name) : undefined;

  /** 使用setFieldValue设置表单字段的值，改为非受控组件 */
  const handleChange = (newValue: unknown) => {
    // 处理e.target.value情况
    let actualValue = newValue;
    if (newValue && typeof newValue === 'object' && 'target' in newValue) {
      const event = newValue as React.ChangeEvent<HTMLInputElement>;
      actualValue = event.target.value;
    }

    if (form && name) {
      form.setFieldValue(name, actualValue);
    }
    // 如果有onChange回调，也调用它
    if (componentProps?.onChange) {
      componentProps.onChange(actualValue);
    }
  };

  const mergedProps = {
    ...initCompProps(t, componentType as ComponentType),
    ...componentProps,
    value: fieldValue !== undefined ? fieldValue : componentProps?.value,
    onChange: handleChange,
  };

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...mergedProps} />
    </Suspense>
  );
}

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
      {...(componentProps as InputProps)}
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
        t={t}
        componentProps={componentProps}
        fallback={<Spin>{renderInput}</Spin>}
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
export function addComponent(name: ComponentType, component: any): void {
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
