import { useSyncExternalStore } from 'react'
import { layoutEngine } from './layout-engine'
import type { LayoutState } from './types'

export function useLayoutEngine(): LayoutState {
  return useSyncExternalStore(
    listener => layoutEngine.subscribe(listener),
    () => layoutEngine.getState(),
    () => layoutEngine.getState(),
  )
}
