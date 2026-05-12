import type { ComponentType } from 'react'
import type { CompanionEvent } from './EventBus'

export type PropPosition = 'ground-left' | 'ground-center' | 'ground-right' | 'sky'

export interface HabitatPropProps {
  id: string
  instanceId: string
}

export interface HabitatPropDefinition {
  id: string
  triggerEvent: CompanionEvent['type']
  removedBy?: CompanionEvent['type']
  component: ComponentType<HabitatPropProps>
  position: PropPosition
  maxInstances: number
}

export interface ActiveProp {
  definitionId: string
  instanceId: string
  position: PropPosition
  component: ComponentType<HabitatPropProps>
  createdAt: number
}

class HabitatPropRegistryClass {
  private definitions = new Map<string, HabitatPropDefinition>()
  private activeProps: ActiveProp[] = []
  private listeners = new Set<() => void>()

  register(def: HabitatPropDefinition): void {
    this.definitions.set(def.id, def)
  }

  handleEvent(eventType: CompanionEvent['type']): void {
    let changed = false

    // Remove props whose removedBy matches
    const before = this.activeProps.length
    this.activeProps = this.activeProps.filter(p => {
      const def = this.definitions.get(p.definitionId)
      return def?.removedBy !== eventType
    })
    if (this.activeProps.length !== before) changed = true

    // Add props whose triggerEvent matches
    for (const def of this.definitions.values()) {
      if (def.triggerEvent !== eventType) continue
      const current = this.activeProps.filter(p => p.definitionId === def.id).length
      if (current >= def.maxInstances) continue
      this.activeProps.push({
        definitionId: def.id,
        instanceId: `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        position: def.position,
        component: def.component,
        createdAt: Date.now(),
      })
      changed = true
    }

    if (changed) this.listeners.forEach(fn => fn())
  }

  getActiveProps(): ActiveProp[] {
    return this.activeProps
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const habitatPropRegistry = new HabitatPropRegistryClass()
