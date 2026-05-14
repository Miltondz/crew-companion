'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, MessageSquarePlus } from 'lucide-react'

interface Props {
  children: ReactNode
  habitat?: ReactNode
  onNewChat?: () => void
}

export function AgentRailRegion({ children, habitat, onNewChat }: Props) {
  const [chatCollapsed, setChatCollapsed] = useState(false)

  return (
    <div className="workspace-region workspace-region--agent-rail flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl">
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
            onClick={() => setChatCollapsed(c => !c)}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label={chatCollapsed ? 'expand' : 'collapse'}
          >
            {chatCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>
      {!chatCollapsed && (
        <div className="flex-1 overflow-hidden min-h-0">
          {children}
        </div>
      )}
      {habitat && (
        <div className="shrink-0 border-t border-slate-200 flex justify-center p-2">
          {habitat}
        </div>
      )}
    </div>
  )
}
