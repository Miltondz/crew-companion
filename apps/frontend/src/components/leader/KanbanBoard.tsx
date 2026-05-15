'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type Modifier,
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

function getEventCoords(event: Event): { x: number; y: number } | null {
  if ('touches' in event) {
    const t = (event as TouchEvent).touches[0] ?? (event as TouchEvent).changedTouches[0]
    return t ? { x: t.clientX, y: t.clientY } : null
  }
  if ('clientX' in event) return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY }
  return null
}

const snapCenterToCursor: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
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
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
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

function DroppableColumn({
  status,
  label,
  accent,
  bg,
  countColor,
  columnTasks,
  isOver,
  activeId,
  hasRealTasks,
  highlightedTaskIds,
  onStatusChange,
}: {
  status: TaskStatus
  label: string
  accent: string
  bg: string
  countColor: string
  columnTasks: (Task & { assignedTo: string })[]
  isOver: boolean
  activeId: string | null
  hasRealTasks: boolean
  highlightedTaskIds: string[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
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
      <SortableContext
        id={status}
        items={columnTasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 px-2 pb-3 min-h-[4rem]">
          <AnimatePresence mode="popLayout">
            {hasRealTasks ? columnTasks.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
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
      </SortableContext>
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
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map(({ status, label, accent, bg, countColor }) => {
          const columnTasks = resolvedTasks.filter(t => t.status === status)
          const isOver = overId === status || (overId ? getColumnForItem(overId) === status : false)

          return (
            <DroppableColumn
              key={status}
              status={status}
              label={label}
              accent={accent}
              bg={bg}
              countColor={countColor}
              columnTasks={columnTasks}
              isOver={isOver}
              activeId={activeId}
              hasRealTasks={hasRealTasks}
              highlightedTaskIds={highlightedTaskIds}
              onStatusChange={onStatusChange}
            />
          )
        })}
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeTask ? (
          <div className="rotate-1 shadow-2xl opacity-90 pointer-events-none w-64">
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
