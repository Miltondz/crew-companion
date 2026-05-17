'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Menu, LayoutDashboard, FileText, Flag, LogOut, ChevronDown } from 'lucide-react'

export function WorkspaceNav() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/15 ring-1 ring-white/15 px-2 py-1 text-[10px] font-mono text-[var(--text-primary)] transition shrink-0"
        title="Navegación"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Menu className="w-3 h-3" />
        <ChevronDown className="w-2.5 h-2.5 opacity-60" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg bg-[var(--bg-surface)] border border-white/10 shadow-2xl overflow-hidden"
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/5 transition"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/leader"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/5 transition"
          >
            <Flag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Equipo (Líder)</span>
          </Link>
          <Link
            href="/docs"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-white/5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Documentos</span>
          </Link>
          <div className="border-t border-white/10" />
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/auth/signin' }) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
