'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function DarkModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex items-center justify-center rounded-full bg-white/15 p-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/25 ring-1 ring-white/20 ${className ?? ''}`}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
