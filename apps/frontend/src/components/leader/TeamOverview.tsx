'use client'

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Role = 'leader' | 'member'
type TechnicalLevel = 'low-tech' | 'high-tech'
type TaskStatus = 'todo' | 'in-progress' | 'done'

interface TeamMember {
  id: string
  name: string
  role: Role
  technicalLevel: TechnicalLevel
  activeBlockerId?: string
}

interface Task {
  id: string
  title: string
  assignedTo: string
  status: TaskStatus
}

interface Blocker {
  id: string
  memberId: string
  description: string
  resolved: boolean
}

interface TeamOverviewProps {
  members: TeamMember[]
  tasks: Task[]
  blockers: Blocker[]
}

export function TeamOverview({ members, tasks, blockers }: TeamOverviewProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'leader' && b.role !== 'leader') return -1
    if (a.role !== 'leader' && b.role === 'leader') return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <Card>
      <CardHeader className="py-3 px-4 border-b">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <span>Equipo ({members.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {sortedMembers.map((member) => {
            const activeTasksCount = tasks.filter(
              t => t.assignedTo === member.id && t.status !== 'done'
            ).length
            
            const activeBlocker = blockers.find(
              b => b.memberId === member.id && !b.resolved
            )

            return (
              <div key={member.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs font-bold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-800">
                          {member.name}
                        </span>
                        {member.role === 'leader' && (
                          <span className="text-[10px] text-slate-400 font-medium">(líder)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {member.technicalLevel}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        {activeTasksCount} {activeTasksCount === 1 ? 'tarea' : 'tareas'}
                      </span>
                      {activeBlocker && (
                        <span className="text-orange-500 animate-pulse">⚠️</span>
                      )}
                    </div>
                  </div>
                </div>

                {activeBlocker && (
                  <div className="ml-12 p-2 bg-orange-50 border border-orange-100 rounded-md">
                    <p className="text-[11px] text-orange-700 truncate italic">
                      "{activeBlocker.description}"
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
