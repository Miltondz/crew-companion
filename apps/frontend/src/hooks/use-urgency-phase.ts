import { useEffect } from 'react'
import { useCrewStore } from '@/lib/crew/store'
import { getUrgencyPhase } from '@/lib/crew/derive'

export function useUrgencyPhaseSync() {
  const { milestones, activeMilestoneId, setUrgencyPhase } = useCrewStore()

  useEffect(() => {
    const sync = () => {
      const active = milestones.find((m) => m.id === activeMilestoneId)
      if (active) setUrgencyPhase(getUrgencyPhase(active.deadline))
    }
    sync()
    const interval = setInterval(sync, 30_000)
    return () => clearInterval(interval)
  }, [milestones, activeMilestoneId, setUrgencyPhase])
}
