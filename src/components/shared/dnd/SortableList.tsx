// src/components/shared/dnd/SortableList.tsx
"use client";

import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface SortableListProps<T extends { id: string }> {
  items: T[];
  onSortEnd: (newItems: T[]) => void;
  renderItem: (item: T, renderProps: {
    attributes: any;
    listeners: any;
    setNodeRef: (element: HTMLElement | null) => void;
    isDragging: boolean;
  }) => React.ReactNode;
  itemContainerClassName?: string;
  listContainerClassName?: string;
}

export function SortableList<T extends { id: string }>({
  items,
  onSortEnd,
  renderItem,
  itemContainerClassName,
  listContainerClassName,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onSortEnd(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={listContainerClassName}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} className={itemContainerClassName}>
              {(props) => renderItem(item, props)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
