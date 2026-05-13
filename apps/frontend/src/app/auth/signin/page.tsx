'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await signIn('resend', {
        email: email.trim(),
        redirect: false,
        callbackUrl,
      })
      setSent(true)
    } catch {
      setError('No pudimos enviarte el link. Verificá tu email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {sent ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl ring-1 ring-emerald-500/30">
            📬
          </div>
          <div>
            <p className="font-semibold text-white">Revisá tu casilla</p>
            <p className="mt-1 text-sm text-slate-400">
              Enviamos un link de acceso a{' '}
              <span className="font-medium text-violet-300">{email}</span>
            </p>
          </div>
          <p className="text-xs text-slate-500">
            El link expira en 10 minutos. Revisá spam si no aparece.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="mt-2 text-xs text-violet-400 underline-offset-2 hover:text-violet-300 hover:underline transition"
          >
            Usar otro email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="mb-4 text-center text-sm text-slate-400">
              Ingresá con un link mágico — sin contraseña.
            </p>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Enviando...
              </span>
            ) : (
              'Enviar link de acceso'
            )}
          </button>
        </form>
      )}
    </>
  )
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl shadow-lg shadow-violet-900/40">
              ✦
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight text-white">Crew Companion</h1>
              <p className="mt-0.5 text-sm text-violet-300">Cognitive Operational Runtime</p>
            </div>
          </div>

          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
          }>
            <SignInForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Solo para miembros del equipo · Crew Companion © 2026
        </p>
      </div>
    </div>
  )
}
