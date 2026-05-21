# Sensors, Collisions, Modifiers, and Feedback

## Sensors
Sensors translate input events into drag operations.

Defaults:
- `PointerSensor`: mouse, touch, pen.
- `KeyboardSensor`: keyboard accessibility.

Configure globally on provider:
```tsx
import {PointerSensor, KeyboardSensor, PointerActivationConstraints} from '@dnd-kit/dom';

<DragDropProvider
  sensors={(defaults) => [
    ...defaults.filter((sensor) => sensor !== PointerSensor),
    PointerSensor.configure({
      activationConstraints: [
        new PointerActivationConstraints.Distance({value: 8}),
      ],
    }),
  ]}
/>
```

Touch-friendly activation:
```ts
PointerSensor.configure({
  activationConstraints(event) {
    if (event.pointerType === 'touch') {
      return [new PointerActivationConstraints.Delay({value: 250, tolerance: 5})];
    }
    return [new PointerActivationConstraints.Distance({value: 5})];
  },
});
```

Drag handles:
- Common: use `handleRef` returned by hook.
- Advanced: configure `activatorElements` when the activator is outside the draggable subtree.

```tsx
const {ref, handleRef} = useSortable({id, index});
return <li ref={ref}><button ref={handleRef}>Drag</button>{id}</li>;
```

Sensor anti-patterns:
- Removing `KeyboardSensor` without a clear reason.
- Making all controls inside a card start dragging.
- No activation delay/distance on touch-heavy layouts.

## Collision detection
Built-in detectors from `@dnd-kit/collision`:
- `defaultCollisionDetection`: pointer intersection, then shape fallback.
- `pointerIntersection`: strict; pointer must be inside target.
- `shapeIntersection`: greatest overlap area.
- `closestCenter`: nearest centers; good for grids/card stacks.
- `closestCorners`: forgiving for vertical sortable lists.
- `pointerDistance`: target center nearest pointer.
- `directionBiased`: only detects in drag direction to reduce jitter.

Configure per droppable/sortable:
```tsx
useDroppable({id, collisionDetector: pointerIntersection});
useSortable({id, index, collisionDetector: closestCorners});
```

Nested/overlapping droppables:
```tsx
import {CollisionPriority} from '@dnd-kit/abstract';

useDroppable({
  id: 'column',
  collisionPriority: CollisionPriority.Low,
});
```
Higher priority wins. Cards inside a column often need to beat the column target.

Custom detector shape:
```ts
import type {CollisionDetector} from '@dnd-kit/abstract';
import {CollisionPriority, CollisionType} from '@dnd-kit/abstract';

const detector: CollisionDetector = ({droppable}) => {
  if (!droppable.shape) return null;
  return {
    id: droppable.id,
    value: 1,
    type: CollisionType.Collision,
    priority: CollisionPriority.Normal,
  };
};
```

## Modifiers
Modifiers transform draggable movement.

Provider-level modifier:
```tsx
<DragDropProvider modifiers={(defaults) => [...defaults, RestrictToWindow]}>
  {children}
</DragDropProvider>
```

Per-item modifier:
```tsx
const {ref} = useDraggable({id, modifiers: [RestrictToWindow]});
```

Container boundary:
```tsx
const containerRef = useRef<HTMLDivElement>(null);

useDraggable({
  id,
  modifiers: [
    RestrictToElement.configure({element: () => containerRef.current}),
  ],
});
```

Axis lock:
```tsx
import {RestrictToVerticalAxis} from '@dnd-kit/abstract/modifiers';
useSortable({id, index, modifiers: [RestrictToVerticalAxis]});
```

Grid snapping:
```tsx
import {SnapModifier} from '@dnd-kit/abstract/modifiers';
useDraggable({id, modifiers: [SnapModifier.configure({size: 20})]});
```

## Feedback plugin
The default `Feedback` plugin controls visual feedback, top-layer promotion, clone behavior, and drop animation.

Extend default feedback globally:
```tsx
<DragDropProvider
  plugins={(defaults) => [
    ...defaults,
    Feedback.configure({dropAnimation: null}),
  ]}
/>
```

Per-draggable feedback:
```tsx
useDraggable({
  id,
  plugins: [Feedback.configure({feedback: 'clone'})],
});
```

Modes:
- `default`: promoted element moves with pointer.
- `clone`: clone remains in original position while original moves.
- `move`: element moves without top-layer promotion/placeholder.
- `none`: no plugin feedback; use with custom `DragOverlay`.

Drop animation:
```ts
Feedback.configure({dropAnimation: null});
Feedback.configure({dropAnimation: {duration: 300, easing: 'ease'}});
```

Feedback debugging:
- Duplicate visual item: use `feedback: 'clone'` intentionally or switch to overlay/none.
- Overlay plus default feedback conflict: set feedback to `none` for custom overlay cases.
- Lost expected behavior: check whether plugins array replaced defaults.
