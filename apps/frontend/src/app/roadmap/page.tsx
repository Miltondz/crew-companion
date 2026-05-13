'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { CheckCircle2, Circle, Clock, Zap, Sparkles, GitBranch, Lock } from 'lucide-react'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
      {children}
    </span>
  )
}

type ItemStatus = 'done' | 'in-progress' | 'planned' | 'blocked'

function RoadmapItem({ title, description, status }: {
  title: string; description: string; status: ItemStatus
}) {
  const config = {
    done: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'Listo', badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    'in-progress': { icon: Zap, color: 'text-indigo-400', badge: 'En progreso', badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    planned: { icon: Circle, color: 'text-zinc-500', badge: 'Planificado', badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
    blocked: { icon: Lock, color: 'text-amber-400', badge: 'Bloqueado', badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  }
  const { icon: Icon, color, badge, badgeClass } = config[status]

  return (
    <div className="flex items-start gap-4 py-4 border-b border-zinc-800/40 last:border-0">
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${status === 'done' ? 'text-zinc-300' : status === 'planned' ? 'text-zinc-500' : 'text-zinc-100'}`}>
            {title}
          </span>
          <Badge className={`text-xs ${badgeClass}`}>{badge}</Badge>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

const PHASES = [
  {
    phase: 'Fase A — Kernel del runtime',
    period: 'Completado',
    color: 'border-emerald-500/30',
    headerColor: 'text-emerald-400',
    items: [
      { title: 'Surface Registry', description: 'Manifiestos declarativos para registrar superficies sin imports en routing. Cada surface declara su zone, capabilities y shape.', status: 'done' as ItemStatus },
      { title: 'Layout Engine + 6 zonas espaciales', description: 'command-surface, primary-workzone, context-rail, agent-rail, activity-stream, ambient-overlay. Pinning por zona en localStorage.', status: 'done' as ItemStatus },
      { title: 'Capability Engine + @guarded_tool', description: 'Decorador para declarar capabilities requeridas por herramienta. PolicyEngine evalúa antes de ejecutar.', status: 'done' as ItemStatus },
      { title: 'Envelope protocol tipado', description: 'Shape estándar { type, payload, metadata, correlation_id }. BFF loguea correlaciones. Frontend acepta envelopes legacy y full.', status: 'done' as ItemStatus },
      { title: 'AsyncPostgresSaver (persistencia)', description: 'Reemplaza MemorySaver cuando DATABASE_URL está seteado. workspace_state hidratado desde Postgres al reconectar.', status: 'done' as ItemStatus },
      { title: 'Audit log y migración idempotente', description: 'Registro de todas las decisiones de policy. Migraciones SQL versionadas con tabla _migrations.', status: 'done' as ItemStatus },
    ],
  },
  {
    phase: 'Fase B — Producto',
    period: 'Completado',
    color: 'border-emerald-500/30',
    headerColor: 'text-emerald-400',
    items: [
      { title: 'WorkspaceShell con 6 zonas activas', description: 'Shell que implementa las 6 zonas del Layout Engine. Pinning persistido por zona.', status: 'done' as ItemStatus },
      { title: '14 superficies generativas', description: 'TaskCard, MilestoneCountdown, WarRoomSurface, TechnicalStepper, BlockerPanel, DependencyGraph, DocumentReader y 7 más.', status: 'done' as ItemStatus },
      { title: '3 agentes especializados (Orquestador, Planner, Coach)', description: 'Cada uno con herramientas propias, prompts calibrados y routing correcto.', status: 'done' as ItemStatus },
      { title: 'Auth NextAuth v5 + magic link', description: 'Sesiones persistidas, guard en rutas de app, dev mode sin secret.', status: 'done' as ItemStatus },
      { title: 'Wizard de onboarding', description: 'Flujo inicial para configurar workspace, miembros y primer milestone.', status: 'done' as ItemStatus },
      { title: 'Banner de demo + modo observer', description: 'Banner de datos simulados en toda la app. Vista read-only para observadores.', status: 'done' as ItemStatus },
    ],
  },
  {
    phase: 'Fase C — Deploy',
    period: 'En progreso',
    color: 'border-indigo-500/30',
    headerColor: 'text-indigo-400',
    items: [
      { title: 'Deploy a Vercel (frontend)', description: 'CI/CD automático desde main. Variables de entorno por environment.', status: 'in-progress' as ItemStatus },
      { title: 'Deploy a Render (BFF + agent)', description: 'Container único con Hono BFF y agente LangGraph. Healthcheck y restart policy.', status: 'in-progress' as ItemStatus },
      { title: 'Neon (Postgres) + Upstash (Redis)', description: 'Infraestructura de producción serverless. Conexión pooling con PgBouncer.', status: 'planned' as ItemStatus },
      { title: 'Token caps en producción', description: 'Rate limiting por workspace con Redis. Degradación elegante al acercarse al límite.', status: 'planned' as ItemStatus },
      { title: 'Error boundaries + página 500 personalizada', description: 'Surfaces con fallback, errores del agente capturados y mostrados como envelopes de error.', status: 'planned' as ItemStatus },
    ],
  },
  {
    phase: 'Roadmap futuro',
    period: 'Planificado',
    color: 'border-zinc-700/50',
    headerColor: 'text-zinc-400',
    items: [
      { title: 'Mascota Rive animada', description: 'Reemplazar el emoji del mascot por una animación Rive. Estados: idle, thinking, excited, alarmed — sincronizados con setMascotMood.', status: 'planned' as ItemStatus },
      { title: 'Integraciones (GitHub, Linear, Slack)', description: 'Webhooks para sincronizar tareas y milestones con fuentes externas. Eventos en ActivityStream.', status: 'planned' as ItemStatus },
      { title: 'Modo retrospectiva', description: 'Post-mortem automático al expirar milestone. Superficies de análisis: velocidad, blockers más frecuentes, tiempo promedio por tarea.', status: 'planned' as ItemStatus },
      { title: 'Multi-workspace con switching', description: 'Un usuario puede tener múltiples workspaces con estado y agentes independientes. Switcher en el header.', status: 'planned' as ItemStatus },
      { title: 'Templates de proyectos', description: 'Workspace pre-configurado para hackathon, startup sprint, lanzamiento de producto. Tareas y milestones incluidos.', status: 'planned' as ItemStatus },
      { title: 'Coach con memoria episódica', description: 'El Coach recuerda bloqueantes frecuentes y preferencias del miembro entre sesiones. Respuestas más calibradas con el tiempo.', status: 'planned' as ItemStatus },
      { title: 'Modo equipo grande (+10 personas)', description: 'Superficie de cluster de dependencias, sub-milestones, delegación entre líderes. Layout adaptado para mayor complejidad.', status: 'planned' as ItemStatus },
    ],
  },
]

export default function RoadmapPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Roadmap</Badge>
          <h1 className="text-5xl font-bold mb-5 leading-tight">
            Qué está hecho,<br />
            <GradientText>qué viene después</GradientText>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Crew Companion se construye en fases. Cada fase tiene su gate de calidad antes de avanzar a la siguiente.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {[
            { phase: 'Kernel', pct: 100, color: 'bg-emerald-500', textColor: 'text-emerald-400', label: '100%' },
            { phase: 'Producto', pct: 100, color: 'bg-emerald-500', textColor: 'text-emerald-400', label: '100%' },
            { phase: 'Deploy', pct: 35, color: 'bg-indigo-500', textColor: 'text-indigo-400', label: '35%' },
            { phase: 'Futuro', pct: 0, color: 'bg-zinc-600', textColor: 'text-zinc-500', label: 'Planificado' },
          ].map((item, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 font-medium">Fase {i + 1}</span>
                <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200 mb-3">{item.phase}</p>
              <div className="h-1.5 rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </motion.div>

        <div className="flex items-center gap-6 mb-12 flex-wrap justify-center text-sm">
          {[
            { icon: CheckCircle2, color: 'text-emerald-400', label: 'Listo' },
            { icon: Zap, color: 'text-indigo-400', label: 'En progreso' },
            { icon: Circle, color: 'text-zinc-500', label: 'Planificado' },
            { icon: Lock, color: 'text-amber-400', label: 'Bloqueado' },
          ].map(({ icon: Icon, color, label }, i) => (
            <div key={i} className="flex items-center gap-1.5 text-zinc-400">
              <Icon className={`w-4 h-4 ${color}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {PHASES.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Card className={`border bg-zinc-900/50 overflow-hidden ${phase.color}`}>
                <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                  <h2 className={`font-semibold ${phase.headerColor}`}>{phase.phase}</h2>
                  <span className="text-xs text-zinc-500">{phase.period}</span>
                </div>
                <div className="px-6 py-2">
                  {phase.items.map((item, j) => (
                    <RoadmapItem key={j} {...item} />
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center"
        >
          <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Open source</h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-6">
            El roadmap es público y el código también. Si tenés un caso de uso que no está cubierto o una feature que cambiaría tu flujo de trabajo, abrí un issue.
          </p>
          <div className="flex items-center gap-3 justify-center">
            <a
              href="/dev"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Ver demo
            </a>
            <a
              href="/auth/signin"
              className="inline-flex items-center gap-2 border border-zinc-700 hover:border-indigo-500 text-zinc-300 hover:text-white font-medium px-5 py-2 rounded-lg transition-colors text-sm"
            >
              Empezar ahora
            </a>
          </div>
        </motion.div>
      </div>
    </MarketingLayout>
  )
}
