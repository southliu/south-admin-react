import type { ResizeCallbackData } from 'react-resizable';
import { Resizable } from 'react-resizable';
import React from 'react';

/**
 * 自定义拖拽
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function ResizableTitle(
  props: React.HTMLAttributes<unknown> & {
    onResize: (e: React.SyntheticEvent<Element>, data: ResizeCallbackData) => void;
    width: number;
  },
) {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => {
            e.stopPropagation();
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
}

export default ResizableTitle;
