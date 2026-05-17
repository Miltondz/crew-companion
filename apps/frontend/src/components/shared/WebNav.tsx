'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Sparkles, ArrowRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

interface Props {
  user?: { name?: string | null; email?: string | null }
}

export function WebNav({ user }: Props) {
  const { t } = useLocale()
  const isAuthed = !!user

  return (
    <nav className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-[var(--bg-base)]/80 sticky top-0">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={isAuthed ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Crew Companion</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/features" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">{t.nav.features}</Link>
          <Link href="/how-it-works" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">{t.nav.howItWorks}</Link>
          <Link href="/roadmap" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">{t.nav.roadmap}</Link>
          <Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">{t.nav.about}</Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          {isAuthed ? (
            <>
              <span className="hidden sm:inline text-xs text-[var(--text-muted)] truncate max-w-[160px]">
                {user.name || user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <Link href="/auth/signin">{t.nav.signIn}</Link>
              </Button>
              <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-500">
                <Link href="/auth/signin">
                  {t.nav.getStarted}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
