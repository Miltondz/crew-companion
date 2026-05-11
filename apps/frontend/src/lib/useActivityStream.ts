import { useCallback, useState } from 'react'
import { makeEvent, type ActivityEvent, type ActivityEventType } from './activity'

export function useActivityStream(maxEvents = 30) {
  const [events, setEvents] = useState<ActivityEvent[]>([])

  const push = useCallback((type: ActivityEventType, message: string, icon: string) => {
    setEvents(prev => [makeEvent(type, message, icon), ...prev].slice(0, maxEvents))
  }, [])

  return { events, push }
}
