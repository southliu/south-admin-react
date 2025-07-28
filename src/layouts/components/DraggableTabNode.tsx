import type { CSSProperties, DetailedHTMLProps, HTMLAttributes, ReactElement } from 'react';
import { cloneElement } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

export interface DraggableTabPaneProps extends HTMLAttributes<HTMLDivElement> {
  'data-node-key': string;
}

const DraggableTabNode: FC<Readonly<DraggableTabPaneProps>> = ({ ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props['data-node-key'],
  });

  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: 'move',
  };

  return cloneElement(
    props.children as ReactElement<
      DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
    >,
    {
      ref: setNodeRef,
      style,
      ...attributes,
      ...listeners,
    },
  );
};

export default DraggableTabNode;
