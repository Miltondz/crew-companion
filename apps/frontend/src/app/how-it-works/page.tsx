'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import {
  Users, BrainCircuit, Layers, Zap, ArrowRight,
  GitBranch, MessageSquare, AlertTriangle, CheckCircle2, Terminal, Shield
} from 'lucide-react'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
      {children}
    </span>
  )
}

function PipelineFlowDiagram() {
  const nodes = [
    { label: 'Usuario', sub: 'mensaje natural', icon: Users, color: 'border-zinc-600 text-zinc-300' },
    { label: 'Orquestador', sub: 'routing por contexto', icon: GitBranch, color: 'border-violet-500/50 text-violet-300' },
    { label: 'Planner / Coach', sub: 'agente especializado', icon: BrainCircuit, color: 'border-indigo-500/50 text-indigo-300' },
    { label: 'Envelope', sub: 'JSON tipado', icon: Terminal, color: 'border-blue-500/50 text-blue-300' },
    { label: 'Surface', sub: 'UI contextual', icon: Layers, color: 'border-emerald-500/50 text-emerald-300' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-14"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 text-center mb-8">Pipeline de cada interacción</p>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {nodes.map((node, i) => {
          const Icon = node.icon
          return (
            <div key={i} className="flex items-center gap-1 flex-1 min-w-[100px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex-1 rounded-xl border bg-zinc-900/70 p-4 text-center ${node.color}`}
              >
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 opacity-70" />
                </div>
                <p className="text-xs font-semibold">{node.label}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{node.sub}</p>
              </motion.div>
              {i < nodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.15 }}
                  className="text-zinc-600 text-lg shrink-0"
                >
                  →
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Envelope shape', code: '{ type, payload,\n  metadata,\n  correlation_id }', color: 'border-blue-500/20 text-blue-400' },
          { label: 'Surface emit', code: 'type: "render_surface"\npayload: { name, props }', color: 'border-indigo-500/20 text-indigo-400' },
          { label: 'Zone target', code: 'zone: "primary-workzone"\n| "agent-rail" | ...', color: 'border-violet-500/20 text-violet-400' },
        ].map((box, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className={`rounded-lg border bg-zinc-900/50 px-4 py-3`}
          >
            <p className={`text-xs font-semibold mb-2 ${box.color}`}>{box.label}</p>
            <pre className="text-[10px] text-zinc-500 font-mono leading-relaxed whitespace-pre">{box.code}</pre>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function AgentCapabilityMatrix() {
  const matrix = [
    { agent: 'Orquestador', color: 'text-violet-300', bg: 'bg-violet-500/10', caps: ['Routing', 'renderSurface', 'setCrewState', '—', '—', '—'] },
    { agent: 'Planner', color: 'text-indigo-300', bg: 'bg-indigo-500/10', caps: ['—', 'renderSurface', 'setCrewState', 'CRUD tareas', 'CRUD milestones', 'highlightTasks'] },
    { agent: 'Coach', color: 'text-emerald-300', bg: 'bg-emerald-500/10', caps: ['—', 'renderSurface', 'setMascotMood', 'updateStatus', 'reportBlocker', 'logActivity'] },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-10 overflow-x-auto"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-5">Capabilities por agente</p>
      <div className="space-y-2 min-w-[520px]">
        {matrix.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2"
          >
            <div className={`w-28 shrink-0 rounded-lg ${row.bg} px-3 py-2 text-xs font-semibold ${row.color}`}>{row.agent}</div>
            <div className="flex gap-2 flex-wrap">
              {row.caps.filter(c => c !== '—').map((cap, j) => (
                <span key={j} className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md px-2 py-1 font-mono">{cap}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function Step({ number, icon: Icon, title, description, detail, isLast = false }: {
  number: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  detail: string[]
  isLast?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="relative flex gap-8"
    >
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 to-transparent" />
      )}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative z-10">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
      <div className="pb-14">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono text-indigo-500 font-semibold">{number}</span>
          <h3 className="text-xl font-semibold text-zinc-100">{title}</h3>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">{description}</p>
        <ul className="space-y-2">
          {detail.map((d, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

const AGENTS = [
  {
    name: 'Orquestador',
    color: 'border-violet-500/30 bg-violet-500/5',
    badgeColor: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    icon: GitBranch,
    role: 'Router y coordinador',
    desc: 'Recibe el mensaje del usuario, determina la intención y delega al agente correcto. Nunca ejecuta acciones directamente: su trabajo es entender el contexto y enrutar.',
    tools: ['route_to_planner', 'route_to_coach', 'renderSurface', 'setCrewState'],
  },
  {
    name: 'Planner',
    color: 'border-indigo-500/30 bg-indigo-500/5',
    badgeColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
    icon: Terminal,
    role: 'Gestión táctica',
    desc: 'Crea, modifica, prioriza y borra tareas y milestones. Tiene visibilidad completa del estado del equipo y puede reasignar trabajo cuando detecta riesgos.',
    tools: ['create_task', 'update_task', 'delete_task', 'create_milestone', 'update_milestone', 'assign_task', 'renderSurface'],
  },
  {
    name: 'Coach',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    icon: MessageSquare,
    role: 'Guía y desbloqueador',
    desc: 'Ayuda a miembros bloqueados. Adapta el lenguaje al nivel técnico declarado. Puede leer documentos del proyecto, generar wizards paso a paso y reportar blockers.',
    tools: ['update_task_status', 'report_blocker', 'renderSurface', 'setMascotMood', 'logActivity'],
  },
]

const STEPS = [
  {
    number: '01',
    icon: Users,
    title: 'Workspace y roles',
    description: 'El líder configura el workspace: nombre del proyecto, deadline del milestone, lista de miembros y sus niveles técnicos. Eso es todo — el sistema infiere el resto.',
    detail: [
      'Roles disponibles: líder, miembro, observador',
      'Nivel técnico del miembro: "técnico" o "no técnico" — afecta el tono del Coach',
      'El deadline del milestone activo es la única variable de urgencia — todo lo demás se deriva',
      'No hay configuración de alertas, paneles ni rutas de navegación',
    ],
  },
  {
    number: '02',
    icon: BrainCircuit,
    title: 'El agente enruta la intención',
    description: 'Cuando alguien interactúa, el Orquestador analiza quién habla, en qué fase de urgencia está el equipo, y delega al agente más adecuado para esa combinación.',
    detail: [
      '"Necesito ayuda con el deploy" desde un miembro no técnico → Coach con modo paso a paso',
      '"¿Cuánto falta para el milestone?" desde el líder → Planner con MilestoneBoard surface',
      '"El servidor de staging cayó" → bloqueo crítico, Coach activa TechnicalStepper',
      'El agente nunca mezcla contextos: si hay un bloqueo activo, el Coach toma prioridad',
    ],
  },
  {
    number: '03',
    icon: Layers,
    title: 'El runtime elige la superficie',
    description: 'El agente no devuelve texto plano: emite envelopes tipados. El runtime del frontend lee el tipo del envelope y monta la superficie correspondiente en el workspace.',
    detail: [
      'Envelope shape: { type, payload, metadata, correlation_id }',
      'type: "render_surface" → payload contiene el nombre de la superficie y sus props',
      'La superficie aparece en la zona correcta del layout (6 zonas espaciales)',
      'Mismo agente, distinta superficie: TechnicalStepper para bloqueo técnico, BlockerPanel para visibilidad del líder',
    ],
  },
  {
    number: '04',
    icon: AlertTriangle,
    title: 'La urgencia cambia todo',
    description: 'Cada vez que el frontend carga, recalcula la fase de urgencia desde el deadline. No hay estado almacenado: la fase emerge del tiempo restante.',
    detail: [
      'getUrgencyPhase(deadline) → "normal" | "focus" | "urgent" | "panic" | "expired"',
      'Cada fase cambia paleta de colores, surfaces disponibles y tono del agente',
      'En pánico: WarRoomSurface ocupa la zona primaria, resto del layout se condensa',
      'El cambio es automático y consistente para todos los miembros del workspace',
    ],
  },
  {
    number: '05',
    icon: Zap,
    title: 'Estado compartido y persistido',
    description: 'Cada acción — del agente o de un miembro — muta el estado centralizado del workspace. CopilotKit propaga el cambio a todos los clientes conectados.',
    detail: [
      'useCoAgent({ name: "main_graph" }) expone el estado y las herramientas de frontend',
      'setCrewState actualiza tareas, milestones y blockers desde el agente',
      'El agente recibe solo el slice relevante de estado — no el estado completo',
      'AsyncPostgresSaver persiste checkpoints — al reconectar, el contexto se hidrata',
    ],
  },
  {
    number: '06',
    icon: Shield,
    title: 'Operaciones destructivas con gate',
    description: 'Borrar tareas, cerrar milestones o reasignaciones masivas son operaciones de alto riesgo. El sistema siempre interpone un ApprovalGate antes de ejecutarlas.',
    detail: [
      '@guarded_tool(risk_level=HIGH) → PolicyEngine exige confirmación humana',
      'ApprovalGate surface bloquea la UI con descripción de la operación y sus efectos',
      'El agente espera la confirmación antes de continuar — no hay auto-aprobación',
      'Audit log registra todas las decisiones de policy: aprobadas y rechazadas',
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Cómo funciona</Badge>
          <h1 className="text-5xl font-bold mb-5 leading-tight">
            Del mensaje al workspace:<br />
            <GradientText>sin configuración, sin fricción</GradientText>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Cada interacción pasa por un pipeline de tres capas: enrutamiento por agente especializado, emisión de envelopes tipados, y renderización de superficies contextuales.
          </p>
        </motion.div>

        <PipelineFlowDiagram />

        <div className="mb-24">
          {STEPS.map((step, i) => (
            <Step key={i} {...step} isLast={i === STEPS.length - 1} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Los tres agentes</h2>
            <p className="text-zinc-400">Cada uno con rol, herramientas y contexto propios.</p>
          </div>
          <AgentCapabilityMatrix />
          <div className="grid md:grid-cols-3 gap-5">
            {AGENTS.map((agent, i) => {
              const Icon = agent.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`border p-6 h-full ${agent.color}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-zinc-300" />
                      <span className="font-semibold text-zinc-100">{agent.name}</span>
                    </div>
                    <Badge className={`${agent.badgeColor} text-xs mb-3`}>{agent.role}</Badge>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">{agent.desc}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Herramientas</p>
                      {agent.tools.map((t, j) => (
                        <div key={j} className="text-xs font-mono bg-zinc-900/60 rounded px-2 py-1 text-zinc-400">{t}</div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center"
        >
          <h2 className="text-2xl font-bold mb-3">
            ¿Querés ver el pipeline en acción?
          </h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            El modo demo tiene datos simulados y todos los agentes activos. Podés cambiar el rol, el nivel técnico y el estado del deadline para ver cómo cambia la interfaz.
          </p>
          <a
            href="/dev"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Abrir demo en vivo
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </MarketingLayout>
  )
}
