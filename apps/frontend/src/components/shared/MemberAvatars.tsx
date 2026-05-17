'use client'

interface Props {
  members: Array<{ id: string; name: string }>
  blockers?: Array<{ memberId: string; resolved: boolean }>
}

export function MemberAvatars({ members, blockers = [] }: Props) {
  if (members.length === 0) return null
  return (
    <div className="flex items-center -space-x-1.5">
      {members.slice(0, 6).map(m => {
        const hasBlocker = blockers.some(b => b.memberId === m.id && !b.resolved)
        return (
          <div
            key={m.id}
            className={`h-6 w-6 rounded-full bg-[var(--phase-glow,#b89450)]/20 border-2 flex items-center justify-center text-[9px] font-bold text-[var(--text-primary)] ${hasBlocker ? 'border-red-400' : 'border-[var(--bg-surface)]'}`}
            title={m.name}
          >
            {m.name[0]?.toUpperCase()}
          </div>
        )
      })}
      {members.length > 6 && (
        <div className="h-6 w-6 rounded-full bg-white/10 border-2 border-[var(--bg-surface)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)]">
          +{members.length - 6}
        </div>
      )}
    </div>
  )
}
