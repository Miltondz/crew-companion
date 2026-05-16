'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useDroppable } from '@dnd-kit/core'
import type { LucideIcon } from 'lucide-react'

export type MinimizedSectionColor = 'indigo' | 'blue' | 'emerald' | 'violet' | 'amber' | 'slate' | 'cyan' | 'ember' | 'red' | 'teal' | 'green'

const PILL_STYLES: Record<MinimizedSectionColor, string> = {
  indigo:  'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20 hover:bg-indigo-500/20',
  blue:    'bg-blue-500/10   text-blue-400   ring-blue-500/20   hover:bg-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 hover:bg-emerald-500/20',
  violet:  'bg-violet-500/10 text-violet-400  ring-violet-500/20 hover:bg-violet-500/20',
  amber:   'bg-amber-500/10  text-amber-400   ring-amber-500/20  hover:bg-amber-500/20',
  slate:   'bg-white/5       text-[var(--text-muted)] ring-white/10 hover:bg-white/10',
  cyan:    'bg-cyan-500/10   text-cyan-400    ring-cyan-500/20   hover:bg-cyan-500/20',
  ember:   'bg-orange-500/10 text-orange-400  ring-orange-500/20 hover:bg-orange-500/20',
  red:     'bg-red-500/10    text-red-400     ring-red-500/20    hover:bg-red-500/20',
  teal:    'bg-teal-500/10   text-teal-400    ring-teal-500/20   hover:bg-teal-500/20',
  green:   'bg-green-500/10  text-green-400   ring-green-500/20  hover:bg-green-500/20',
}

export interface MinimizedSection {
  id: string
  title: string
  color: MinimizedSectionColor
  Icon: LucideIcon
  summary: React.ReactNode
}

interface MinimizedTrayProps {
  sections: MinimizedSection[]
  onRestore: (id: string) => void
}

export function MinimizedTray({ sections, onRestore }: MinimizedTrayProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'ribbon-drop-zone' })

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 border-t border-white/10 min-h-[40px] transition-colors',
        isOver
          ? 'bg-[var(--phase-glow,#b89450)]/10 border-[var(--phase-glow,#b89450)]/30'
          : 'bg-[var(--bg-surface)]',
      ].join(' ')}
    >
      {sections.length === 0 && (
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          {isOver ? 'Soltar para minimizar' : 'Arrastra una sección aquí'}
        </span>
      )}

      <AnimatePresence>
        {sections.map(({ id, title, color, Icon, summary }) => (
          <motion.button
            key={id}
            layout
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onRestore(id)}
            className={[
              'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              'ring-1 transition-colors cursor-pointer select-none',
              PILL_STYLES[color],
            ].join(' ')}
            title={`Restaurar ${title}`}
          >
            <Icon size={11} className="shrink-0" />
            <span className="shrink-0">{title}</span>
            {summary && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-normal opacity-75">{summary}</span>
              </>
            )}
            <span className="ml-1 opacity-40 text-[10px]">↑</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
