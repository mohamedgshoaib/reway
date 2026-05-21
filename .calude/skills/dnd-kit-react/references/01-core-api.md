# dnd-kit/react Core API Reference

## Package model
- Use `@dnd-kit/react` for React integration.
- It is a thin React layer over the vanilla dnd kit internals.
- `@dnd-kit/react` is the only required package for base drag/drop.
- Add `@dnd-kit/helpers` when using sortable `move` convenience helpers.
- `@dnd-kit/dom`, `@dnd-kit/abstract`, and other internals may be installed transitively, but advanced imports come from them.

## DragDropProvider
Purpose: creates a drag/drop context for descendants, manages drag state, coordinates draggable and droppable elements, and exposes event callbacks.

Events:
- `onBeforeDragStart(event, manager)`: called before drag starts; call `event.preventDefault()` to cancel.
- `onDragStart(event, manager)`: drag began.
- `onDragMove(event, manager)`: dragged element moved.
- `onDragOver(event, manager)`: source is over droppable target; `preventDefault()` blocks default plugin behavior for this event.
- `onDragEnd(event, manager)`: drag finished, with or without a target.
- `onCollision(event, manager)`: collisions detected; can prevent automatic target selection.

Configuration:
- `plugins`, `sensors`, and `modifiers` accept either an array or a function.
- Function form receives defaults and extends them.
- Array form replaces defaults.
- Prefer function form unless intentionally replacing default behavior.

Multiple contexts:
- Use separate providers when two DnD regions must not interact.
- Keep a single provider around interacting lists/columns.

## useDraggable
Purpose: make an element draggable.

Input:
- `id`: required stable unique string/number inside provider.
- `type`: optional; used with droppable `accept` rules.
- `element`: optional element/ref if not using returned `ref`.
- `handle`: optional element/ref for a drag handle.
- `disabled`: optional boolean.
- `sensors`, `modifiers`, `plugins`: per-draggable overrides.

Returned values commonly used:
- `ref`: attach to source element.
- `handleRef`: attach to drag handle when using handle pattern.
- `isDragging`: style or disable UI while active.

Pattern:
```tsx
function Card({id}: {id: string}) {
  const {ref, handleRef, isDragging} = useDraggable({id});
  return (
    <article ref={ref} data-dragging={isDragging}>
      <button ref={handleRef} aria-label="Drag card">⋮⋮</button>
      Card {id}
    </article>
  );
}
```

## useDroppable
Purpose: create a target that draggable elements can be dropped over.

Input:
- `id`: required stable unique id.
- `accept`: optional type(s) accepted from draggable/source.
- `collisionDetector`: optional target-specific detector.
- `collisionPriority`: optional priority for nested/overlapping droppables.
- `disabled`: optional boolean.

Returned values commonly used:
- `ref`: attach to target element.
- `isDropTarget`: true when current operation targets it.

Pattern:
```tsx
function Column({id, children}: {id: string; children: React.ReactNode}) {
  const {ref, isDropTarget} = useDroppable({id, accept: 'card'});
  return <section ref={ref} data-over={isDropTarget}>{children}</section>;
}
```

## useSortable
Purpose: make an item draggable and droppable so it can reorder within a list or move across grouped lists.

Input:
- All relevant `useDraggable` and `useDroppable` options.
- `id`: required stable unique id.
- `index`: required current index in its rendered list.
- `group`: optional list/column identifier for multi-list sorting.
- `type` and `accept`: use when limiting cross-list transfers.
- `transition`, `collisionDetector`, `modifiers`, `plugins`, `sensors` as needed.

Pattern:
```tsx
function SortableItem({id, index}: {id: string; index: number}) {
  const {ref, isDragging} = useSortable({id, index});
  return <li ref={ref} data-dragging={isDragging}>{id}</li>;
}
```

Type guards:
```ts
if (isSortable(event.operation.source)) {
  event.operation.source.initialIndex;
  event.operation.source.index;
  event.operation.source.initialGroup;
  event.operation.source.group;
}
```

## DragOverlay
Purpose: render custom visual feedback during a drag.

Rules:
- Render once per `DragDropProvider`.
- Place inside the provider.
- Children render only during active drag.
- Use function child to render based on current `source`.
- Disable drop animation with `dropAnimation={null}`.

Pattern:
```tsx
<DragDropProvider>
  <Items />
  <DragOverlay dropAnimation={{duration: 150, easing: 'ease-out'}}>
    {(source) => source ? <div className="drag-preview">{String(source.id)}</div> : null}
  </DragOverlay>
</DragDropProvider>
```

## Utility hooks

### useDragDropMonitor
Use inside provider to subscribe to drag/drop events from a child component instead of putting all logic on the provider.

```tsx
function AnalyticsMonitor() {
  useDragDropMonitor({
    onDragStart(event) { console.log(event.operation.source.id); },
    onDragEnd(event) { console.log(event.canceled); },
  });
  return null;
}
```

### useDragOperation
Use to render live UI based on current `source` and `target`.

```tsx
function DragStatus() {
  const {source, target} = useDragOperation();
  if (!source) return null;
  return <p>Dragging {String(source.id)} over {target ? String(target.id) : 'nothing'}</p>;
}
```

### useDragDropManager
Advanced direct access to manager. Use only for custom monitoring, plugin registry access, or imperative operations. Prefer provider events, `useDragOperation`, or `useDragDropMonitor` first.
