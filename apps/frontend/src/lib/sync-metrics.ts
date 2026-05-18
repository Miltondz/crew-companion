// In-memory rolling 24h counter. Per-instance: resets on cold start;
// Vercel may run multiple warm instances — /status numbers are approximate.
// For accurate metrics use audit_log table or Redis incr.
const DAY_MS = 86_400_000

interface Counters {
  success: number
  fail: number
  conflict: number
  since: number
}

function makeCounters(): Counters {
  return { success: 0, fail: 0, conflict: 0, since: Date.now() }
}

let state: Counters = makeCounters()

function maybeReset() {
  if (Date.now() - state.since >= DAY_MS) {
    state = makeCounters()
  }
}

export const syncMetrics = {
  success() { maybeReset(); state.success++ },
  fail()    { maybeReset(); state.fail++ },
  conflict(){ maybeReset(); state.conflict++ },
  snapshot(): Counters { maybeReset(); return { ...state } },
}
