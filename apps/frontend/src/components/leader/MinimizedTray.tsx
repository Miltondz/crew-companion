'use client'

import { motion, AnimatePresence } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

type ColorToken = 'indigo' | 'blue' | 'emerald' | 'violet' | 'amber' | 'slate'

const PILL_STYLES: Record<ColorToken, string> = {
  indigo:  'bg-indigo-100/80 text-indigo-700 ring-indigo-200  hover:bg-indigo-100',
  blue:    'bg-blue-100/80   text-blue-700   ring-blue-200    hover:bg-blue-100',
  emerald: 'bg-emerald-100/80 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  violet:  'bg-violet-100/80 text-violet-700  ring-violet-200  hover:bg-violet-100',
  amber:   'bg-amber-100/80  text-amber-700   ring-amber-200   hover:bg-amber-100',
  slate:   'bg-slate-100/80  text-slate-600   ring-slate-200   hover:bg-slate-100',
}

export interface MinimizedSection {
  id: string
  title: string
  color: ColorToken
  Icon: LucideIcon
  summary: React.ReactNode
}

interface MinimizedTrayProps {
  sections: MinimizedSection[]
  onRestore: (id: string) => void
}

export function MinimizedTray({ sections, onRestore }: MinimizedTrayProps) {
  return (
    <AnimatePresence>
      {sections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden mb-3"
        >
          <div className="flex flex-wrap gap-2">
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
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
