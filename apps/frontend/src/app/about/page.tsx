'use client'

import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { MarketingLayout } from '@/components/marketing/MarketingLayout'
import { Sparkles, GitBranch, BrainCircuit, Layers, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
      {children}
    </span>
  )
}

function ArchitectureDiagram() {
  const layers = [
    {
      name: 'Frontend',
      color: 'border-indigo-500/40 bg-indigo-500/5',
      labelColor: 'text-indigo-300',
      dotColor: 'bg-indigo-500',
      tags: ['Next.js 15', 'React 19', 'CopilotKit v2', 'Framer Motion'],
      note: 'Surfaces generativas · Layout Engine · Urgency phases',
    },
    {
      name: 'BFF',
      color: 'border-violet-500/40 bg-violet-500/5',
      labelColor: 'text-violet-300',
      dotColor: 'bg-violet-500',
      tags: ['Hono', 'CopilotKit Runtime', 'Envelope validation'],
      note: 'Frontend nunca llama al agente directamente',
    },
    {
      name: 'Agent',
      color: 'border-emerald-500/40 bg-emerald-500/5',
      labelColor: 'text-emerald-300',
      dotColor: 'bg-emerald-500',
      tags: ['Python + LangGraph', 'Gemini Flash', '@guarded_tool'],
      note: 'Orquestador · Planner · Coach',
    },
    {
      name: 'Persistence',
      color: 'border-zinc-600/40 bg-zinc-800/30',
      labelColor: 'text-zinc-400',
      dotColor: 'bg-zinc-500',
      tags: ['Postgres (Neon)', 'Redis (Upstash)', 'AsyncPostgresSaver'],
      note: 'Estado de workspace · Checkpoints de agentes',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="my-14"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-6">Arquitectura de capas</p>
      <div className="relative">
        <div className="absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/50 via-emerald-500/50 to-zinc-600/50" />
        <div className="space-y-3">
          {layers.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-xl p-4 pl-12 relative ${layer.color}`}
            >
              <div className={`absolute left-[17px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${layer.dotColor} ring-4 ring-zinc-950`} />
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className={`text-sm font-semibold ${layer.labelColor}`}>{layer.name}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{layer.note}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {layer.tags.map((tag, j) => (
                    <span key={j} className="text-xs bg-zinc-900/60 border border-zinc-700/50 text-zinc-400 rounded-md px-2 py-0.5 font-mono">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs text-zinc-600">
        <div className="flex-1 h-px bg-zinc-800" />
        <span>Separación de capas — invariante del proyecto</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    </motion.div>
  )
}


const PRINCIPLES = [
  {
    icon: Layers,
    title: 'La UI emerge del contexto',
    desc: 'No hay pantallas fijas ni navegación que aprender. El agente emite envelopes tipados y el runtime monta la superficie correcta. La interfaz es consecuencia del estado.',
  },
  {
    icon: BrainCircuit,
    title: 'Agentes especializados, no monolíticos',
    desc: 'Un agente que intenta hacer todo termina haciendo todo mal. Tres agentes con roles claros, herramientas propias y contexto delimitado producen comportamientos predecibles.',
  },
  {
    icon: Zap,
    title: 'Urgencia derivada, nunca configurada',
    desc: 'La única variable de urgencia es el deadline. El sistema calcula la fase en tiempo real. Ningún humano tiene que recordar activar el modo guerra.',
  },
  {
    icon: GitBranch,
    title: 'Separación estricta de capas',
    desc: 'Frontend nunca llama al agente directamente. Siempre pasa por el BFF. Los tipos están sincronizados entre TypeScript y Python. Una violación aquí rompe todo.',
  },
]

export default function AboutPage() {
  return (
    <MarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20"
        >
          <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Acerca de</Badge>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Un runtime cognitivo,<br />
            <GradientText>no un dashboard más</GradientText>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
            Crew Companion nació de una observación simple: la mayoría de herramientas de gestión de equipos asumen que todos los miembros necesitan ver lo mismo, al mismo tiempo, en la misma interfaz.
          </p>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mt-4">
            Eso produce interfaces sobrecargadas para el dev senior, interfaces crípticas para el diseñador, y dashboards llenos de datos que el líder no puede leer cuando realmente los necesita — a las 11pm antes de un release.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold mb-6">La apuesta</h2>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 space-y-4 text-zinc-300 leading-relaxed">
            <p>
              ¿Qué pasaría si la interfaz no fuera un conjunto de pantallas que el equipo navega, sino el resultado de evaluar <em className="text-zinc-100 not-italic">quién está mirando</em>, <em className="text-zinc-100 not-italic">qué tan técnico es</em> y <em className="text-zinc-100 not-italic">qué tan urgente está la situación</em>?
            </p>
            <p>
              Eso es Crew Companion: un Cognitive Operational Runtime. Tres agentes especializados emiten datos estructurados; el runtime monta las superficies correctas en las zonas correctas del workspace. La UI no se configura — emerge del contexto.
            </p>
            <p>
              El Coach que guía a Laura con el deploy en pasos numerados es el mismo sistema que le da a Carlos un snippet directo sin explicaciones innecesarias. La diferencia está en lo que el sistema sabe sobre ellos, no en lo que ellos configuraron.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-2xl font-bold mb-8">Principios de diseño</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="bg-zinc-900/60 border-zinc-800 p-6 h-full">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-zinc-100 mb-2">{p.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{p.desc}</p>
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
          className="mb-20"
        >
          <h2 className="text-2xl font-bold mb-6">Stack técnico</h2>
          <ArchitectureDiagram />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Open source, en construcción</h2>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-7">
            El proyecto está activo. El código es público. Si el problema que resuelve es tuyo también, el demo está disponible ahora mismo.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Empezar
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dev"
              className="inline-flex items-center gap-2 border border-zinc-700 hover:border-indigo-500 text-zinc-300 hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              Ver demo en vivo
            </Link>
            <Link
              href="/roadmap"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              Ver roadmap
            </Link>
          </div>
        </motion.div>
      </div>
    </MarketingLayout>
  )
}
