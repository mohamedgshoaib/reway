'use client';

import {useRef, useState} from 'react';
import {DragDropProvider, useDroppable, DragOverlay} from '@dnd-kit/react';
import {useSortable, isSortable} from '@dnd-kit/react/sortable';

type ColumnId = 'todo' | 'doing' | 'done';
type BoardState = Record<ColumnId, string[]>;

const columnTitles: Record<ColumnId, string> = {
  todo: 'Todo',
  doing: 'Doing',
  done: 'Done',
};

function Card({id, index, column}: {id: string; index: number; column: ColumnId}) {
  const {ref, handleRef, isDragging} = useSortable({
    id,
    index,
    group: column,
    type: 'card',
    accept: 'card',
  });

  return (
    <li ref={ref} data-dragging={isDragging} className="rounded-md border bg-white p-3 shadow-sm data-[dragging=true]:opacity-50">
      <div className="flex items-center gap-2">
        <button ref={handleRef} type="button" aria-label={`Drag ${id}`} className="cursor-grab active:cursor-grabbing">⋮⋮</button>
        <span>{id}</span>
      </div>
    </li>
  );
}

function Column({id, items}: {id: ColumnId; items: string[]}) {
  const {ref, isDropTarget} = useDroppable({id: `column-${id}`, accept: 'card'});

  return (
    <section ref={ref} data-over={isDropTarget} className="min-h-64 rounded-lg border bg-slate-50 p-3 data-[over=true]:ring-2">
      <h2 className="mb-3 font-semibold">{columnTitles[id]}</h2>
      <ul className="space-y-2">
        {items.map((cardId, index) => (
          <Card key={cardId} id={cardId} index={index} column={id} />
        ))}
      </ul>
    </section>
  );
}

export default function KanbanBoard() {
  const [board, setBoard] = useState<BoardState>({
    todo: ['task-1', 'task-2'],
    doing: ['task-3'],
    done: [],
  });

  const snapshot = useRef<BoardState>(structuredClone(board));

  return (
    <DragDropProvider
      onDragStart={() => {
        snapshot.current = structuredClone(board);
      }}
      onDragEnd={(event) => {
        if (event.canceled) {
          setBoard(snapshot.current);
          return;
        }

        const {source} = event.operation;
        if (!isSortable(source)) return;

        const {initialIndex, index, initialGroup, group} = source;
        if (initialGroup == null || group == null) return;

        const fromGroup = initialGroup as ColumnId;
        const toGroup = group as ColumnId;

        setBoard((current) => {
          if (fromGroup === toGroup) {
            const list = [...current[toGroup]];
            const [moved] = list.splice(initialIndex, 1);
            list.splice(index, 0, moved);
            return {...current, [toGroup]: list};
          }

          const from = [...current[fromGroup]];
          const to = [...current[toGroup]];
          const [moved] = from.splice(initialIndex, 1);
          to.splice(index, 0, moved);

          return {...current, [fromGroup]: from, [toGroup]: to};
        });
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(board) as ColumnId[]).map((column) => (
          <Column key={column} id={column} items={board[column]} />
        ))}
      </div>

      <DragOverlay dropAnimation={{duration: 150, easing: 'ease-out'}}>
        {(source) => source ? <div className="rounded-md border bg-white p-3 shadow-lg">{String(source.id)}</div> : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
