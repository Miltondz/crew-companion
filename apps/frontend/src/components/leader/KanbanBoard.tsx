'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'motion/react'
import { TaskCard } from '@/components/shared/TaskCard'
import { EmptyState } from '@/components/shared/EmptyState'
import type { TaskStatus, TaskPriority } from '@/lib/crew/types'

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  milestoneId?: string
}

interface Member {
  id: string
  name: string
}

interface Column {
  status: TaskStatus
  label: string
  accent: string
  bg: string
  countColor: string
}

interface KanbanBoardProps {
  tasks: Task[]
  members: Member[]
  columns: Column[]
  highlightedTaskIds: string[]
  hasRealTasks: boolean
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

function SortableTaskCard({
  task,
  isHighlighted,
  onStatusChange,
}: {
  task: Task & { assignedTo: string }
  isHighlighted: boolean
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 50 : 'auto',
      }}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <TaskCard
        task={task}
        isHighlighted={isHighlighted}
        onStatusChange={onStatusChange}
      />
    </div>
  )
}

export function KanbanBoard({
  tasks,
  members,
  columns,
  highlightedTaskIds,
  hasRealTasks,
  onStatusChange,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const resolvedTasks = tasks.map(t => ({
    ...t,
    assignedTo: members.find(m => m.id === t.assignedTo)?.name ?? (t.assignedTo || 'Sin asignar'),
  }))

  const activeTask = activeId ? resolvedTasks.find(t => t.id === activeId) : null

  const getColumnForItem = (id: string): TaskStatus | null => {
    const task = tasks.find(t => t.id === id)
    if (task) return task.status
    const col = columns.find(c => c.status === id)
    return col ? col.status : null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId(over?.id as string ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setOverId(null)
    if (!over) return
    const targetColumn = getColumnForItem(over.id as string)
    if (!targetColumn) return
    const task = tasks.find(t => t.id === active.id)
    if (task && task.status !== targetColumn) {
      onStatusChange(task.id, targetColumn)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-3">
        {columns.map(({ status, label, accent, bg, countColor }) => {
          const columnTasks = resolvedTasks.filter(t => t.status === status)
          const isOver = overId === status || (overId ? getColumnForItem(overId) === status : false)

          return (
            <SortableContext
              key={status}
              id={status}
              items={columnTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className={[
                  'rounded-xl border-t-4 transition-all duration-150',
                  accent,
                  isOver && activeId ? 'ring-2 ring-offset-1 scale-[1.01]' : '',
                  isOver && activeId ? accent.replace('border-t-', 'ring-') : '',
                  bg,
                ].filter(Boolean).join(' ')}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${countColor}`}>{columnTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2 px-2 pb-3 min-h-[3rem]">
                  <AnimatePresence mode="popLayout">
                    {hasRealTasks ? columnTasks.map(t => (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SortableTaskCard
                          task={t}
                          isHighlighted={highlightedTaskIds.includes(t.id)}
                          onStatusChange={onStatusChange}
                        />
                      </motion.div>
                    )) : (
                      <div className="py-3 text-center text-xs text-slate-400">Sin tareas</div>
                    )}
                  </AnimatePresence>
                  {hasRealTasks && columnTasks.length === 0 && (
                    <EmptyState
                      icon={status === 'done' ? '✅' : status === 'in-progress' ? '🔄' : '📋'}
                      title="Sin tareas"
                    />
                  )}
                </div>
              </div>
            </SortableContext>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 shadow-xl opacity-95 pointer-events-none">
            <TaskCard
              task={activeTask}
              isHighlighted={false}
              onStatusChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
