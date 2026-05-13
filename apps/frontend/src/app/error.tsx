'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  useEffect(() => { console.error('[app-error]', error) }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⚠</div>
        <h1 className="text-lg font-semibold text-white mb-2">Algo salió mal</h1>
        <p className="text-sm text-zinc-400 mb-6">
          {error.message ?? 'Error inesperado. Podés intentar de nuevo o volver al dashboard.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Ir al dashboard
          </button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-zinc-600">ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
