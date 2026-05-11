'use client'

import { useEffect } from 'react'

export default function LeaderError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">⚡</div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-800">Leader Dashboard error</h2>
        <p className="mt-1 text-sm text-slate-500">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
      >
        Reintentar
      </button>
    </div>
  )
}
