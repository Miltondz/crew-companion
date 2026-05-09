'use client'

interface SurfaceEnvelope {
  type: string
  payload: Record<string, unknown>
}

// Stub: swap each case for the real Gemini-generated component when it arrives.
export function SurfaceRenderer({ envelope }: { envelope: SurfaceEnvelope }) {
  return (
    <div className="my-2 rounded-xl border border-border bg-card p-4 text-sm">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        surface · {envelope.type}
      </p>
      <pre className="overflow-auto whitespace-pre-wrap text-xs text-foreground">
        {JSON.stringify(envelope.payload, null, 2)}
      </pre>
    </div>
  )
}
