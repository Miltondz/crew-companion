'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  message: string | null
  cta?: { label: string; action: string } | null
  onDismiss: () => void
  onCTA?: (action: string) => void
  autoDismissMs?: number
}

export function SpeechBubble({ message, cta, onDismiss, onCTA, autoDismissMs = 8000 }: Props) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(t)
  }, [message, autoDismissMs, onDismiss])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'absolute bottom-full mb-2 left-1/2 -translate-x-1/2',
            'w-52 rounded-xl bg-zinc-800 border border-zinc-700 p-3 shadow-xl',
            'text-xs text-zinc-200 z-50'
          )}
        >
          {/* tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-800 border-r border-b border-zinc-700 rotate-45" />

          <button
            onClick={onDismiss}
            className="absolute top-1.5 right-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="cerrar"
          >
            <X className="w-3 h-3" />
          </button>

          <p className="pr-4 leading-relaxed">{message}</p>

          {cta && (
            <button
              onClick={() => onCTA?.(cta.action)}
              className="mt-2 w-full text-center text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20"
            >
              {cta.label}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
