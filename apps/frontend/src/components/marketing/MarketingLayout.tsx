'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight, GitBranch, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/features', label: 'Capacidades' },
  { href: '/how-it-works', label: 'Cómo funciona' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/about', label: 'Acerca de' },
]

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="relative z-50 border-b border-zinc-800/50 backdrop-blur-xl bg-zinc-950/80 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Crew Companion</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    pathname === href
                      ? 'bg-indigo-500/10 text-indigo-300'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white">
              <Link href="/auth/signin">Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-500">
              <Link href="/auth/signin">
                Empezar
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {children}

      <footer className="border-t border-zinc-800/50 py-10 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Crew Companion</span>
            <span className="text-zinc-600 text-xs ml-2">Runtime operacional con IA</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-zinc-300 transition-colors">{label}</Link>
            ))}
            <Link href="/dev" className="hover:text-zinc-300 transition-colors">Demo</Link>
          </div>
          <div className="flex items-center gap-4 text-zinc-600">
            <GitBranch className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
            <MessageSquare className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
            <Clock className="w-4 h-4 hover:text-zinc-300 cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
