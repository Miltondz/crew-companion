'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import {
  LayoutDashboard, BrainCircuit, Layers, Zap, Users, AlertTriangle,
  GitBranch, Shield, Clock, MessageSquare, CheckCircle2, ArrowRight,
  Terminal, Sparkles, Lock
} from 'lucide-react'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
      {children}
    </span>
  )
}

function UrgencyPhaseStrip() {
  const phases = [
    { label: 'Normal', sub: '72h+', color: 'bg-emerald-500', glow: 'shadow-emerald-500/40', text: 'text-emerald-300', border: 'border-emerald-500/30', desc: 'UI estándar' },
    { label: 'Focus', sub: '24–72h', color: 'bg-blue-500', glow: 'shadow-blue-500/40', text: 'text-blue-300', border: 'border-blue-500/30', desc: 'Prioridades destacadas' },
    { label: 'Urgent', sub: '8–24h', color: 'bg-amber-500', glow: 'shadow-amber-500/40', text: 'text-amber-300', border: 'border-amber-500/30', desc: 'Agente más directo' },
    { label: 'Panic', sub: '<8h', color: 'bg-orange-500', glow: 'shadow-orange-500/40', text: 'text-orange-300', border: 'border-orange-500/30', desc: 'War room completo' },
    { label: 'Expirado', sub: '0h', color: 'bg-red-600', glow: 'shadow-red-500/40', text: 'text-red-300', border: 'border-red-500/30', desc: 'Post-mortem' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-16"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 text-center mb-6">Fases de urgencia — derivadas automáticamente del deadline</p>
      <div className="flex gap-2 items-stretch">
        {phases.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0.6 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className={`flex-1 rounded-xl border ${p.border} bg-zinc-900/60 p-4 flex flex-col gap-2`}
          >
            <div className={`w-3 h-3 rounded-full ${p.color} shadow-lg ${p.glow} self-start`} />
            <span className={`text-sm font-semibold ${p.text}`}>{p.label}</span>
            <span className="text-xs font-mono text-zinc-500">{p.sub}</span>
            <span className="text-xs text-zinc-600 mt-auto leading-tight">{p.desc}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 via-amber-500 via-orange-500 to-red-600 opacity-60" />
    </motion.div>
  )
}

function SplitViewPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-16 grid md:grid-cols-2 gap-4"
    >
      <div className="rounded-2xl border border-indigo-500/20 bg-zinc-900/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 font-mono">Vista líder — Sprint activo</span>
        </div>
        <div className="p-4 space-y-2">
          {[
            { label: 'Auth service', status: '✅ Completado', color: 'text-emerald-400' },
            { label: 'Deploy pipeline', status: '⚠️ Bloqueado — Ana', color: 'text-amber-400' },
            { label: 'Load tests', status: '🕐 Sin asignar', color: 'text-zinc-400' },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-3 py-2 text-xs">
              <span className="text-zinc-300">{row.label}</span>
              <span className={row.color}>{row.status}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-500">Milestone al</span>
              <span className="text-indigo-300 font-semibold">68%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800">
              <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-violet-500/20 bg-zinc-900/70 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-xs font-semibold text-violet-300 font-mono">Vista miembro — perfil no técnico</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 mb-1">Tu próxima tarea</p>
            <p className="text-sm text-zinc-100 font-medium">Revisar copy de la landing</p>
          </div>
          <div className="bg-zinc-800/60 rounded-xl px-4 py-3 space-y-2">
            <p className="text-xs text-zinc-500">Coach dice:</p>
            <p className="text-xs text-violet-300 italic">"Abrí Notion, buscá la página 'Landing v3' y dejá comentarios en el doc. ¿Ves el botón Compartir?"</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-amber-300">
            Carlos necesita tu aprobación antes de las 18:00
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CapabilityRow({ icon: Icon, title, description, tag, items }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  tag: string
  items: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="grid md:grid-cols-[1fr_2fr] gap-8 py-10 border-b border-zinc-800/50 last:border-0"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-indigo-400" />
          </div>
          <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs">{tag}</Badge>
        </div>
        <h3 className="text-xl font-semibold text-zinc-100">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
      <ul className="space-y-2.5 pt-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <span className="text-zinc-300">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

const SURFACES = [
  { name: 'TaskCard', desc: 'Tarjeta de tarea con acciones contextuales según estado' },
  { name: 'ActiveTaskView', desc: 'Vista de tarea activa con instrucciones del Coach' },
  { name: 'MilestoneCountdown', desc: 'Countdown crítico con porcentaje de viabilidad' },
  { name: 'BlockerPanel', desc: 'Blocker activo con botón de auto-resolución' },
  { name: 'WarRoomSurface', desc: 'Dashboard de emergencia en modo pánico' },
  { name: 'TechnicalStepper', desc: 'Wizard paso a paso generado por IA según nivel técnico' },
  { name: 'MoodJournal', desc: 'Registro de estado emocional del equipo' },
  { name: 'TeamHealthSnapshot', desc: 'Snapshot de salud del equipo con riesgos activos' },
  { name: 'DependencyGraph', desc: 'Grafo de dependencias entre tareas' },
  { name: 'DocumentReader', desc: 'Lector de documentos del proyecto con QA' },
  { name: 'ApprovalGate', desc: 'Confirmación para operaciones de alto riesgo' },
  { name: 'MilestoneBoard', desc: 'Vista completa del milestone con tareas asignadas' },
  { name: 'WorkspaceStats', desc: 'Estadísticas del workspace en tiempo real' },
  { name: 'ObserverFeed', desc: 'Feed de actividad del equipo para observadores' },
]

const CAPABILITIES = [
  {
    icon: LayoutDashboard,
    tag: 'Interface',
    title: 'Una interfaz por persona',
    description: 'El sistema detecta quién sos (líder / miembro / observador) y qué tan técnico sos. La UI que ve el PM no es la misma que la del dev. No hay un panel universal: hay contextos distintos para personas distintas.',
    items: [
      'Vista de líder: panorama operativo, riesgos activos, estado del equipo de un vistazo',
      'Vista de miembro: solo lo que le toca a esa persona en este momento',
      'Vista de observador: feed de actividad sin acciones ni ruido de gestión',
      'Nivel técnico afecta el lenguaje del Coach: jerga técnica vs pasos en lenguaje llano',
      'Roles derivados del workspace — no hay asignación manual por pantalla',
    ],
  },
  {
    icon: AlertTriangle,
    tag: 'Urgencia',
    title: 'Fases de urgencia automáticas',
    description: 'El sistema calcula la fase en tiempo real desde el deadline del milestone activo. Ningún humano tiene que encender el "modo guerra" — ocurre solo cuando la matemática lo justifica.',
    items: [
      'Normal (>72h): UI estándar, tono conversacional',
      'Focus (24-72h): prioridades destacadas, sugerencias de scope',
      'Urgent (8-24h): colores cambiados, agente más directo',
      'Panic (<8h): war room completo, bloqueos priorizados, porcentaje de viabilidad en vivo',
      'Expired: post-mortem automático, reasignación sugerida',
    ],
  },
  {
    icon: Layers,
    tag: 'Runtime',
    title: '14 superficies generativas',
    description: 'No es un dashboard con widgets fijos. El agente emite datos estructurados (envelopes tipados) y el runtime decide qué superficie renderizar según el contexto del momento.',
    items: SURFACES.slice(0, 6).map(s => `${s.name}: ${s.desc}`),
  },
  {
    icon: Users,
    tag: 'Agentes',
    title: 'Tres agentes especializados',
    description: 'Cada agente tiene un rol claro, herramientas propias y un prompt calibrado para su función. No hay un agente genérico que intenta hacer todo.',
    items: [
      'Orquestador: routing inicial, determina si el tema es táctico o de ejecución',
      'Planner: crea, edita, prioriza y reasigna tareas y milestones — con CRUD completo',
      'Coach: guía a miembros bloqueados, genera wizards paso a paso, adapta el nivel técnico',
      'Cada agente conoce las herramientas de frontend disponibles (renderSurface, setMascotMood, highlightTasks)',
      'Política de capabilities por agente — el Coach no puede borrar tareas, el Planner no puede aprobar operaciones destructivas sin ApprovalGate',
    ],
  },
  {
    icon: BrainCircuit,
    tag: 'Coach',
    title: 'Coach adaptativo por nivel',
    description: 'El mismo agente produce respuestas radicalmente distintas según el perfil declarado. No es un cambio de tono superficial: es otra forma de estructurar la guía.',
    items: [
      'Perfil no técnico: instrucciones numeradas, nombres de botones literales, sin abreviaciones',
      'Perfil técnico: snippets directos, nombres de funciones exactos, sin explicar lo obvio',
      'Wizard TechnicalStepper: generado al vuelo por Gemini con pasos calibrados al nivel del miembro',
      'El Coach puede leer documentos del proyecto y responder preguntas sobre ellos',
      'Blocker reportado → Coach asignado al miembro afectado automáticamente',
    ],
  },
  {
    icon: Zap,
    tag: 'Estado',
    title: 'Estado compartido en tiempo real',
    description: 'Todas las acciones — del agente y del equipo — mutan el mismo modelo de estado persistente. Cada vista refleja el último momento conocido sin recargas.',
    items: [
      'Tareas, milestones, blockers y documentos en un estado centralizado versionado',
      'CopilotKit v2 propaga cambios del agente a todos los clientes conectados',
      'Actividad del equipo visible en el feed en tiempo real (observer mode)',
      'Persistencia con AsyncPostgresSaver cuando DATABASE_URL está disponible',
      'Estado hidratado desde workspace_state al reconectar — sin perder contexto',
    ],
  },
  {
    icon: Shield,
    tag: 'Seguridad',
    title: 'Policy Engine y ApprovalGate',
    description: 'Las operaciones destructivas requieren declaración explícita de capabilities y confirmación humana. El agente nunca ejecuta borrados o cambios críticos sin un gate visible.',
    items: [
      '@guarded_tool: cada herramienta declara capabilities requeridas y risk_level',
      'PolicyEngine evalúa cada llamada antes de ejecutarla — audit log completo',
      'ApprovalGate: surface que bloquea la UI hasta que el usuario confirme la acción',
      'Tres niveles de riesgo: LOW (auto-aprobado), MEDIUM (log), HIGH (gate obligatorio)',
      'delete_task, delete_milestone: siempre HIGH — nunca silenciosos',
    ],
  },
  {
    icon: Lock,
    tag: 'Economía',
    title: 'Economía de tokens y rate limiting',
    description: 'El sistema no corre agentes ilimitadamente. Cada workspace tiene caps por dimensión que previenen consumo inesperado sin degradar la experiencia.',
    items: [
      'Chat: 200 turnos/día por workspace, 2000 globales',
      'Generación de imágenes: 16 por workspace lifetime, 100 globales',
      'Cache agresivo: imágenes por sha256(prompt+style), resúmenes de doc por content hash',
      'Al acercarse al límite: degradación elegante (cache hit, sugerencia de espera)',
      'Nunca hard-fail visible al usuario — siempre un path alternativo',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Capacidades</Badge>
          <h1 className="text-5xl font-bold mb-5 leading-tight">
            Lo que hace que<br />
            <GradientText>Crew Companion sea diferente</GradientText>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            No es un dashboard con IA encima. Es un runtime que construye la interfaz según el contexto de cada persona, en tiempo real, sin configuración manual.
          </p>
        </motion.div>

        <UrgencyPhaseStrip />
        <SplitViewPreview />

        <div className="divide-y divide-zinc-800/50">
          {CAPABILITIES.map((cap, i) => (
            <CapabilityRow key={i} {...cap} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              Las <GradientText>14 superficies generativas</GradientText>
            </h2>
            <p className="text-zinc-400">El agente emite el envelope correcto; el runtime elige la superficie.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SURFACES.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="bg-zinc-900/60 border-zinc-800 px-4 py-3 flex items-start gap-3">
                  <Terminal className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-mono text-indigo-300">{s.name}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MarketingLayout>
  )
}
