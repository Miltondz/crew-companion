'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, ExternalLink, Link2, Eye, Users, Clock, CheckSquare, Sparkles, LogOut, Settings, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PROJECT_TYPE_EMOJI: Record<string, string> = {
  hackathon: '🏆', sprint: '💻', 'remote-team': '🌍', launch: '🚀', consulting: '🤝', other: '⚙️',
}

const PHASE_CONFIG: Record<string, { label: string; className: string }> = {
  normal:  { label: 'Normal',   className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  focus:   { label: 'Focus',    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  urgent:  { label: 'Urgente',  className: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  panic:   { label: 'Pánico',   className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  expired: { label: 'Vencido',  className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
}

interface Project {
  workspace_id: string
  state_json: {
    milestones?: { title?: string; deadline?: string; taskIds?: string[] }[]
    activeMilestoneId?: string
    tasks?: { status?: string }[]
    members?: unknown[]
    blockers?: { resolved?: boolean }[]
    urgencyPhase?: string
    projectConfig?: { type?: string }
  }
  observer_token: string
  invite_code: string
  updated_at: string
  role: string
  member_id: string | null
}

function timeLeft(deadline?: string): string {
  if (!deadline) return '—'
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Vencido'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 1) return `${d}d restantes`
  if (h > 1) return `${h}h restantes`
  return `${Math.floor(diff / 60000)}min restantes`
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    const el = document.createElement('div')
    el.textContent = `${label} copiado`
    el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  })
}

interface ObserverConfig {
  showTasks: boolean
  showTeamNames: boolean
  showBlockerCount: boolean
  customMessage: string
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const s = project.state_json
  const milestone = s.milestones?.[0]
  const totalTasks = milestone?.taskIds?.length ?? 0
  const doneTasks = s.tasks?.filter(t => t.status === 'done').length ?? 0
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const memberCount = s.members?.length ?? 0
  const blockerCount = s.blockers?.filter(b => !b.resolved).length ?? 0
  const phase = s.urgencyPhase ?? 'normal'
  const phaseConf = PHASE_CONFIG[phase] ?? PHASE_CONFIG.normal
  const projectType = s.projectConfig?.type ?? 'other'
  const projectName = milestone?.title ?? 'Proyecto sin nombre'

  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<ObserverConfig>({
    showTasks: true, showTeamNames: true, showBlockerCount: true, customMessage: '',
    ...((s as Record<string, unknown>).observerConfig as Partial<ObserverConfig> ?? {}),
  })
  const [saving, setSaving] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/share/${project.observer_token}`
  const inviteUrl = `${baseUrl}/invite/${project.invite_code}`

  const saveConfig = async () => {
    setSaving(true)
    await fetch('/api/workspace/observer-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setShowConfig(false)
  }

  const Toggle = ({ label, field }: { label: string; field: keyof Omit<ObserverConfig, 'customMessage'> }) => (
    <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
      <span>{label}</span>
      <div
        onClick={() => setConfig(c => ({ ...c, [field]: !c[field] }))}
        className={cn('w-8 h-4 rounded-full transition-colors cursor-pointer relative', config[field] ? 'bg-indigo-500' : 'bg-zinc-700')}
      >
        <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all', config[field] ? 'left-4.5' : 'left-0.5')} />
      </div>
    </label>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-zinc-900/60 border-zinc-800 p-5 hover:border-zinc-700 transition-all duration-200 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{PROJECT_TYPE_EMOJI[projectType] ?? '⚙️'}</span>
            <div>
              <h3 className="font-semibold text-white text-sm leading-tight">{projectName}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{timeLeft(milestone?.deadline)}</p>
            </div>
          </div>
          <Badge className={cn('text-[10px] border shrink-0', phaseConf.className)}>{phaseConf.label}</Badge>
        </div>

        {totalTasks > 0 && (
          <div>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Progreso</span><span>{doneTasks}/{totalTasks} tareas</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{memberCount} miembro{memberCount !== 1 ? 's' : ''}</span>
          {blockerCount > 0 && <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" />{blockerCount} bloqueador{blockerCount !== 1 ? 'es' : ''}</span>}
          <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{progress}%</span>
        </div>

        {/* Observer config panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="bg-zinc-800/60 rounded-xl p-4 flex flex-col gap-3 border border-zinc-700/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">Vista espectador — configurar</p>
                  <button onClick={() => setShowConfig(false)}><X className="w-3.5 h-3.5 text-zinc-500" /></button>
                </div>
                <Toggle label="Mostrar tareas" field="showTasks" />
                <Toggle label="Mostrar nombres del equipo" field="showTeamNames" />
                <Toggle label="Mostrar conteo de bloqueadores" field="showBlockerCount" />
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Mensaje personalizado (opcional)</label>
                  <input
                    type="text" value={config.customMessage} maxLength={120}
                    onChange={e => setConfig(c => ({ ...c, customMessage: e.target.value }))}
                    placeholder="Ej: ¡Estamos en vivo! Miranos construir."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button onClick={saveConfig} disabled={saving}
                  className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                  {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
                <button onClick={() => copyToClipboard(shareUrl, 'Link público')}
                  className="w-full py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-xs transition-colors">
                  Copiar link público de la vista
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pt-1">
          <button onClick={onOpen}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir workspace
          </button>
          <button onClick={() => copyToClipboard(inviteUrl, 'Link de invitación')} title="Invitar miembro"
            className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors">
            <Link2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowConfig(s => !s)} title="Configurar vista pública"
            className={cn('p-2 rounded-lg border transition-colors', showConfig ? 'border-indigo-500 text-indigo-400' : 'border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white')}>
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => copyToClipboard(shareUrl, 'Link de vista espectador')} title="Copiar link público"
            className="p-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: p.workspace_id }),
    })
    if (p.member_id && p.role !== 'leader') {
      router.push(`/member/${p.member_id}`)
    } else {
      router.push('/leader')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* nav */}
      <nav className="border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Crew Companion</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/api/auth/signout"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Salir
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mis proyectos</h1>
            <p className="text-zinc-400 text-sm mt-1">Seleccioná un proyecto para continuar o crea uno nuevo.</p>
          </div>
          <Link href="/onboarding"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-52 rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-zinc-500 mb-4">No tenés proyectos todavía.</p>
            <Link href="/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Crear primer proyecto
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard key={p.workspace_id} project={p} onOpen={() => openProject(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
