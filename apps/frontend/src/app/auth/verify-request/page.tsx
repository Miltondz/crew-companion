export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 p-4">
      <div className="relative w-full max-w-sm text-center">
        <div className="rounded-2xl border border-white/10 bg-white/8 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-4xl ring-1 ring-violet-500/30 mx-auto">
            📬
          </div>
          <h1 className="text-xl font-bold text-white">Revisá tu casilla</h1>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Te enviamos un link de acceso. Hacé clic en él para ingresar.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            El link expira en 10 minutos. Revisá spam si no aparece.
          </p>
          <a
            href="/auth/signin"
            className="mt-8 inline-block rounded-xl border border-white/10 bg-white/8 px-6 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-white/15 hover:text-white"
          >
            ← Volver
          </a>
        </div>
      </div>
    </div>
  )
}
