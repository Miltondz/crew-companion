import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 text-zinc-100 px-6">
      <div className="text-center">
        <p className="text-8xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-zinc-200 mb-2">Página no encontrada</h1>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Esta ruta no existe. Quizás el link expiró o la dirección cambió.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-700 hover:border-zinc-600 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Mis proyectos
        </Link>
      </div>
    </div>
  )
}
