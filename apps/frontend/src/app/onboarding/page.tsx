'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Plus, X, Check, Link, FileText, Users, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── types ───────────────────────────────────────────────────────────────────

type ProjectTypeId = 'hackathon' | 'sprint' | 'remote-team' | 'launch' | 'consulting' | 'other'
type Member = { name: string; role: 'leader' | 'member'; technicalLevel: 'low-tech' | 'high-tech' }
type ContextMode = 'url' | 'text' | 'skip'

interface WizardState {
  projectType: ProjectTypeId | null
  isDevProject: boolean
  projectName: string
  deadline: string
  contextMode: ContextMode
  contextUrl: string
  contextText: string
  members: Member[]
}

// ─── config ───────────────────────────────────────────────────────────────────

const PROJECT_TYPES: { id: ProjectTypeId; label: string; icon: string; desc: string; devDefault: boolean }[] = [
  { id: 'hackathon',    label: 'Hackathon',          icon: '🏆', desc: 'Sprint de 24-72h, deadline fijo, alta presión', devDefault: true  },
  { id: 'sprint',       label: 'Sprint de desarrollo',icon: '💻', desc: 'Ciclo de 1-2 semanas, equipo técnico',          devDefault: true  },
  { id: 'remote-team',  label: 'Equipo remoto',       icon: '🌍', desc: 'Trabajo distribuido, colaboración continua',    devDefault: false },
  { id: 'launch',       label: 'Lanzamiento',         icon: '🚀', desc: 'Preparar y ejecutar un go-to-market',           devDefault: false },
  { id: 'consulting',   label: 'Consultoría',         icon: '🤝', desc: 'Proyecto con cliente, entregables definidos',   devDefault: false },
  { id: 'other',        label: 'Otro',                icon: '⚙️', desc: 'Proyecto personalizado',                        devDefault: false },
]

const STEPS = ['Tipo', 'Proyecto', 'Contexto', 'Equipo']

// ─── helpers ─────────────────────────────────────────────────────────────────

const slide = {
  initial: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit:    (dir: number) => ({ x: dir * -40, opacity: 0 }),
  transition: { duration: 0.22, ease: 'easeOut' },
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
            i < step  ? 'bg-indigo-500 text-white' :
            i === step ? 'bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400' :
                         'bg-zinc-800 text-zinc-500'
          )}>
            {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-white' : 'text-zinc-500')}>
            {STEPS[i]}
          </span>
          {i < total - 1 && <div className={cn('h-px w-8 transition-all duration-300', i < step ? 'bg-indigo-500' : 'bg-zinc-700')} />}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Project type ─────────────────────────────────────────────────────

function StepType({ value, onChange }: { value: ProjectTypeId | null; onChange: (v: ProjectTypeId) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">¿Qué tipo de proyecto es?</h2>
        <p className="text-zinc-400 text-sm mt-1">Esto configura el agente para tu contexto específico.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PROJECT_TYPES.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative text-left rounded-xl border p-4 transition-all duration-200',
              value === t.id
                ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'
            )}
          >
            {value === t.id && (
              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <span className="text-2xl">{t.icon}</span>
            <p className="text-sm font-semibold text-white mt-1.5">{t.label}</p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Project details ──────────────────────────────────────────────────

function StepDetails({
  state, update,
}: {
  state: Pick<WizardState, 'projectName' | 'deadline' | 'isDevProject' | 'projectType'>
  update: (k: keyof WizardState, v: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Detalles del proyecto</h2>
        <p className="text-zinc-400 text-sm mt-1">Nombre, deadline y perfil técnico.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nombre del proyecto</label>
        <input
          type="text"
          value={state.projectName}
          onChange={e => update('projectName', e.target.value)}
          placeholder={state.projectType === 'hackathon' ? 'ej. HackMTY 2026' : 'Mi proyecto'}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          {state.projectType === 'hackathon' ? 'Fin del hackathon' : 'Deadline del proyecto'}
        </label>
        <input
          type="datetime-local"
          value={state.deadline}
          onChange={e => update('deadline', e.target.value)}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Perfil del equipo</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: true,  label: 'Técnico / Dev',     icon: '💻', desc: 'Código, arquitectura, APIs' },
            { value: false, label: 'No técnico / Mixed', icon: '🎨', desc: 'Diseño, negocios, gestión' },
          ] as const).map(opt => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => update('isDevProject', opt.value)}
              className={cn(
                'text-left rounded-xl border p-3.5 transition-all duration-200',
                state.isDevProject === opt.value
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
              )}
            >
              <span className="text-xl">{opt.icon}</span>
              <p className="text-sm font-semibold text-white mt-1">{opt.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Context ──────────────────────────────────────────────────────────

function StepContext({
  state, update,
}: {
  state: Pick<WizardState, 'contextMode' | 'contextUrl' | 'contextText'>
  update: (k: keyof WizardState, v: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Contexto del proyecto</h2>
        <p className="text-zinc-400 text-sm mt-1">
          El agente usará esto para entender tu proyecto y sugerir tareas, prioridades y riesgos desde el primer mensaje.
        </p>
      </div>

      <div className="flex gap-2">
        {([
          { mode: 'url',  icon: Link,     label: 'URL' },
          { mode: 'text', icon: FileText, label: 'Texto' },
          { mode: 'skip', icon: X,        label: 'Omitir' },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => update('contextMode', mode)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all',
              state.contextMode === mode
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {state.contextMode === 'url' && (
          <motion.div key="url" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              URL del proyecto
            </label>
            <input
              type="url"
              value={state.contextUrl}
              onChange={e => update('contextUrl', e.target.value)}
              placeholder="https://hackathon.io/challenge/2026  ·  notion.so/mi-brief  ·  docs.google.com/..."
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500 mt-1.5">Página del hackathon, brief del cliente, Notion, Google Docs, etc.</p>
          </motion.div>
        )}

        {state.contextMode === 'text' && (
          <motion.div key="text" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Descripción / brief / tareas
            </label>
            <textarea
              value={state.contextText}
              onChange={e => update('contextText', e.target.value)}
              rows={6}
              placeholder={`Pegá aquí lo que tengas:\n\n• Brief del cliente\n• Lista de tareas a completar\n• Descripción técnica\n• Enunciado del problema\n• Cualquier contexto relevante`}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-500 resize-none leading-relaxed"
            />
          </motion.div>
        )}

        {state.contextMode === 'skip' && (
          <motion.div key="skip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-400">
            El agente arrancará sin contexto previo. Podés compartirlo en el primer mensaje del chat.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Step 4: Team ─────────────────────────────────────────────────────────────

function StepTeam({ members, update }: {
  members: Member[]
  update: (members: Member[]) => void
}) {
  const set = (i: number, field: keyof Member, value: string) =>
    update(members.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  const add = () => update([...members, { name: '', role: 'member', technicalLevel: 'low-tech' }])
  const remove = (i: number) => update(members.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Miembros del equipo</h2>
        <p className="text-zinc-400 text-sm mt-1">Al menos un líder. Podés agregar más después.</p>
      </div>

      <div className="space-y-2.5">
        {members.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-center bg-zinc-900 border border-zinc-800 rounded-xl p-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
              {m.name ? m.name[0].toUpperCase() : <Users className="w-3.5 h-3.5" />}
            </div>
            <input
              type="text"
              placeholder="Nombre"
              value={m.name}
              onChange={e => set(i, 'name', e.target.value)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 focus:outline-none min-w-0"
            />
            <select
              value={m.role}
              onChange={e => set(i, 'role', e.target.value as Member['role'])}
              className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="leader">Líder</option>
              <option value="member">Miembro</option>
            </select>
            <select
              value={m.technicalLevel}
              onChange={e => set(i, 'technicalLevel', e.target.value as Member['technicalLevel'])}
              className="rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1.5 text-xs focus:outline-none"
            >
              <option value="high-tech">Técnico</option>
              <option value="low-tech">No-técnico</option>
            </select>
            {members.length > 1 && (
              <button type="button" onClick={() => remove(i)}
                className="text-zinc-600 hover:text-red-400 transition-colors p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <Plus className="w-4 h-4" />
        Agregar miembro
      </button>
    </div>
  )
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Antes de empezar</h2>
        <p className="text-zinc-400 text-sm mt-1">
          El proceso toma menos de 2 minutos. Tené a mano:
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: '📛',
            label: 'Nombre del proyecto',
            desc: 'Cómo se llama el hackathon, sprint o cliente.',
          },
          {
            icon: '📅',
            label: 'Fecha y hora límite',
            desc: 'El deadline exacto — día, mes y hora de entrega.',
          },
          {
            icon: '👥',
            label: 'Nombres del equipo',
            desc: 'Quién participa, qué rol tiene cada uno (líder o miembro) y si es técnico o no.',
          },
          {
            icon: '🔗',
            label: 'Contexto del proyecto (opcional)',
            desc: 'URL del brief, enunciado, Notion o Google Docs. También podés pegar texto directamente.',
          },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
            <span className="text-xl shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all"
      >
        Comenzar
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [state, setState] = useState<WizardState>({
    projectType: null,
    isDevProject: true,
    projectName: '',
    deadline: '',
    contextMode: 'skip',
    contextUrl: '',
    contextText: '',
    members: [{ name: '', role: 'leader', technicalLevel: 'high-tech' }],
  })

  const update = (k: keyof WizardState, v: unknown) =>
    setState(prev => ({ ...prev, [k]: v }))

  const canAdvance = () => {
    if (step === 0) return state.projectType !== null
    if (step === 1) return state.projectName.trim() !== '' && state.deadline !== ''
    if (step === 2) {
      if (state.contextMode === 'url') return state.contextUrl.trim() !== ''
      return true
    }
    if (step === 3) return state.members.length > 0 && state.members.every(m => m.name.trim() !== '')
    return true
  }

  const go = (next: number) => {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

  // When picking project type, pre-set isDevProject
  const pickType = (t: ProjectTypeId) => {
    const found = PROJECT_TYPES.find(p => p.id === t)
    setState(prev => ({ ...prev, projectType: t, isDevProject: found?.devDefault ?? false }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.projectName,
          deadline: new Date(state.deadline).toISOString(),
          members: state.members,
          projectType: state.projectType,
          isDevProject: state.isDevProject,
          contextUrl: state.contextMode === 'url' ? state.contextUrl : undefined,
          contextText: state.contextMode === 'text' ? state.contextText : undefined,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push('/dashboard')
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-3 mb-8">
          <Rocket className="w-6 h-6 text-indigo-400" />
          <span className="text-white font-bold text-lg">Crew Companion</span>
        </div>

        {!started && <Intro onStart={() => setStarted(true)} />}
        {started && <ProgressBar step={step} total={STEPS.length} />}

        {started && <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {step === 0 && <StepType value={state.projectType} onChange={pickType} />}
              {step === 1 && <StepDetails state={state} update={update} />}
              {step === 2 && <StepContext state={state} update={update} />}
              {step === 3 && <StepTeam members={state.members} update={m => update('members', m)} />}
            </motion.div>
          </AnimatePresence>
        </div>}

        {started && error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        {started && <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(step + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAdvance() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
            >
              {loading ? 'Creando workspace...' : 'Lanzar'}
              {!loading && <Rocket className="w-4 h-4" />}
            </button>
          )}
        </div>}
      </div>
    </div>
  )
}
