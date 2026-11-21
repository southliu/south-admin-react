import type { ButtonProps } from 'antd';
import type { ReactNode } from 'react';
import { Button } from 'antd';

interface Props extends ButtonProps {
  isLoading?: boolean;
  children?: ReactNode;
}

function BaseBtn(props: Props) {
  const { isLoading, loading, children, className } = props;

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;

  return (
    <Button
      type="primary"
      {...params}
      className={`${className} small-btn`}
      loading={!!isLoading || loading}
    >
      {children}
    </Button>
  );
}

export default BaseBtn;
