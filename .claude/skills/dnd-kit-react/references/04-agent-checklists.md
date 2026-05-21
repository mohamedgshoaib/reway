# Agent Checklists and Debugging

## Before writing code
Ask internally:
1. Is this free dragging, drop-target movement, sorting, or kanban?
2. Does the user need persistence or only local reorder?
3. Are ids stable and already available from data?
4. Should drag start from entire item or a handle?
5. Does the UI contain buttons, links, inputs, or scrollable areas that need activation constraints?
6. Does the project use Next.js App Router? If yes, add `'use client'` to the DnD component.

## Minimal implementation checklist
- Provider wraps all interacting draggables and droppables.
- Every draggable/sortable has stable `id`.
- Every sortable has accurate current `index`.
- Multi-list sortable items have correct `group`.
- State update handles `event.canceled`.
- State update uses sortable metadata or `move` helper.
- Droppable areas exist even when empty.
- Overlay rendered once if used.
- Defaults are extended with function props, not replaced accidentally.

## Accessibility checklist
- Keep keyboard sensor unless there is a documented alternative.
- Use semantic list markup for sortable lists when possible.
- Give drag handles accessible labels.
- Do not make form controls accidentally trigger drag.
- Provide visible focus styles for handles/items.
- Announce important state changes in app UI when necessary.

## Performance checklist
- Keep `onDragMove` light.
- Memoize large item components.
- Avoid recreating heavy sensor/plugin/modifier arrays unnecessarily if they cause churn.
- Render from local state; avoid forcing server refetch during active drag.
- Avoid layout-heavy CSS changes during drag.

## Common bugs

### Drag does not start
Check:
- Is component inside `DragDropProvider`?
- Is `ref` attached to a real DOM element?
- Is `disabled` true?
- Is the handle ref attached if using handle-only dragging?
- Are activation constraints too strict?

### Drop target never activates
Check:
- Is `useDroppable` ref attached to a visible element with dimensions?
- Does draggable `type` match droppable `accept`?
- Is collision detector too strict?
- Is another overlapping target winning due to priority?

### Sortable order changes visually but state is wrong
Check:
- Are you reading `source.initialIndex` and `source.index`?
- Are ids stable?
- Are keys stable?
- Is server data overwriting local order mid-drag?

### Kanban item duplicates or disappears
Check:
- Are you removing from `initialGroup` before inserting into `group`?
- Are empty columns droppable?
- Is a stale snapshot restored incorrectly?
- Is state mutated in place instead of copied?

### Overlay appears twice or conflicts visually
Check:
- Only one `DragOverlay` per provider.
- If using custom overlay, configure feedback mode carefully.
- Disable drop animation if animation causes confusing snap-back.

### Next.js hydration or SSR problems
Check:
- Component using hooks has `'use client'`.
- DOM access happens through refs/effects or runtime callbacks, not server render.
- DnD provider is not placed in a Server Component unless it only renders a client child.

## Recommended implementation order
1. Build static UI and state shape.
2. Add provider.
3. Add draggable/sortable refs.
4. Add basic state update on `onDragEnd`.
5. Add empty droppable targets.
6. Add handles and activation constraints.
7. Add overlay or feedback customization.
8. Add collision/modifier tuning.
9. Add persistence and optimistic server sync.
10. Test mouse, touch, keyboard, cancel, no target, and cross-list cases.

## When to use examples
- `examples/SortableList.tsx`: one-dimensional reorder.
- `examples/KanbanBoard.tsx`: multi-list grouped sortable board.
