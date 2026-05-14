'use client'

import { useState, type ReactNode } from 'react'
import { MessageSquarePlus, MessageSquare, ChevronRight } from 'lucide-react'

interface Props {
  children: ReactNode
  onNewChat?: () => void
}

export function AgentRailRegion({ children, onNewChat }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
          aria-label="Abrir chat"
        >
          <MessageSquare size={14} />
          Chat
        </button>
      )}

      {/* Width-based slide — shrinks to 0 to free layout space */}
      <div
        className="overflow-hidden flex-shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 0 : 380 }}
      >
        <div className="w-[380px] h-full flex flex-col border-l border-slate-200 bg-white shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="text-sm font-medium text-slate-700">Chat</span>
            <div className="flex items-center gap-1">
              {onNewChat && (
                <button
                  onClick={onNewChat}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="New chat"
                >
                  <MessageSquarePlus size={15} />
                </button>
              )}
              <button
                onClick={() => setCollapsed(true)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="collapse"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
