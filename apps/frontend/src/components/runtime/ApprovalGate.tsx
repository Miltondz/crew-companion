'use client'

import { useState, useRef, useEffect } from 'react'
import { ShieldAlert, ShieldCheck, ShieldX, Skull, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/runtime/capability/riskLevel'

export interface PendingAction {
  envelopeId: string
  tool: string
  capabilities: string[]
  risk_level: RiskLevel
  impact_description: string
  approve_url: string
  reject_url: string
  approval_token: string
  expires_at: number
}

interface ApprovalGateProps {
  pendingAction: PendingAction
}

const RISK_CONFIG: Record<RiskLevel, {
  label: string
  badgeClasses: string
  base: string
  borderColor: string
  Icon: React.ComponentType<{ className?: string }>
}> = {
  low: {
    label: 'Low Risk',
    badgeClasses: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    base: '150',
    borderColor: 'oklch(0.7 0.15 150 / 0.4)',
    Icon: ShieldCheck,
  },
  medium: {
    label: 'Medium Risk',
    badgeClasses: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    base: '80',
    borderColor: 'oklch(0.75 0.15 80 / 0.5)',
    Icon: ShieldAlert,
  },
  high: {
    label: 'High Risk',
    badgeClasses: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    base: '40',
    borderColor: 'oklch(0.7 0.18 40 / 0.55)',
    Icon: ShieldX,
  },
  critical: {
    label: 'Critical',
    badgeClasses: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    base: '20',
    borderColor: 'oklch(0.65 0.22 20 / 0.65)',
    Icon: Skull,
  },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, badgeClasses, Icon } = RISK_CONFIG[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold', badgeClasses)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

export function ApprovalGate({ pendingAction }: ApprovalGateProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'approved' | 'rejected'>('idle')
  const cardRef = useRef<HTMLDivElement>(null)
  const { borderColor, base } = RISK_CONFIG[pendingAction.risk_level]

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const el = cardRef.current
      if (!el) return
      el.style.setProperty('--x', String(e.clientX))
      el.style.setProperty('--y', String(e.clientY))
      el.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', onPointerMove)
    return () => document.removeEventListener('pointermove', onPointerMove)
  }, [])

  async function handleApprove() {
    setStatus('loading')
    await fetch(pendingAction.approve_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envelopeId: pendingAction.envelopeId, approval_token: pendingAction.approval_token }),
    })
    setStatus('approved')
  }

  async function handleReject() {
    setStatus('loading')
    await fetch(pendingAction.reject_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envelopeId: pendingAction.envelopeId }),
    })
    setStatus('rejected')
  }

  if (status === 'approved') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Aprobado — el agente continúa.</p>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-500/10 border border-slate-500/20 px-3 py-2">
        <XCircle className="w-4 h-4 text-slate-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Acción rechazada.</p>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      data-glow-card
      className="relative w-full rounded-xl p-px transition-shadow duration-200 hover:shadow-lg"
      style={{
        '--base': base,
        '--spread': '60',
        backgroundImage: `radial-gradient(200px 200px at calc(var(--x,0)*1px) calc(var(--y,0)*1px), hsl(${base} 80% 65% / 0.08), transparent)`,
        backgroundAttachment: 'fixed',
        border: '1px solid',
        borderColor,
      } as React.CSSProperties}
    >
      <div className="relative rounded-[11px] bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <RiskBadge level={pendingAction.risk_level} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Aprobación requerida
          </span>
        </div>

        <p className="font-mono text-sm font-medium text-slate-800 dark:text-slate-100">
          {pendingAction.tool}
        </p>

        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {pendingAction.impact_description}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Capacidades: {pendingAction.capabilities.join(', ')}
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={status === 'loading'}
            className="bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={status === 'loading'}
            className="border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-400"
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  )
}
