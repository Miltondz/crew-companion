'use client'

import Link from 'next/link'
import { Sparkles, Github, ExternalLink } from 'lucide-react'

export function WebFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--bg-base)]/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Crew Companion</span>
            </Link>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Runtime cognitivo para equipos. La interfaz se adapta a tu rol, urgencia y bloqueadores.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Producto</p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/features" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Features</Link></li>
              <li><Link href="/how-it-works" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Cómo funciona</Link></li>
              <li><Link href="/roadmap" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Roadmap</Link></li>
              <li><Link href="/status" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Estado del sistema</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Recursos</p>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Acerca de</Link></li>
              <li><Link href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Dashboard</Link></li>
              <li><Link href="/docs" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Documentos</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Contacto</p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/Miltondz/crew-companion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  <Github className="w-3 h-3" /> GitHub
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            © {new Date().getFullYear()} Crew Companion · MIT License
          </p>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            Made with Next.js · LangGraph · CopilotKit
          </p>
        </div>
      </div>
    </footer>
  )
}
