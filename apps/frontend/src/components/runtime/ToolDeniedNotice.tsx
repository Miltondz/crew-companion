'use client'

import { useState } from 'react'

interface ToolDeniedNoticeProps {
  tool: string
  reason: string
  capabilities?: string[]
  phase?: string
}

export function ToolDeniedNotice({ tool, reason, capabilities, phase }: ToolDeniedNoticeProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex-1 space-y-1">
        <p className="font-medium text-slate-700">
          Action denied: <span className="font-mono">{tool}</span>
        </p>
        <p className="text-xs text-slate-500">
          {reason}{phase ? ` (phase: ${phase})` : ''}
          {capabilities && capabilities.length > 0 && (
            <> · requires: {capabilities.join(', ')}</>
          )}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-600 text-xs leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
