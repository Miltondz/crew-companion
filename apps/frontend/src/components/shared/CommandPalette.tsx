'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import type { CrewState } from '@/lib/crew/types'

interface CommandPaletteProps {
  state: CrewState
}

export function CommandPalette({ state }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const go = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, miembros, tareas..." />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Páginas">
          <CommandItem onSelect={() => go('/leader')}>
            <span className="mr-2">⚡</span> Leader Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/docs')}>
            <span className="mr-2">📄</span> Documentos
          </CommandItem>
        </CommandGroup>

        {state.members.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Miembros">
              {state.members.map(m => (
                <CommandItem key={m.id} onSelect={() => go(`/member/${m.id}`)}>
                  <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold">
                    {m.name[0]}
                  </span>
                  {m.name}
                  <span className="ml-auto text-xs capitalize text-slate-400">{m.role}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {state.tasks.filter(t => t.status !== 'done').length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tareas activas">
              {state.tasks.filter(t => t.status !== 'done').slice(0, 6).map(t => (
                <CommandItem
                  key={t.id}
                  onSelect={() => {
                    const member = state.members.find(m => m.id === t.assignedTo)
                    if (member) go(`/member/${member.id}`)
                    else go('/leader')
                  }}
                >
                  <span className={`mr-2 h-2 w-2 rounded-full ${t.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                  {t.title}
                  <span className="ml-auto text-xs text-slate-400">
                    {state.members.find(m => m.id === t.assignedTo)?.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
