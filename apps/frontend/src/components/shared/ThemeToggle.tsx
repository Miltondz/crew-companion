'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className ?? 'flex items-center justify-center rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
