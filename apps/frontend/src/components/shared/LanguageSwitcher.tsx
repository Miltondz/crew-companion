'use client'

import { useLocale } from '@/lib/i18n'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const next = locale === 'es' ? 'en' : 'es'
  return (
    <button
      onClick={() => setLocale(next)}
      className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors ${className ?? ''}`}
      aria-label={`Switch to ${next.toUpperCase()}`}
    >
      {locale.toUpperCase()}
    </button>
  )
}
