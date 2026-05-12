'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { habitatPropRegistry } from '@/runtime/companion'
import type { ActiveProp } from '@/runtime/companion'
import type { HabitatPropProps } from '@/runtime/companion'

// --- Built-in prop components ---

function BlockerRock({ instanceId }: HabitatPropProps) {
  return (
    <motion.div
      key={instanceId}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="text-[16px] select-none"
      title="Blocker activo"
    >
      🪨
    </motion.div>
  )
}

function MilestoneTrophy({ instanceId }: HabitatPropProps) {
  return (
    <motion.div
      key={instanceId}
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.3, 1], rotate: [0, -10, 10, 0] }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="text-[18px] select-none"
      title="Milestone completado"
    >
      🏆
    </motion.div>
  )
}

function DeadlineClock({ instanceId }: HabitatPropProps) {
  return (
    <motion.div
      key={instanceId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: [1, 1.1, 1] }}
      transition={{ scale: { repeat: Infinity, duration: 1.5 } }}
      exit={{ opacity: 0 }}
      className="text-[14px] select-none"
      title="Deadline próximo"
    >
      ⏳
    </motion.div>
  )
}

function PanicFlame({ instanceId }: HabitatPropProps) {
  return (
    <motion.div
      key={instanceId}
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: [0, -3, 0], opacity: 1 }}
      transition={{ y: { repeat: Infinity, duration: 0.8 } }}
      exit={{ y: 12, opacity: 0 }}
      className="text-[14px] select-none"
      title="Fase pánico"
    >
      🔥
    </motion.div>
  )
}

// Register built-in props
habitatPropRegistry.register({
  id: 'blocker_rock',
  triggerEvent: 'BLOCKER_CREATED',
  removedBy: 'BLOCKER_RESOLVED',
  component: BlockerRock,
  position: 'ground-left',
  maxInstances: 3,
})

habitatPropRegistry.register({
  id: 'milestone_trophy',
  triggerEvent: 'MILESTONE_COMPLETE',
  component: MilestoneTrophy,
  position: 'ground-right',
  maxInstances: 1,
})

habitatPropRegistry.register({
  id: 'deadline_clock',
  triggerEvent: 'DEADLINE_APPROACHING',
  component: DeadlineClock,
  position: 'ground-center',
  maxInstances: 1,
})

habitatPropRegistry.register({
  id: 'panic_flame',
  triggerEvent: 'PHASE_CHANGE',
  component: PanicFlame,
  position: 'ground-left',
  maxInstances: 2,
})

// --- Renderer ---

const POSITION_CLASSES: Record<string, string> = {
  'ground-left':   'bottom-10 left-3',
  'ground-center': 'bottom-10 left-1/2 -translate-x-1/2',
  'ground-right':  'bottom-10 right-3',
  'sky':           'top-4 left-1/2 -translate-x-1/2',
}

function snapshot(): ActiveProp[] {
  return habitatPropRegistry.getActiveProps()
}

function subscribe(cb: () => void): () => void {
  return habitatPropRegistry.subscribe(cb)
}

export function HabitatProps() {
  const props = useSyncExternalStore(subscribe, snapshot, () => [] as ActiveProp[])

  return (
    <AnimatePresence>
      {props.map(p => {
        const Comp = p.component
        return (
          <div
            key={p.instanceId}
            className={`absolute ${POSITION_CLASSES[p.position] ?? POSITION_CLASSES['ground-left']}`}
          >
            <Comp id={p.definitionId} instanceId={p.instanceId} />
          </div>
        )
      })}
    </AnimatePresence>
  )
}
