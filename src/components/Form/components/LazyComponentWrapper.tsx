import type { ElementType, ReactNode } from 'react';
import { createElement, Suspense } from 'react';

interface Props extends Record<string, unknown> {
  component: ElementType;
  fallback: ReactNode;
}

export default function LazyComponentWrapper({ component, fallback, ...fieldProps }: Props) {
  return <Suspense fallback={fallback}>{createElement(component, fieldProps)}</Suspense>;
}
