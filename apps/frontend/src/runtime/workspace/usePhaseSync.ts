import { useEffect, useRef } from 'react'
import { layoutEngine } from './layout-engine'
import type { UrgencyPhase } from '@/lib/crew/types'

export function usePhaseSync(phase: UrgencyPhase): void {
  const prevRef = useRef<UrgencyPhase>(phase)
  useEffect(() => {
    if (prevRef.current !== phase) {
      layoutEngine.onPhaseChange(prevRef.current, phase)
      prevRef.current = phase
    }
  }, [phase])
}
