'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

const RISK_STYLES: Record<RiskLevel, string> = {
  low:      'border-green-400  bg-green-50',
  medium:   'border-yellow-400 bg-yellow-50',
  high:     'border-orange-400 bg-orange-50',
  critical: 'border-red-500    bg-red-50',
}

const RISK_BADGE: Record<RiskLevel, { bg: string; label: string }> = {
  low:      { bg: 'bg-green-100  text-green-800',  label: 'Low Risk' },
  medium:   { bg: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' },
  high:     { bg: 'bg-orange-100 text-orange-800', label: 'High Risk' },
  critical: { bg: 'bg-red-100    text-red-800',    label: 'Critical' },
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const { bg, label } = RISK_BADGE[level]
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${bg}`}>{label}</span>
  )
}

export function ApprovalGate({ pendingAction }: ApprovalGateProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'approved' | 'rejected'>('idle')

  async function handleApprove() {
    setStatus('loading')
    await fetch(pendingAction.approve_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envelopeId: pendingAction.envelopeId,
        approval_token: pendingAction.approval_token,
      }),
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
    return <p className="text-green-700 text-sm">Approved — agent resuming.</p>
  }
  if (status === 'rejected') {
    return <p className="text-slate-500 text-sm">Action rejected.</p>
  }

  return (
    <Card className={`border-2 ${RISK_STYLES[pendingAction.risk_level]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <RiskBadge level={pendingAction.risk_level} />
          <h3 className="font-semibold text-sm">Approval required</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          <span className="font-mono font-medium">{pendingAction.tool}</span>
        </p>
        <p className="text-sm text-slate-600">{pendingAction.impact_description}</p>
        <p className="text-xs text-slate-400">
          Capabilities: {pendingAction.capabilities.join(', ')}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={status === 'loading'}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={status === 'loading'}
          >
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
