'use client';

import {useState} from 'react';
import {DragDropProvider} from '@dnd-kit/react';
import {useSortable, isSortable} from '@dnd-kit/react/sortable';

type Item = {id: string; title: string};

function SortableItem({item, index}: {item: Item; index: number}) {
  const {ref, handleRef, isDragging} = useSortable({id: item.id, index});

  return (
    <li
      ref={ref}
      data-dragging={isDragging}
      className="rounded-md border bg-white p-3 shadow-sm data-[dragging=true]:opacity-60"
    >
      <div className="flex items-center gap-3">
        <button
          ref={handleRef}
          type="button"
          aria-label={`Drag ${item.title}`}
          className="cursor-grab rounded px-2 py-1 text-sm active:cursor-grabbing"
        >
          ⋮⋮
        </button>
        <span>{item.title}</span>
      </div>
    </li>
  );
}

export default function SortableList() {
  const [items, setItems] = useState<Item[]>([
    {id: 'task-1', title: 'Research'},
    {id: 'task-2', title: 'Design'},
    {id: 'task-3', title: 'Build'},
  ]);

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;

        const {source} = event.operation;
        if (!isSortable(source)) return;

        const {initialIndex, index} = source;
        if (initialIndex === index) return;

        setItems((current) => {
          const next = [...current];
          const [moved] = next.splice(initialIndex, 1);
          next.splice(index, 0, moved);
          return next;
        });
      }}
    >
      <ul className="space-y-2">
        {items.map((item, index) => (
          <SortableItem key={item.id} item={item} index={index} />
        ))}
      </ul>
    </DragDropProvider>
  );
}
