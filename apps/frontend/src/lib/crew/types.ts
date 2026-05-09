export type Role = 'leader' | 'member'
export type TechnicalLevel = 'low-tech' | 'high-tech'
export type UrgencyPhase = 'normal' | 'focus' | 'urgent' | 'panic' | 'expired'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type MascotMood = 'calm' | 'focus' | 'worried' | 'panic' | 'celebrate'
export type MascotMode = 'idle' | 'hint' | 'alert' | 'action'

export interface TeamMember {
  id: string
  name: string
  role: Role
  technicalLevel: TechnicalLevel
  activeBlockerId?: string
}

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  milestoneId?: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
}

export interface Milestone {
  id: string
  title: string
  deadline: string
  taskIds: string[]
  phase: UrgencyPhase
}

export interface Blocker {
  id: string
  memberId: string
  description: string
  reportedAt: string
  resolved: boolean
  resolvedAt?: string
}

export interface SharedDocument {
  id: string
  title: string
  content: string
  sharedBy: string
  sharedAt: string
}

export interface CrewState {
  members: TeamMember[]
  currentMemberId: string
  tasks: Task[]
  milestones: Milestone[]
  blockers: Blocker[]
  sharedDocuments: SharedDocument[]
  openDocumentIds: string[]
  urgencyPhase: UrgencyPhase
  mascotMood: MascotMood
  mascotMode: MascotMode
  highlightedTaskIds: string[]
  activeMilestoneId?: string
}
