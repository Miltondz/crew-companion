'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import type { SurfaceProps } from '@/runtime/surface-registry/types'
import type { AmbientOverlayWidgetPayload } from './manifest'

export default function AmbientOverlayWidget({ payload }: SurfaceProps<AmbientOverlayWidgetPayload>) {
  const message = typeof payload?.message === 'string' ? payload.message : ''
  const action = payload?.action
  const autoDismissSeconds = payload?.autoDismissSeconds
  const icon = payload?.icon ?? '💡'
  const [secondsLeft, setSecondsLeft] = useState(autoDismissSeconds ?? null)
  const [hovered, setHovered] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!autoDismissSeconds) return
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(id)
          setDismissed(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [autoDismissSeconds])

  if (dismissed || !message) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="max-w-xs rounded-xl shadow-lg border border-slate-200 bg-white">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{icon}</span>
            <p className="text-xs text-slate-700 truncate flex-1">{message}</p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {secondsLeft !== null && (
              <span className="text-xs text-slate-400">se cierra en {secondsLeft}s</span>
            )}
            {action && (
              <button
                onClick={() => action.url ? window.open(action.url) : undefined}
                className="rounded-lg bg-indigo-100 text-indigo-700 text-xs px-2 py-1 hover:bg-indigo-200 transition-colors ml-auto"
              >
                {action.label}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {hovered && (
        <div className="absolute bottom-full left-0 mb-2 max-w-xs w-max bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-10">
          {message}
        </div>
      )}
    </div>
  )
}
