'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { CopilotChat } from '@copilotkit/react-core/v2'

interface MobileChatDrawerProps {
  accentClass?: string
  label?: string
}

export function MobileChatDrawer({
  accentClass = 'from-indigo-600 to-violet-600',
  label = 'AI Assistant',
}: MobileChatDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating trigger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className={`md:hidden fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${accentClass} text-xl text-white shadow-xl ring-2 ring-white/20 transition hover:scale-105 active:scale-95`}
        aria-label="Abrir asistente"
      >
        ✦
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-white md:hidden" style={{ maxHeight: '88dvh' }}>
            {/* Drag handle */}
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>

            {/* Header */}
            <div className={`shrink-0 flex items-center gap-3 bg-gradient-to-r ${accentClass} px-4 py-3`}>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 text-sm shadow-inner">✦</div>
              <p className="text-sm font-bold text-white">{label}</p>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs text-white hover:bg-white/25 transition"
              >
                ✕
              </button>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden">
              <CopilotChat className="h-full" />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
