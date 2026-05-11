'use client'

import { motion, AnimatePresence } from 'motion/react'
import type { ActivityEvent } from '@/lib/activity'

interface ActivityStreamProps {
  events: ActivityEvent[]
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 5)  return 'ahora'
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

export function ActivityStream({ events }: ActivityStreamProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="text-2xl">📡</span>
        <p className="text-xs text-slate-400">Sin actividad reciente</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {events.map(ev => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -8, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <span className="mt-0.5 shrink-0 text-base leading-none">{ev.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-700 leading-snug">{ev.message}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(ev.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
