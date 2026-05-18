'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, ExternalLink, Link2, Eye, Users, Clock, CheckSquare, Settings, X, Pencil, Trash2, Archive, ArchiveRestore, Folder, FolderOpen, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { WebNav } from '@/components/shared/WebNav'
import { WebFooter } from '@/components/shared/WebFooter'
import { warmAgentFireAndForget } from '@/lib/agent-warmup'
import { getUrgencyPhase } from '@/lib/crew/derive'


const PROJECT_TYPE_EMOJI: Record<string, string> = {
  hackathon: '🏆', sprint: '💻', 'remote-team': '🌍', launch: '🚀', consulting: '🤝', other: '⚙️',
}

const PHASE_CONFIG: Record<string, { label: string; spineColor: string; pillClass: string }> = {
  normal:  { label: 'Normal',   spineColor: '#22c55e', pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  focus:   { label: 'Focus',    spineColor: '#eab308', pillClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  urgent:  { label: 'Urgente',  spineColor: '#f97316', pillClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  panic:   { label: 'Pánico',   spineColor: '#ef4444', pillClass: 'bg-red-500/15 text-red-300 border-red-500/30' },
  expired: { label: 'Vencido',  spineColor: '#64748b', pillClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
}

interface Project {
  workspace_id: string
  state_json: {
    milestones?: { title?: string; deadline?: string; taskIds?: string[] }[]
    activeMilestoneId?: string
    tasks?: { id?: string; status?: string }[]
    members?: unknown[]
    blockers?: { resolved?: boolean }[]
    projectConfig?: { type?: string; name?: string }
    archived?: boolean
  }
  observer_token: string
  invite_code: string
  updated_at: string
  role: string
  member_id: string | null
}

function timeLeft(deadline?: string): string {
  if (!deadline) return 'Sin deadline'
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Vencido'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 1) return `${d}d restantes`
  if (h > 1) return `${h}h restantes`
  return `${Math.floor(diff / 60000)}min restantes`
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`))
}


function ProjectFolderCard({
  project,
  onOpen,
  onArchive,
  onUnarchive,
  onDelete,
  onRename,
}: {
  project: Project
  onOpen: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
  onRename: (newName: string) => void
}) {
  const s = project.state_json
  const milestone = s.milestones?.[0]
  const totalTasks = milestone?.taskIds?.length ?? 0
  const milestoneTaskIds = new Set(milestone?.taskIds ?? [])
  const doneTasks = s.tasks?.filter(t => t.status === 'done' && milestoneTaskIds.has(t.id ?? '')).length ?? 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const memberCount = s.members?.length ?? 0
  const blockerCount = s.blockers?.filter(b => !b.resolved).length ?? 0
  const phase = getUrgencyPhase(milestone?.deadline ?? '')
  const phaseConf = PHASE_CONFIG[phase] ?? PHASE_CONFIG.normal
  const projectType = s.projectConfig?.type ?? 'other'
  const projectName = s.projectConfig?.name || milestone?.title || 'Proyecto sin nombre'
  const isArchived = !!s.archived

  const [showRename, setShowRename] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [renameValue, setRenameValue] = useState(projectName)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/share/${project.observer_token}`
  const inviteUrl = `${baseUrl}/invite/${project.invite_code}`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onMouseEnter={warmAgentFireAndForget}
      className={cn(
        'group relative flex rounded-xl overflow-hidden ring-1 transition-all',
        isArchived
          ? 'bg-[var(--bg-surface)]/40 ring-white/5'
          : 'bg-[var(--bg-surface)] ring-white/10 hover:ring-white/20 shadow-lg'
      )}
    >
      {/* Spine */}
      <div
        className="w-[34px] flex-shrink-0 flex flex-col items-center justify-between py-3 border-r border-white/10"
        style={{ background: `color-mix(in srgb, ${phaseConf.spineColor} 16%, transparent)` }}
      >
        {isArchived ? <Folder size={14} style={{ color: phaseConf.spineColor }} /> : <FolderOpen size={14} style={{ color: phaseConf.spineColor }} />}
        <span
          className="font-mono text-[8px] font-bold tracking-widest uppercase whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            maxHeight: '160px',
            color: phaseConf.spineColor,
          }}
        >
          {projectName.slice(0, 32)}
        </span>
        <div className="h-3 w-1 rounded-full" style={{ background: `${phaseConf.spineColor}66` }} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{PROJECT_TYPE_EMOJI[projectType] ?? '⚙️'}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight truncate">{projectName}</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-mono">{timeLeft(milestone?.deadline)}</p>
            </div>
          </div>
          <span className={cn('text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0', phaseConf.pillClass)}>
            {phaseConf.label}
          </span>
        </div>

        {totalTasks > 0 && (
          <div>
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
              <span>Progreso</span>
              <span>{doneTasks}/{totalTasks}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${progress}%`, background: phaseConf.spineColor }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount}</span>
          {blockerCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Clock className="w-3 h-3" />{blockerCount}
            </span>
          )}
          <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{progress}%</span>
        </div>

        {/* Rename form */}
        <AnimatePresence>
          {showRename && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && renameValue.trim()) { onRename(renameValue.trim()); setShowRename(false) }
                    if (e.key === 'Escape') { setShowRename(false); setRenameValue(projectName) }
                  }}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500/50 focus:bg-white/10"
                />
                <button
                  onClick={() => { if (renameValue.trim()) { onRename(renameValue.trim()); setShowRename(false) } }}
                  className="rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-2 py-1 text-xs text-indigo-300 hover:bg-indigo-500/30 transition"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setShowRename(false); setRenameValue(projectName) }}
                  className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-white/10 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share panel */}
        <AnimatePresence>
          {showShare && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 space-y-1.5">
                <button onClick={() => copyToClipboard(inviteUrl, 'Link invitación')} className="w-full flex items-center justify-between rounded px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition">
                  <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Link de invitación</span>
                  <span className="font-mono opacity-60">copiar</span>
                </button>
                <button onClick={() => copyToClipboard(shareUrl, 'Link vista pública')} className="w-full flex items-center justify-between rounded px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition">
                  <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" /> Vista pública</span>
                  <span className="font-mono opacity-60">copiar</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-auto">
          <button
            onClick={onOpen}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              isArchived
                ? 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 border border-white/10'
                : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30'
            )}
          >
            <ExternalLink className="w-3 h-3" />
            {isArchived ? 'Ver archivado' : 'Abrir'}
          </button>

          <button
            onClick={() => setShowShare(s => !s)}
            className="rounded-lg p-1.5 bg-white/5 border border-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition"
            title="Compartir"
          >
            <Settings className="w-3 h-3" />
          </button>

          {/* Action buttons (visible on hover) */}
          <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setShowRename(true); setRenameValue(projectName) }}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-primary)] transition"
              title="Renombrar"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {isArchived ? (
              <button
                onClick={onUnarchive}
                className="rounded p-1.5 text-[var(--text-muted)] hover:bg-emerald-500/15 hover:text-emerald-400 transition"
                title="Desarchivar"
              >
                <ArchiveRestore className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onArchive}
                className="rounded p-1.5 text-[var(--text-muted)] hover:bg-amber-500/15 hover:text-amber-400 transition"
                title="Archivar"
              >
                <Archive className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400 transition"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'archived'>('active')

  useEffect(() => { warmAgentFireAndForget() }, [])

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        const list = d.projects ?? []
        if (list.length === 0) { router.replace('/onboarding'); return }
        setProjects(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const openProject = async (p: Project) => {
    warmAgentFireAndForget()
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: p.workspace_id }),
    })
    const target = p.member_id && p.role !== 'leader' ? `/member/${p.member_id}` : '/leader'
    // Hard navigation to clear stale CopilotKit agent state from previous project
    window.location.assign(target)
  }

  const archiveProject = async (p: Project, archived: boolean) => {
    const res = await fetch(`/api/projects/${p.workspace_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived }),
    })
    if (res.ok) {
      setProjects(ps => ps.map(x => x.workspace_id === p.workspace_id
        ? { ...x, state_json: { ...x.state_json, archived } }
        : x
      ))
      toast.success(archived ? 'Proyecto archivado' : 'Proyecto desarchivado')
    } else {
      toast.error('Error al actualizar')
    }
  }

  const renameProject = async (p: Project, name: string) => {
    const res = await fetch(`/api/projects/${p.workspace_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      setProjects(ps => ps.map(x => x.workspace_id === p.workspace_id
        ? { ...x, state_json: {
            ...x.state_json,
            projectConfig: { ...(x.state_json.projectConfig ?? {}), name },
            milestones: x.state_json.milestones
              ? [{ ...(x.state_json.milestones[0] ?? {}), title: name }, ...x.state_json.milestones.slice(1)]
              : [{ title: name }],
          } }
        : x
      ))
      toast.success('Proyecto renombrado')
    } else {
      toast.error('Error al renombrar')
    }
  }

  const deleteProject = async (p: Project) => {
    const s = p.state_json
    const projectName = s.projectConfig?.name || s.milestones?.[0]?.title || 'este proyecto'
    if (!confirm(`¿Eliminar "${projectName}"? Esta acción no se puede deshacer.`)) return
    const res = await fetch(`/api/projects/${p.workspace_id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(ps => ps.filter(x => x.workspace_id !== p.workspace_id))
      toast.success('Proyecto eliminado')
    } else {
      toast.error('Error al eliminar')
    }
  }

  const visibleProjects = projects.filter(p => filter === 'archived' ? p.state_json.archived : !p.state_json.archived)
  const activeCount = projects.filter(p => !p.state_json.archived).length
  const archivedCount = projects.filter(p => p.state_json.archived).length

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col">
      <WebNav user={session?.user ? { name: session.user.name, email: session.user.email } : undefined} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex items-start justify-between mb-6 gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mis proyectos</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1 max-w-2xl">
              Cada proyecto tiene un workspace con un agente de IA que se adapta a tu rol y fase de urgencia.
              Liderés ven el tablero completo; miembros ven su vista personalizada.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="flex items-center gap-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 rounded-xl bg-white/5 border border-white/10 p-1 w-fit">
          <button
            onClick={() => setFilter('active')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition',
              filter === 'active'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition',
              filter === 'archived'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            Archivados ({archivedCount})
          </button>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-1">Fases:</span>
          {Object.entries(PHASE_CONFIG).map(([key, conf]) => (
            <span key={key} className={cn('text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border', conf.pillClass)}>
              {conf.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-sm text-[var(--text-muted)] font-mono">Cargando proyectos…</div>
        ) : visibleProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-sm text-[var(--text-primary)] font-semibold mb-1">
              {filter === 'archived' ? 'Sin proyectos archivados' : 'Sin proyectos activos'}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {filter === 'archived' ? 'Cuando archives un proyecto, aparecerá aquí.' : 'Creá uno nuevo o aceptá una invitación.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {visibleProjects.map(p => (
                <ProjectFolderCard
                  key={p.workspace_id}
                  project={p}
                  onOpen={() => openProject(p)}
                  onArchive={() => archiveProject(p, true)}
                  onUnarchive={() => archiveProject(p, false)}
                  onDelete={() => deleteProject(p)}
                  onRename={(name) => renameProject(p, name)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <WebFooter />
    </div>
  )
}
