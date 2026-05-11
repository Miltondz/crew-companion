export type ActivityEventType =
  | 'task_created'
  | 'task_done'
  | 'task_started'
  | 'blocker_reported'
  | 'blocker_resolved'
  | 'milestone_complete'
  | 'phase_change'
  | 'doc_opened'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  message: string
  icon: string
  timestamp: Date
}

export function makeEvent(
  type: ActivityEventType,
  message: string,
  icon: string,
): ActivityEvent {
  return { id: crypto.randomUUID(), type, message, icon, timestamp: new Date() }
}
