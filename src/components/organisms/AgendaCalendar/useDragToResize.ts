import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { pxToMinutes, snapMinutes } from './layout'

const MOVE_THRESHOLD_PX = 4

export interface ResizePreview {
  itemId: string
  deltaMinutes: number
}

interface UseDragToResizeOptions {
  hourHeight: number
  onResize: (itemId: string, deltaMinutes: number) => void
}

/**
 * Mouse-only drag on an event card's bottom handle: only the height changes
 * (top stays fixed), so this only ever produces a duration delta in minutes.
 */
export function useDragToResize({ hourHeight, onResize }: UseDragToResizeOptions) {
  const [preview, setPreview] = useState<ResizePreview | null>(null)
  const stateRef = useRef<{ itemId: string; startClientY: number; moved: boolean } | null>(null)

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const drag = stateRef.current
    if (!drag) return
    const deltaY = event.clientY - drag.startClientY
    if (Math.abs(deltaY) > MOVE_THRESHOLD_PX) drag.moved = true
    const deltaMinutes = snapMinutes(pxToMinutes(deltaY, hourHeight))
    setPreview({ itemId: drag.itemId, deltaMinutes })
  }, [hourHeight])

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
      if (current) onResize(current.itemId, current.deltaMinutes)
      return null
    })
  }, [handlePointerMove, onResize])

  const startResize = useCallback((event: ReactPointerEvent, itemId: string) => {
    if (event.pointerType !== 'mouse') return
    event.stopPropagation()
    stateRef.current = { itemId, startClientY: event.clientY, moved: false }
    setPreview({ itemId, deltaMinutes: 0 })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [handlePointerMove, handlePointerUp])

  return { preview, startResize }
}
