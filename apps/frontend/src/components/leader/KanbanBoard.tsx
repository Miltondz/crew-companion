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
  onDelete: (taskId: string) => void
  onEdit: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'assignedTo'>>) => void
}

function SortableTaskCard({
  task,
  isHighlighted,
  onStatusChange,
  onDelete,
  onEdit,
}: {
  task: Task & { assignedTo: string }
  isHighlighted: boolean
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onDelete: (taskId: string) => void
  onEdit: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'assignedTo'>>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDesc, setEditDesc] = useState(task.description)
  const [editPriority, setEditPriority] = useState(task.priority)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
    disabled: editing,
  })

  function saveEdit() {
    if (editTitle.trim()) {
      onEdit(task.id, { title: editTitle.trim(), description: editDesc.trim(), priority: editPriority })
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div ref={setNodeRef} className="rounded-xl border border-blue-300 bg-white p-3 space-y-2 shadow-sm">
        <input
          autoFocus
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
          placeholder="Título"
        />
        <input
          value={editDesc}
          onChange={e => setEditDesc(e.target.value)}
          className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
          placeholder="Descripción"
        />
        <select
          value={editPriority}
          onChange={e => setEditPriority(e.target.value as TaskPriority)}
          className="w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none"
        >
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        <div className="flex gap-2">
          <button onClick={saveEdit} className="flex-1 rounded bg-blue-600 py-1 text-xs font-bold text-white hover:bg-blue-700 transition">Guardar</button>
          <button onClick={() => setEditing(false)} className="flex-1 rounded bg-slate-100 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 50 : 'auto' }}
      {...attributes}
      {...listeners}
      className="touch-none group relative"
    >
      <div className={`absolute top-1.5 right-1.5 z-10 items-center gap-0.5 ${isDragging ? 'hidden' : 'hidden group-hover:flex'}`}>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setEditing(true); setEditTitle(task.title); setEditDesc(task.description); setEditPriority(task.priority) }}
          className="rounded p-1 bg-white/90 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition shadow-sm"
          title="Editar"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="rounded p-1 bg-white/90 text-slate-400 hover:text-red-500 hover:bg-red-50 transition shadow-sm"
          title="Eliminar"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
      <TaskCard task={task} isHighlighted={isHighlighted} onStatusChange={onStatusChange} />
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
  onDelete,
  onEdit,
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
  onDelete: (taskId: string) => void
  onEdit: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'assignedTo'>>) => void
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
          <AnimatePresence>
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
                  onDelete={onDelete}
                  onEdit={onEdit}
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
  onDelete,
  onEdit,
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
              onDelete={onDelete}
              onEdit={onEdit}
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
