import type { CheckboxList } from './TableFilter';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { type DragEndEvent, DndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@iconify/react';
import { Checkbox } from 'antd';

interface SortableItemProps {
  item: CheckboxList;
  index: number;
}

interface DragContentProps {
  list: CheckboxList[];
  handleDragEnd: (list: CheckboxList[]) => void;
}

/**
 * 排序组件
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function SortableItem(props: SortableItemProps) {
  const { item } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.value, // 每个可拖拽对象的唯一标识
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        h-28px
        flex
        items-center
        pl-5px
        hover:bg-blue-100
        border-rd-5px
      `}
      style={style}
      {...attributes}
    >
      <div
        className="h-28px pr-5px cursor-move flex items-center justify-center drag-handle"
        {...listeners}
      >
        <Icon icon="icon-park-outline:drag" />
      </div>
      <Checkbox value={item.value} className="flex-1">
        {item.label}
      </Checkbox>
    </div>
  );
}

/**
 * 拖拽组件
 * @param props - 组件配置，用于设置展示内容和交互回调
 */
function DragContent(props: DragContentProps) {
  const { list, handleDragEnd } = props;

  /**
   * 拖拽结束操作
   * @param event - 拖拽结束事件，用于读取原始项和目标项
   */
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // 计算拖拽后的新顺序
    const oldIndex = list.findIndex((item) => item.value === active.id);
    const newIndex = list.findIndex((item) => item.value === over.id);
    const newColumns = arrayMove(list, oldIndex, newIndex);
    handleDragEnd(newColumns);
  };

  return (
    <DndContext onDragEnd={onDragEnd}>
      <SortableContext
        items={list.map((item) => item.value)}
        strategy={verticalListSortingStrategy}
      >
        {list?.map((item, index) => <SortableItem key={item.value} index={index} item={item} />)}
      </SortableContext>
    </DndContext>
  );
}

export default DragContent;
