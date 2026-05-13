'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DottedSurface } from '@/components/ui/dotted-surface'
import {
  ArrowRight, Sparkles, Zap, Users, GitBranch,
  CheckCircle2, LayoutDashboard, BrainCircuit, AlertTriangle, Layers, Clock, MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
      {children}
    </span>
  )
}

const PREVIEW_STATES = [
  {
    label: 'Modo pánico — 47 min restantes',
    labelColor: 'text-red-400',
    lines: [
      { icon: '🚨', text: 'Deadline crítico detectado. Cambiando a modo guerra.', color: 'text-red-300' },
      { icon: '✂️', text: 'Planner: recortá notificaciones push — ganás 2h', color: 'text-amber-300' },
      { icon: '🔒', text: 'Coach: bloqueando nuevas features hasta el release', color: 'text-zinc-300' },
    ],
    accent: 'border-red-500/40',
  },
  {
    label: 'Vista del líder — Sprint en curso',
    labelColor: 'text-indigo-400',
    lines: [
      { icon: '✅', text: 'Auth completada — 2h antes de lo estimado', color: 'text-green-300' },
      { icon: '⚠️', text: 'Ana bloqueada en deploy — riesgo alto para el milestone', color: 'text-amber-300' },
      { icon: '🎯', text: 'Milestone al 78% · 3 tareas críticas sin asignar', color: 'text-indigo-300' },
    ],
    accent: 'border-indigo-500/40',
  },
  {
    label: 'Vista del miembro — nivel no técnico',
    labelColor: 'text-violet-400',
    lines: [
      { icon: '📋', text: 'Tu siguiente tarea: revisar copy de la landing', color: 'text-zinc-300' },
      { icon: '💬', text: 'Coach: "Hacé clic en Deploy > Preview. ¿Ves el botón azul?"', color: 'text-violet-300' },
      { icon: '🕐', text: 'Carlos necesita tu aprobación antes de las 18:00', color: 'text-amber-300' },
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
  const { t } = useLocale()

  const featureIcons = [LayoutDashboard, AlertTriangle, Layers, Users, BrainCircuit, Zap]
  const features = t.features.items.map((item, i) => ({ icon: featureIcons[i], ...item }))

  const useCases = [
    {
      emoji: '⚡',
      title: 'Deadline en 8 horas',
      description: 'Son las 10pm, el release es mañana a mediodía. Tres tareas críticas sin terminar.',
      items: [
        'El sistema detecta "6h 23min restantes" y activa modo pánico automáticamente — sin que nadie lo configure',
        'La UI muestra en war-room: qué tareas bloquean el release, quién las tiene, cuánto falta',
        'Martín está bloqueado por un migration error. Coach le escribe: "Línea 47: falta el ROLLBACK — ¿muestro el script corregido?"',
        'El Planner sugiere: "Cortá la feature de exportación PDF — ganás 2.5h sin afectar el milestone"',
        'El líder ve el porcentaje de viabilidad caer de 84% a 61% y reasigna sin fricción',
      ],
    },
    {
      emoji: '🧩',
      title: 'Diseñador + dev en el mismo sprint',
      description: 'Laura diseña, Carlos desarrolla. Ninguno sabe qué necesita el otro hasta que es tarde.',
      items: [
        'Laura termina el mockup y no sabe si subir a Figma o esperar a Carlos — la UI le muestra su próxima tarea exacta con instrucciones en lenguaje llano',
        'Carlos pregunta sobre el schema de la API. El Coach le responde con los tipos exactos, no con pasos básicos',
        'Cuando Laura se traba con el deploy de preview, el Coach le dice: "Hacé clic en Vercel > Deployments > Preview. ¿Ves el botón azul?"',
        'El líder ve que Laura lleva 2h bloqueada — el sistema ya escaló el riesgo al milestone de diseño',
        'Cada uno opera desde su vista sin invadir ni confundir la del otro',
      ],
    },
    {
      emoji: '🌐',
      title: 'Equipo en tres zonas horarias',
      description: 'Dev en Buenos Aires cierra laptop a las 18:00. Frontend en Madrid abre a las 9:00 siguiente.',
      items: [
        'Al abrir sesión, Sofia ve exactamente qué quedó bloqueado, qué se decidió y qué le toca — sin preguntarle a nadie',
        'El agente mantiene el contexto completo del proyecto: tareas, decisiones, documentos, blockers',
        'El blocker de Diego en infraestructura aparece en el panel del líder en Madrid aunque Diego esté durmiendo',
        'El Coach puede responder preguntas sobre el doc de arquitectura a las 3am sin que nadie intervenga',
        'El líder resuelve blockers a primera hora; el equipo retoma sin reuniones de 30 minutos para "ponerse al día"',
      ],
    },
  ]

  return (
    <div ref={containerRef} className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">

      {/* Three.js wave background — fixed behind everything, visible only in hero */}
      <DottedSurface dotColor="light" className="opacity-35" />

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
            <Link href="/features" className="text-zinc-400 hover:text-zinc-100 transition-colors">{t.nav.features}</Link>
            <Link href="/how-it-works" className="text-zinc-400 hover:text-zinc-100 transition-colors">{t.nav.howItWorks}</Link>
            <Link href="/roadmap" className="text-zinc-400 hover:text-zinc-100 transition-colors">{t.nav.roadmap}</Link>
            <Link href="/about" className="text-zinc-400 hover:text-zinc-100 transition-colors">{t.nav.about}</Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
              <Link href="/auth/signin">{t.nav.signIn}</Link>
            </Button>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link href="/auth/signin">
                {t.nav.getStarted}
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
                  {t.hero.badge}
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight"
              >
                {t.hero.title}{' '}
                <GradientText>{t.hero.titleHighlight}</GradientText>
                {' '}{t.hero.titleSuffix}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-zinc-400 leading-relaxed max-w-lg"
              >
                {t.hero.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-500 text-base px-7">
                  <Link href="/auth/signin">
                    {t.hero.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-zinc-700 hover:border-indigo-500 text-base px-7 bg-transparent">
                  <Link href="/dev">{t.hero.demo}</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-center gap-6 text-sm text-zinc-500"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t.hero.badge1}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t.hero.badge2}</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> {t.hero.badge3}</span>
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
      <section id="diferencial" className="relative z-[1] py-16 px-6 border-y border-zinc-800/50 bg-zinc-950">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-zinc-500 text-sm font-semibold uppercase tracking-widest mb-4">{t.differentiator.eyebrow}</p>
            <p className="text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed max-w-3xl mx-auto">
              {t.differentiator.text}{' '}
              <span className="text-indigo-400">{t.differentiator.highlight}</span>{' '}
              {t.differentiator.text2}{' '}
              <span className="text-violet-400">{t.differentiator.highlight2}</span>
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 text-center"
          >
            {[
              { label: t.differentiator.stat1Label, value: '3', sub: t.differentiator.stat1Sub },
              { label: t.differentiator.stat2Label, value: '14', sub: t.differentiator.stat2Sub },
              { label: t.differentiator.stat3Label, value: '5', sub: t.differentiator.stat3Sub },
              { label: t.differentiator.stat4Label, value: '6', sub: t.differentiator.stat4Sub },
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
      <section id="features" className="relative z-[1] py-28 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">{t.features.eyebrow}</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t.features.title}{' '}
                <GradientText>{t.features.titleHighlight}</GradientText>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                {t.features.subtitle}
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
      <section id="use-cases" className="relative z-[1] py-28 px-6 bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 mb-5">{t.useCases.eyebrow}</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {t.useCases.title}{' '}
                <GradientText>{t.useCases.titleHighlight}</GradientText>
              </h2>
            </motion.div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {useCases.map((u, i) => <UseCaseCard key={i} {...u} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="relative z-[1] py-28 px-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 blur-3xl rounded-3xl" />
            <Card className="relative bg-zinc-900/80 border-zinc-800 p-12">
              <h2 className="text-4xl font-bold mb-4">
                {t.cta.title}
              </h2>
              <p className="text-zinc-400 mb-8 text-lg">
                {t.cta.subtitle}
              </p>
              <Button size="lg" asChild className="bg-indigo-600 hover:bg-indigo-500 text-base px-8">
                <Link href="/auth/signin">
                  {t.cta.button}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-[1] border-t border-zinc-800/50 py-10 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Crew Companion</span>
            <span className="text-zinc-600 text-xs ml-2">Cognitive Operational Runtime</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/features" className="hover:text-zinc-300 transition-colors">{t.nav.features}</Link>
            <Link href="/how-it-works" className="hover:text-zinc-300 transition-colors">{t.nav.howItWorks}</Link>
            <Link href="/roadmap" className="hover:text-zinc-300 transition-colors">{t.nav.roadmap}</Link>
            <Link href="/about" className="hover:text-zinc-300 transition-colors">{t.nav.about}</Link>
            <Link href="/dev" className="hover:text-zinc-300 transition-colors">Demo</Link>
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
