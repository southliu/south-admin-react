import type { CSSProperties } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import type { FC } from 'react';
import type { Transform } from '@dnd-kit/utilities';

export interface DraggableTabPaneProps {
  'data-node-key': string;
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

const DraggableTabNode: FC<DraggableTabPaneProps> = (props) => {
  const { 'data-node-key': key, children, onContextMenu } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: key,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform as Transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    display: 'inline-block',
  };

  // 过滤掉右键事件，避免与拖拽冲突
  const { onContextMenu: _onContextMenu, ...restListeners } = listeners as {
    onContextMenu?: never;
    [key: string]: any;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...restListeners}
      onContextMenu={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // 如果提供了 onContextMenu，则调用它，否则阻止默认行为
        if (onContextMenu) {
          onContextMenu(e);
        }
      }}
    >
      {children}
    </div>
  );
};

export default DraggableTabNode;
