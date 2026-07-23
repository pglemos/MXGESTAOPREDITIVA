import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { pxToMinutes, snapMinutes } from './layout'

const MOVE_THRESHOLD_PX = 4

export interface DragItem {
  id: string
  startsAt: string
}

export interface DragPreview {
  itemId: string
  deltaMinutes: number
  dayIndex: number
}

interface UseDragToRescheduleOptions {
  dayCount: number
  hourHeight: number
  /** dayIndex is the resolved day column under the pointer; deltaMinutes is snapped vertical movement. */
  onReschedule: (itemId: string, dayIndex: number, deltaMinutes: number) => void
}

/**
 * Mouse-only drag (pointerType !== 'mouse' is ignored) that lets an event
 * card be moved to a different day/time on a week/day time grid. Only
 * computes pixel math — the caller maps dayIndex back to a real Date and
 * builds the new ISO string, since that's grid layout, not drag math.
 */
export function useDragToReschedule({ dayCount, hourHeight, onReschedule }: UseDragToRescheduleOptions) {
  const [preview, setPreview] = useState<DragPreview | null>(null)
  const stateRef = useRef<{
    itemId: string
    startClientX: number
    startClientY: number
    originDayIndex: number
    columnWidth: number
    moved: boolean
  } | null>(null)

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const drag = stateRef.current
    if (!drag) return
    const deltaX = event.clientX - drag.startClientX
    const deltaY = event.clientY - drag.startClientY
    if (Math.abs(deltaX) > MOVE_THRESHOLD_PX || Math.abs(deltaY) > MOVE_THRESHOLD_PX) drag.moved = true
    const dayOffset = drag.columnWidth > 0 ? Math.round(deltaX / drag.columnWidth) : 0
    const dayIndex = Math.min(dayCount - 1, Math.max(0, drag.originDayIndex + dayOffset))
    const deltaMinutes = snapMinutes(pxToMinutes(deltaY, hourHeight))
    setPreview({ itemId: drag.itemId, deltaMinutes, dayIndex })
  }, [dayCount, hourHeight])

  const handlePointerUp = useCallback(() => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    const drag = stateRef.current
    stateRef.current = null
    if (!drag || !drag.moved) {
      setPreview(null)
      return
    }
    setPreview((current) => {
      if (current) onReschedule(current.itemId, current.dayIndex, current.deltaMinutes)
      return null
    })
  }, [handlePointerMove, onReschedule])

  const startDrag = useCallback((
    event: ReactPointerEvent,
    item: DragItem,
    dayIndex: number,
    columnWidth: number,
  ) => {
    if (event.pointerType !== 'mouse') return
    event.stopPropagation()
    stateRef.current = {
      itemId: item.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originDayIndex: dayIndex,
      columnWidth,
      moved: false,
    }
    setPreview({ itemId: item.id, deltaMinutes: 0, dayIndex })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove, handlePointerUp])

  return { preview, startDrag }
}
