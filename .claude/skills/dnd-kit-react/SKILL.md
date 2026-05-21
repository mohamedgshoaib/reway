---
name: dnd-kit-react
summary: Build drag-and-drop interfaces with the latest @dnd-kit/react API, including DragDropProvider, DragOverlay, useDraggable, useDroppable, useSortable, sensors, collisions, modifiers, feedback, and multi-list sortable state.
description: Use this skill when implementing or debugging drag-and-drop UI with @dnd-kit/react, especially sortable lists, kanban boards, nested droppables, drag overlays, custom sensors, collision detection, modifiers, and feedback behavior in React or Next.js apps.
---

# dnd-kit/react Skill

## First principle
Use the latest `@dnd-kit/react` API, not legacy `@dnd-kit/core` / `@dnd-kit/sortable` examples unless the user explicitly asks for legacy code.

Install:
```bash
npm install @dnd-kit/react
npm install @dnd-kit/helpers # recommended for sortable move helper
```

Common imports:
```ts
import {DragDropProvider, DragOverlay, useDraggable, useDroppable} from '@dnd-kit/react';
import {useSortable, isSortable, isSortableOperation} from '@dnd-kit/react/sortable';
import {move} from '@dnd-kit/helpers';
```

For advanced behavior:
```ts
import {PointerSensor, KeyboardSensor, Feedback} from '@dnd-kit/dom';
import {RestrictToWindow, RestrictToElement} from '@dnd-kit/dom/modifiers';
import {closestCenter, closestCorners, pointerIntersection} from '@dnd-kit/collision';
```

## Agent workflow
1. Determine the interaction type: free drag/drop, single sortable list, multi-list/kanban, nested droppables, or custom drag preview.
2. Use `DragDropProvider` around the smallest area that needs shared drag state.
3. Use stable unique ids; never use array indexes as ids.
4. For basic dragging, attach `useDraggable({id}).ref` to the source.
5. For drop zones, attach `useDroppable({id}).ref` to the target.
6. For sortable items, use `useSortable({id, index, group?})` and update state on drag end or via `move`.
7. Add `DragOverlay` only once per provider when custom previews are needed.
8. Tune sensors, collisions, modifiers, and feedback only after the base behavior works.
9. Test pointer, touch, keyboard, canceled drag, no-target drop, reorder, cross-list moves, and persisted order.

## Decision rules
- Basic draggable into target: `useDraggable` + `useDroppable` + `onDragEnd`.
- Reorder one list: `useSortable({id, index})` + local array state.
- Kanban/multiple lists: `useSortable({id, index, group, type, accept})` + grouped state.
- Need fast sortable updates: prefer `move(items, event)` from `@dnd-kit/helpers`.
- Need full control/custom data structures: use `isSortable(source)` and `source.initialIndex`, `source.index`, `source.initialGroup`, `source.group`.
- Need custom preview: use one `DragOverlay` inside `DragDropProvider`.
- Need drag handle: pass `handle`/`handleRef`; do not make the whole card draggable if only a handle should start drag.
- Need prevent accidental mobile drags: configure `PointerSensor` with delay/distance constraints.
- Need constrain movement: use modifiers like `RestrictToWindow`, `RestrictToElement`, axis restrictions, or snap modifiers.
- Need custom target selection: pass `collisionDetector` per `useDroppable` or `useSortable`.

## Provider pattern
`DragDropProvider` creates the drag/drop context and exposes events. Use event handlers for state changes:
```tsx
<DragDropProvider
  onBeforeDragStart={(event) => {
    // event.preventDefault() cancels drag before it starts
  }}
  onDragEnd={(event) => {
    if (event.canceled) return;
    const {source, target} = event.operation;
    // update state from source/target
  }}
>
  {children}
</DragDropProvider>
```

Prefer function props to extend defaults:
```tsx
<DragDropProvider
  plugins={(defaults) => [...defaults, Feedback.configure({dropAnimation: null})]}
  modifiers={(defaults) => [...defaults, RestrictToWindow]}
/>
```
Passing an array replaces defaults and can disable expected plugins.

## Hook patterns
Basic draggable:
```tsx
function Draggable({id}: {id: string}) {
  const {ref, handleRef, isDragging} = useDraggable({id});
  return <button ref={ref} data-dragging={isDragging}>Drag</button>;
}
```

Basic droppable:
```tsx
function Droppable({id, children}: {id: string; children: React.ReactNode}) {
  const {ref, isDropTarget} = useDroppable({id});
  return <div ref={ref} data-over={isDropTarget}>{children}</div>;
}
```

Sortable item:
```tsx
function SortableItem({id, index}: {id: string; index: number}) {
  const {ref, isDragging} = useSortable({id, index});
  return <li ref={ref} data-dragging={isDragging}>{id}</li>;
}
```

## Sortable state rules
With optimistic sorting enabled by default, do not rely on comparing `source.id` and `target.id` to infer the final move. Use sortable metadata:
```ts
onDragEnd={(event) => {
  if (event.canceled) return;
  const {source} = event.operation;
  if (!isSortable(source)) return;
  const {initialIndex, index} = source;
  if (initialIndex === index) return;
  setItems((items) => {
    const next = [...items];
    const [item] = next.splice(initialIndex, 1);
    next.splice(index, 0, item);
    return next;
  });
}}
```
For multiple lists, also use `initialGroup` and `group`.

## DragOverlay rules
- Render `DragOverlay` once per `DragDropProvider`.
- Put it inside the provider.
- Use a function child when overlay content depends on active source.
- Use `dropAnimation={null}` to disable overlay drop animation.

```tsx
<DragOverlay>
  {(source) => source ? <Preview id={String(source.id)} /> : null}
</DragOverlay>
```

## Sensors
Defaults include pointer and keyboard sensors. Configure only when necessary:
```tsx
<DragDropProvider
  sensors={(defaults) => [
    ...defaults.filter((s) => s !== PointerSensor),
    PointerSensor.configure({
      activationConstraints: (event) =>
        event.pointerType === 'touch'
          ? [new PointerActivationConstraints.Delay({value: 250, tolerance: 5})]
          : [new PointerActivationConstraints.Distance({value: 5})],
    }),
  ]}
/>
```
Per-draggable sensors override global sensors.

## Collision detection
Default collision detection is usually enough. Use per-target overrides:
```ts
useSortable({id, index, collisionDetector: closestCorners});
useDroppable({id, collisionDetector: pointerIntersection});
```
Use `collisionPriority` for nested/overlapping droppables.

## Modifiers
Use modifiers to transform movement:
- window bounds: `RestrictToWindow`
- container bounds: `RestrictToElement.configure({element})`
- axis lock: `RestrictToVerticalAxis` / `RestrictToHorizontalAxis`
- grid snap: `SnapModifier.configure({size: 20})`

## Feedback
The default `Feedback` plugin handles visual feedback and drop animations. Configure globally with provider `plugins`, or per draggable/sortable via `plugins`. Use `feedback: 'none'` when rendering a fully custom `DragOverlay`.

## Utilities
- `useDragDropMonitor`: listen to drag events from nested components.
- `useDragOperation`: read live `source`/`target` and re-render based on operation state.
- `useDragDropManager`: advanced direct manager access; prefer higher-level hooks first.

## React / Next.js notes
- For Next.js App Router, put drag components in a client component with `'use client'`.
- Keep DnD state in React state, Zustand, Redux, or another client-side store.
- Avoid DOM-only APIs during server render; access elements through refs/effects.
- Memoize item components for large lists; avoid heavy work in `onDragMove`.

## Anti-patterns
- Importing from legacy packages for new React API without need.
- Using array index as `id`.
- Reordering only the DOM and not updating state.
- Rendering multiple `DragOverlay` components in one provider.
- Replacing default plugins/sensors accidentally with a plain array.
- Updating sortable state from stale server data during an active drag.
- Comparing `source.id` and `target.id` for sortable final position under optimistic sorting.
- Forgetting canceled drag handling.
- Making clickable inputs draggable without handles or activation constraints.

## Load references when needed
- `references/01-core-api.md` for provider, hooks, overlay, utilities.
- `references/02-sortable-patterns.md` for single list, multi-list, and external state.
- `references/03-sensors-collisions-modifiers-feedback.md` for advanced behavior.
- `references/04-agent-checklists.md` for production checks and debugging.
- `examples/SortableList.tsx` and `examples/KanbanBoard.tsx` for implementation templates.
