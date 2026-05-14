'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { LogOut, Moon, Sun, Globe, Home, ChevronDown } from 'lucide-react'
import { useLocale } from '@/lib/i18n'

export function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const name = session?.user?.name ?? 'Usuario'
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold flex-shrink-0">
          {initials}
        </span>
        <span className="max-w-[80px] truncate hidden sm:block">{name}</span>
        <ChevronDown size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-[100] w-52 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden text-sm">
          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
            <p className="font-semibold text-slate-700 truncate">{name}</p>
            <p className="text-[11px] text-slate-400 truncate">{session?.user?.email ?? ''}</p>
          </div>

          <button
            onClick={() => { router.push('/'); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors text-left"
          >
            <Home size={14} />
            Volver al inicio
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors text-left"
            >
              {resolvedTheme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          )}

          <button
            onClick={() => { setLocale(locale === 'es' ? 'en' : 'es'); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors text-left"
          >
            <Globe size={14} />
            {locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          </button>

          <div className="border-t border-slate-100">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
