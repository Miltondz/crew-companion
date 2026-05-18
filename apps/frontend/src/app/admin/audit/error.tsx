'use client'

import { useEffect } from 'react'

export default function AuditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[audit-error]', error) }, [error])
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30">
        <span className="text-2xl">&#9888;</span>
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Algo salió mal</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {error.message || 'Error inesperado en el audit log.'}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs font-mono text-zinc-600">ref: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
      >
        Reintentar
      </button>
    </div>
  )
}
