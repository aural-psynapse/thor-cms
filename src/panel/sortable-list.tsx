import type { CSSProperties, ReactNode, Ref } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { IconButton } from './icon-button'
import { WORDS } from './words'

/** What one row needs to be dragged: its box, its style, and the handle. */
export type SortableRow = {
  ref: Ref<HTMLDivElement> | undefined
  style: CSSProperties | undefined
  /** The grip to drag by, or a blank of the same size for a fixed row. */
  handle: ReactNode
  isDragging: boolean
}

/** A list the owner reorders by dragging each row by its grip. */
export type SortableListProps<T extends { id: string }> = {
  items: T[]
  /** Rows that stay where they are. They draw with a blank in place of the grip. */
  isFixed?: (item: T) => boolean
  /** One row was dropped where another was. */
  onMove: (fromId: string, toId: string) => void
  renderRow: (item: T, row: SortableRow) => ReactNode
}

function Row<T extends { id: string }>({
  item,
  renderRow,
}: {
  item: T
  renderRow: (item: T, row: SortableRow) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })
  return renderRow(item, {
    ref: setNodeRef,
    style: { transform: CSS.Transform.toString(transform), transition },
    isDragging,
    handle: (
      <IconButton
        label={WORDS.sections.drag}
        className='cursor-grab touch-none active:cursor-grabbing'
        onClick={(event) => event.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical />
      </IconButton>
    ),
  })
}

const BLANK = <span className='size-8 shrink-0' />

/**
 * Rows dragged up and down by a grip, with the keyboard too: focus the grip,
 * press Space, the arrows, then Space again.
 */
export function SortableList<T extends { id: string }>({
  items,
  isFixed,
  onMove,
  renderRow,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const movable = items.filter((item) => !isFixed?.(item))

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onMove(String(active.id), String(over.id))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={movable} strategy={verticalListSortingStrategy}>
        <div className='space-y-2'>
          {items.map((item) =>
            isFixed?.(item) ? (
              <div key={item.id}>
                {renderRow(item, {
                  ref: undefined,
                  style: undefined,
                  handle: BLANK,
                  isDragging: false,
                })}
              </div>
            ) : (
              <Row key={item.id} item={item} renderRow={renderRow} />
            ),
          )}
        </div>
      </SortableContext>
    </DndContext>
  )
}
