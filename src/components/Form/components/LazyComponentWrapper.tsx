import type { ComponentProps, ComponentType } from '#/form';
import type { FormInstance } from 'antd';
import type { TFunction } from 'i18next';
import { createElement, Suspense, type ElementType, type ReactNode } from 'react';
import { initCompProps } from '../utils/helper';

interface Props {
  componentType: ComponentType;
  component: ElementType;
  t: TFunction;
  componentProps?: ComponentProps;
  fallback: ReactNode;
  form: FormInstance;
  name: string | string[];
}

export default function LazyComponentWrapper({
  componentType,
  component,
  t,
  componentProps,
  fallback,
  form,
  name,
}: Props) {
  const fieldValue = form?.getFieldValue(name);
  const configured = componentProps as
    { value?: unknown; onChange?: (value: unknown) => void } | undefined;
  const onChange = (value: unknown) => {
    const actualValue =
      value && typeof value === 'object' && 'target' in value
        ? (value as React.ChangeEvent<HTMLInputElement>).target.value
        : value;
    form?.setFieldValue(name, actualValue);
    configured?.onChange?.(actualValue);
  };
  // 组件来自模块级注册表，引用在各次表单渲染之间保持稳定。
  return (
    <Suspense fallback={fallback}>
      {createElement(component, {
        ...initCompProps(t, componentType),
        ...componentProps,
        value: fieldValue !== undefined ? fieldValue : configured?.value,
        onChange,
      })}
    </Suspense>
  );
}
