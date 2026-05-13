'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DottedSurface } from '@/components/ui/dotted-surface'
import {
  ArrowRight, Sparkles, Zap, Users, GitBranch,
  CheckCircle2, LayoutDashboard, BrainCircuit, AlertTriangle, Layers, Clock, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
      {children}
    </span>
  )
}

const PREVIEW_STATES = [
  {
    label: 'Fase: PÁNICO',
    labelColor: 'text-red-400',
    lines: [
      { icon: '🚨', text: 'Deadline en 47 minutos', color: 'text-red-300' },
      { icon: '⚠️', text: '3 bloqueadores sin resolver', color: 'text-amber-300' },
      { icon: '✂️', text: 'Sugiero recortar: notificaciones en tiempo real', color: 'text-zinc-300' },
    ],
    accent: 'border-red-500/40',
  },
  {
    label: 'Vista: Líder técnico',
    labelColor: 'text-indigo-400',
    lines: [
      { icon: '✅', text: 'Auth migrada — 2h antes de lo planeado', color: 'text-green-300' },
      { icon: '🔄', text: 'PR #47 en review — riesgo bajo', color: 'text-zinc-300' },
      { icon: '🎯', text: 'Milestone 2/3 al 78%', color: 'text-indigo-300' },
    ],
    accent: 'border-indigo-500/40',
  },
  {
    label: 'Vista: Miembro (no técnico)',
    labelColor: 'text-violet-400',
    lines: [
      { icon: '📋', text: 'Tu próxima tarea: revisar copy de landing', color: 'text-zinc-300' },
      { icon: '🕐', text: 'Carlos está bloqueado — necesita tu input', color: 'text-amber-300' },
      { icon: '💬', text: '¿Querés ver el resumen del sprint?', color: 'text-violet-300' },
    ],
    accent: 'border-violet-500/40',
  },
]

function FloatingPreview() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % PREVIEW_STATES.length), 3500)
    return () => clearInterval(t)
  }, [])

  const state = PREVIEW_STATES[idx]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 blur-3xl rounded-3xl" />
      <div className={cn(
        'relative bg-zinc-900/80 backdrop-blur-xl border rounded-2xl p-6 shadow-2xl transition-colors duration-700',
        state.accent
      )}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className={cn('ml-2 text-xs font-mono font-semibold', state.labelColor)}>
            {state.label}
          </span>
        </div>
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {state.lines.map((line, i) => (
            <div key={i} className="flex items-start gap-3 bg-zinc-800/60 rounded-lg px-3 py-2.5 text-sm">
              <span>{line.icon}</span>
              <span className={line.color}>{line.text}</span>
            </div>
          ))}
        </motion.div>
        <div className="flex gap-1.5 mt-5 justify-center">
          {PREVIEW_STATES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={cn('w-1.5 h-1.5 rounded-full transition-all', i === idx ? 'bg-indigo-400 w-4' : 'bg-zinc-600')} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, description, delay = 0 }: {
  icon: React.ComponentType<{ className?: string }>
  title: string; description: string; delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-zinc-900/80 border-zinc-800 p-6 h-full hover:border-indigo-500/50 transition-all duration-300 group cursor-default">
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
          <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </Card>
    </motion.div>
  )
}

function UseCaseCard({ emoji, title, description, items, delay = 0 }: {
  emoji: string; title: string; description: string; items: string[]; delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-zinc-900/80 border-zinc-800 p-7 h-full">
        <div className="text-3xl mb-3">{emoji}</div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-5">{description}</p>
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span className="text-zinc-300">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  )
}

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const features = [
    {
      icon: LayoutDashboard,
      title: 'Interfaz adaptativa',
      description: 'La UI se transforma según el rol, nivel técnico y fase de urgencia de cada persona. El líder ve el panorama; el miembro ve su próxima acción.',
    },
    {
      icon: AlertTriangle,
      title: 'Motor de urgencia',
      description: 'normal → focus → urgent → panic → expired. El workspace evoluciona con tu deadline de forma automática, sin configuración manual.',
    },
    {
      icon: Layers,
      title: 'Superficies generativas',
      description: 'El agente emite datos estructurados y el runtime decide cómo mostrarlos. CountdownCritical, ForceGraph, IdeaMatrix — según el contexto.',
    },
    {
      icon: Users,
      title: 'Multi-rol nativo',
      description: 'Líder, miembro, observador: cada rol tiene vistas, permisos y agentes especializados. Un solo proyecto, múltiples perspectivas coordinadas.',
    },
    {
      icon: BrainCircuit,
      title: 'Contexto persistente',
      description: 'Documentos, bloqueadores, tareas y decisiones en un modelo de estado compartido. El agente siempre sabe dónde está el equipo.',
    },
    {
      icon: Zap,
      title: '$0/mes en infraestructura',
      description: 'Deploy en Vercel + Render + Neon + Upstash. Totalmente funcional en free tier. Sin tarjeta de crédito, sin sorpresas.',
    },
  ]

  const useCases = [
    {
      emoji: '🏆',
      title: 'Hackathon',
      description: 'Alta presión, deadline fijo, decisiones bajo fuego',
      items: [
        'Cuenta regresiva en tiempo real con viabilidad del proyecto',
        'Features a recortar ordenadas por tiempo ahorrado',
        'El workspace entra en modo panic automáticamente',
        'Resumen de estado para el pitch al final',
      ],
    },
    {
      emoji: '💻',
      title: 'Sprint de desarrollo',
      description: 'Ciclo corto, equipo técnico, entrega semanal',
      items: [
        'Bloqueadores detectados antes de que frenen el sprint',
        'Distribución de tareas por nivel técnico del miembro',
        'Vista diferenciada líder/dev para cada sprint',
        'Escalación automática cuando el sprint está en riesgo',
      ],
    },
    {
      emoji: '🌍',
      title: 'Equipo remoto',
      description: 'Trabajo distribuido, colaboración asincrónica',
      items: [
        'Estado del equipo siempre visible sin reuniones',
        'Contexto del proyecto compartido desde el onboarding',
        'Notificaciones de urgencia sin ruido innecesario',
        'Cada miembro opera desde su propia vista contextual',
      ],
    },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">

      {/* Three.js wave background — fixed behind everything, visible only in hero */}
      <DottedSurface className="opacity-[0.18]" />

      {/* Top edge fade: hides dots behind the nav */}
      <div className="pointer-events-none fixed top-0 inset-x-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent z-10" />

      {/* nav */}
      <nav className="relative z-50 border-b border-zinc-800/40 backdrop-blur-xl bg-zinc-950/70 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Crew Companion</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-zinc-400 hover:text-zinc-100 transition-colors">Características</a>
            <a href="#use-cases" className="text-zinc-400 hover:text-zinc-100 transition-colors">Casos de uso</a>
            <a href="#diferencial" className="text-zinc-400 hover:text-zinc-100 transition-colors">¿Por qué?</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
              <Link href="/auth/signin">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link href="/auth/signin">
                Comenzar gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[88vh] flex items-center pt-16 pb-0 px-6">

        {/* Soft glow accents behind the content — subtle focal points */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px]" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto w-full pb-28">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-7">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Cognitive Operational Runtime
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
              >
                La interfaz que{' '}
                <GradientText>entiende a tu equipo</GradientText>
                {' '}en tiempo real
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-zinc-400 leading-relaxed max-w-lg"
              >
                Crew Companion no es un dashboard con IA. Es un runtime que transforma la UI según el rol,
                nivel técnico y urgencia de cada persona. La interfaz emerge — no se navega.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-500 text-base px-7">
                  <Link href="/auth/signin">
                    Comenzar gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-zinc-700 hover:border-indigo-500 text-base px-7 bg-transparent">
                  <Link href="/dev">Ver demo en vivo</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-6 text-sm text-zinc-500"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> $0/mes en infraestructura</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Open source</span>
              </motion.div>
            </div>

            <FloatingPreview />
          </div>
        </motion.div>

        {/* Bottom fade — transitions hero into the next solid section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-zinc-950" />
      </section>

      {/* ── SECTIONS BELOW — solid bg covers the fixed dots ── */}

      {/* diferencial callout */}
      <section id="diferencial" className="relative py-16 px-6 border-y border-zinc-800/50 bg-zinc-950">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">¿Por qué es diferente?</p>
            <p className="text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed max-w-3xl mx-auto">
              No es un Trello con IA encima. Es un runtime donde{' '}
              <span className="text-indigo-400">el agente decide qué mostrar</span>,{' '}
              el runtime decide cómo layoutearlo, y{' '}
              <span className="text-violet-400">el usuario siempre tiene la última palabra</span>.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 text-center"
          >
            {[
              { label: 'Roles soportados', value: '3', sub: 'líder · miembro · observer' },
              { label: 'Superficies generativas', value: '13', sub: 'y creciendo' },
              { label: 'Fases de urgencia', value: '5', sub: 'normal → panic → expired' },
              { label: 'Costo mensual', value: '$0', sub: 'free tier completo' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-sm font-semibold text-zinc-300 mt-1">{s.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="relative py-28 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Características</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Diseñado para equipos que{' '}
                <GradientText>trabajan en serio</GradientText>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Cada pieza resuelve un problema real de coordinación bajo presión.
              </p>
            </motion.div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* use cases */}
      <section id="use-cases" className="relative py-28 px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">Casos de uso</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Para el equipo que{' '}
                <GradientText>no tiene tiempo que perder</GradientText>
              </h2>
            </motion.div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {useCases.map((u, i) => <UseCaseCard key={i} {...u} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative py-28 px-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 blur-3xl rounded-3xl" />
            <Card className="relative bg-zinc-900/80 border-zinc-800 p-12">
              <h2 className="text-4xl font-bold mb-4">
                Tu equipo merece una interfaz que{' '}
                <GradientText>trabaje con él</GradientText>
              </h2>
              <p className="text-zinc-400 mb-8 text-lg">
                Crea tu workspace en 2 minutos. Sin configuración, sin crédito, sin fricción.
              </p>
              <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-500 text-base px-8">
                <Link href="/auth/signin">
                  Comenzar ahora — es gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative border-t border-zinc-800/50 py-10 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Crew Companion</span>
            <span className="text-zinc-600 text-xs ml-2">Cognitive Operational Runtime</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#features" className="hover:text-zinc-300 transition-colors">Características</a>
            <a href="#use-cases" className="hover:text-zinc-300 transition-colors">Casos de uso</a>
            <Link href="/dev" className="hover:text-zinc-300 transition-colors">Demo</Link>
            <Link href="/auth/signin" className="hover:text-zinc-300 transition-colors">Entrar</Link>
          </div>
          <div className="flex items-center gap-4 text-zinc-600">
            <GitBranch className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
            <MessageSquare className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
            <Clock className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
