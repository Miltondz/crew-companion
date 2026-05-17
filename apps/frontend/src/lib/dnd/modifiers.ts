import type { Modifier } from '@dnd-kit/core'

function getEventCoords(event: Event): { x: number; y: number } | null {
  if ('touches' in event && (event as TouchEvent).touches.length > 0) {
    const t = (event as TouchEvent).touches[0]
    return { x: t.clientX, y: t.clientY }
  }
  if ('clientX' in event) return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY }
  return null
}

export const snapCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const coords = getEventCoords(activatorEvent)
    if (!coords) return transform
    return {
      ...transform,
      x: transform.x + coords.x - (draggingNodeRect.left + draggingNodeRect.width / 2),
      y: transform.y + coords.y - (draggingNodeRect.top + draggingNodeRect.height / 2),
    }
  }
  return transform
}
