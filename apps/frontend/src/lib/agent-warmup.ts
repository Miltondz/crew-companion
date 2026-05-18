let lastWarmAt = 0
const WARM_COOLDOWN_MS = 2 * 60 * 1000
let inflight: Promise<{ bff: boolean; agent: boolean }> | null = null

export async function warmAgent(): Promise<{ bff: boolean; agent: boolean }> {
  const now = Date.now()
  if (now - lastWarmAt < WARM_COOLDOWN_MS) return { bff: true, agent: true }
  if (inflight) return inflight
  inflight = fetch('/api/warm', { method: 'GET' })
    .then(r => r.ok ? (r.json() as Promise<{ bff: boolean; agent: boolean }>) : { bff: false, agent: false })
    .catch(() => ({ bff: false, agent: false }))
    .finally(() => { lastWarmAt = Date.now(); inflight = null })
  return inflight
}

export function warmAgentFireAndForget(): void {
  void warmAgent()
}
