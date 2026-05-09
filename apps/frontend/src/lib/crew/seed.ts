import type { CrewState } from './types'

const DEMO_DEADLINE = new Date(Date.now() + 45 * 60 * 1000).toISOString()

export const SEED_STATE: Omit<CrewState, 'urgencyPhase' | 'mascotMood' | 'mascotMode' | 'highlightedTaskIds'> = {
  members: [
    { id: 'm1', name: 'Alex', role: 'leader', technicalLevel: 'high-tech' },
    { id: 'm2', name: 'Sam', role: 'member', technicalLevel: 'low-tech' },
    { id: 'm3', name: 'Jordan', role: 'member', technicalLevel: 'high-tech' },
  ],
  currentMemberId: 'm1',
  tasks: [
    { id: 't1', title: 'Diseñar la landing page', description: 'Crear mockup y componentes base', assignedTo: 'm2', status: 'in-progress', priority: 'high', createdAt: new Date().toISOString() },
    { id: 't2', title: 'Implementar API de usuarios', description: 'Endpoints POST /users y GET /users/:id', assignedTo: 'm3', status: 'todo', priority: 'high', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
    { id: 't3', title: 'Preparar script de demo', description: 'Guión de 2 minutos para la presentación', assignedTo: 'm1', status: 'todo', priority: 'medium', createdAt: new Date().toISOString(), milestoneId: 'ms1' },
  ],
  milestones: [
    { id: 'ms1', title: 'Demo final hackathon', deadline: DEMO_DEADLINE, taskIds: ['t1', 't2', 't3'], phase: 'normal' }
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
