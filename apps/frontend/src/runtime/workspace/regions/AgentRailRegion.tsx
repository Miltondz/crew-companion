'use client'

import type { ReactNode } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { Habitat, type HabitatComponentProps } from '@/components/companion/Habitat'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import type { UrgencyPhase } from '@/lib/crew/types'

interface Props {
  children: ReactNode
  onNewChat?: () => void
  user?: { name: string; role: string; avatar?: string }
  phase?: UrgencyPhase
  mascotProps?: Omit<HabitatComponentProps, 'sidebar'>
}

export function AgentRailRegion({ children, onNewChat, user, phase, mascotProps }: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[50px] flex items-center gap-2 px-3 border-b border-white/10 shrink-0">
        {user?.avatar && (
          <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
        )}
        {!user?.avatar && user?.name && (
          <div className="h-7 w-7 rounded-full bg-[var(--phase-glow,#b89450)]/20 flex items-center justify-center text-[11px] font-bold text-[var(--text-primary)] shrink-0">
            {user.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate text-[var(--text-primary)]">{user?.name ?? 'Usuario'}</p>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.role ?? ''}</p>
        </div>
        <ThemeToggle />
      </div>

      {mascotProps && (
        <div className="h-[200px] shrink-0 flex flex-col items-center justify-center border-b border-white/10 relative overflow-hidden">
          <Habitat sidebar {...mascotProps} phase={mascotProps.phase ?? phase ?? 'normal'} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Asistente
          </span>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Nuevo chat"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
