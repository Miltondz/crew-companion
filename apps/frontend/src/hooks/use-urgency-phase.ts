// Phase is always derived from milestone deadline — never stored in the store.
// This hook is intentionally empty; callers should use getUrgencyPhase(deadline) directly.
export function useUrgencyPhaseSync(): void {}
