# Sortable Patterns

## Single sortable list with manual state

Use when the array is simple and local.

```tsx
const [items, setItems] = useState(['a', 'b', 'c']);

<DragDropProvider
  onDragEnd={(event) => {
    if (event.canceled) return;
    const {source} = event.operation;
    if (!isSortable(source)) return;

    const {initialIndex, index} = source;
    if (initialIndex === index) return;

    setItems((items) => {
      const next = [...items];
      const [moved] = next.splice(initialIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }}
>
  <ul>
    {items.map((id, index) => <SortableItem key={id} id={id} index={index} />)}
  </ul>
</DragDropProvider>
```

Important: with optimistic sorting, `source` and `target` may refer to the same element during drag. Use `source.initialIndex` and `source.index`, not `source.id !== target.id`, to determine the final reorder.

## Single sortable list with move helper

Use when your state is a flat array or compatible record structure.

```tsx
import {move} from '@dnd-kit/helpers';

<DragDropProvider
  onDragEnd={(event) => {
    if (event.canceled) return;
    setItems((items) => move(items, event));
  }}
>
  {/* render items */}
</DragDropProvider>
```

Pros: less code, works well for common arrays/records.  
Cons: less control for custom structures or computed IDs.

## Multiple sortable lists / kanban

State shape:
```ts
type Board = Record<string, string[]>;
const [items, setItems] = useState<Board>({
  todo: ['a', 'b'],
  doing: ['c'],
  done: [],
});
```

Item:
```tsx
function SortableCard({id, index, column}: {id: string; index: number; column: string}) {
  const {ref, isDragging} = useSortable({
    id,
    index,
    group: column,
    type: 'card',
    accept: 'card',
  });

  return <li ref={ref} data-dragging={isDragging}>{id}</li>;
}
```

State update:
```tsx
onDragEnd={(event) => {
  if (event.canceled) return;
  const {source} = event.operation;
  if (!isSortable(source)) return;

  const {initialIndex, index, initialGroup, group} = source;
  if (initialGroup == null || group == null) return;

  setItems((items) => {
    if (initialGroup === group) {
      const list = [...items[group]];
      const [moved] = list.splice(initialIndex, 1);
      list.splice(index, 0, moved);
      return {...items, [group]: list};
    }

    const from = [...items[initialGroup]];
    const to = [...items[group]];
    const [moved] = from.splice(initialIndex, 1);
    to.splice(index, 0, moved);

    return {...items, [initialGroup]: from, [group]: to};
  });
}}
```

## Snapshot and cancellation
If updating state in `onDragOver`, store a snapshot in `onDragStart` so cancellation can restore previous state.

```tsx
const snapshot = useRef(items);

<DragDropProvider
  onDragStart={() => { snapshot.current = structuredClone(items); }}
  onDragEnd={(event) => {
    if (event.canceled) {
      setItems(snapshot.current);
      return;
    }
    // commit final state
  }}
/>
```

## External state and data fetching
Common issue: duplicate or jumping items when server data refetches during active drag.

Rule:
- Render from local DnD state.
- Sync local state from server only when no drag is active.
- Commit new order to server after drag end.
- If canceled, restore server/local snapshot.

```tsx
const isDragging = useRef(false);

useEffect(() => {
  if (fetchedItems && !isDragging.current) setItems(fetchedItems);
}, [fetchedItems]);

<DragDropProvider
  onDragStart={() => { isDragging.current = true; }}
  onDragEnd={(event) => {
    isDragging.current = false;
    if (event.canceled) {
      setItems(fetchedItems ?? []);
      return;
    }
    setItems((items) => move(items, event));
    // persist order here
  }}
/>
```

## Empty columns
For kanban boards, an empty column still needs a droppable area. Render a column container with `useDroppable`, even when no cards exist.

## ID design
Good ids:
- database id: `task_123`
- stable composite id: `column:todo`

Bad ids:
- array index
- random id generated during render
- visible label that may change

## Debug questions
- Are rendered items ordered from state, not directly from DOM mutations?
- Does every item have a stable key equal to or derived from its stable id?
- Does every `useSortable` receive the correct current `index`?
- For multi-list, does every item receive the correct `group`?
- Is canceled drag handled?
- Are server refetches paused/ignored while drag is active?
