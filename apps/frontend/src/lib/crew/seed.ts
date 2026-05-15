import type { CrewState } from './types'

type SeedState = Omit<CrewState, 'urgencyPhase' | 'mascotMood' | 'mascotMode' | 'highlightedTaskIds'>

const DEADLINE_KEY = 'crew_demo_deadline'

function getSeedDeadline(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DEADLINE_KEY)
    if (stored && new Date(stored).getTime() > Date.now()) return stored
    const fresh = new Date(Date.now() + 45 * 60 * 1000).toISOString()
    localStorage.setItem(DEADLINE_KEY, fresh)
    return fresh
  }
  return new Date(Date.now() + 45 * 60 * 1000).toISOString()
}

export function makeSeedState(): SeedState {
  const deadline = getSeedDeadline()
  return {
    members: [
      { id: 'm1', name: 'Alex', role: 'leader', technicalLevel: 'high-tech', specialization: 'manager' },
      { id: 'm2', name: 'Sam', role: 'member', technicalLevel: 'low-tech', specialization: 'designer' },
      { id: 'm3', name: 'Jordan', role: 'member', technicalLevel: 'high-tech', specialization: 'developer' },
    ],
    currentMemberId: 'm1',
    tasks: [
      { id: 't1', title: 'Diseñar la landing page', description: 'Crear mockup y componentes base', assignedTo: 'm2', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString() },
      { id: 't2', title: 'Implementar API de usuarios', description: 'Endpoints POST /users y GET /users/:id', assignedTo: 'm3', status: 'todo', priority: 'high', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
      { id: 't3', title: 'Preparar script de demo', description: 'Guión de 2 minutos para la presentación', assignedTo: 'm1', status: 'todo', priority: 'medium', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
    ],
    milestones: [
      { id: 'ms1', title: 'Demo final hackathon', deadline, taskIds: ['t1', 't2', 't3'] }
    ],
    blockers: [],
    sharedDocuments: [
      {
        id: 'd1',
        title: 'Stack técnico del proyecto',
        content: '# Stack Técnico\n\n## Frontend\n- Next.js 15\n- React 19\n- Tailwind CSS\n\n## Backend\n- Node.js + Hono\n- PostgreSQL\n\n## Instalación\n\n```bash\nnpm install\nnpm run dev\n```',
        sharedBy: 'm1',
        sharedAt: new Date().toISOString()
      }
    ],
    openDocumentIds: ['d1'],
    activeMilestoneId: 'ms1',
  }
}

export const SEED_STATE: SeedState = makeSeedState()
