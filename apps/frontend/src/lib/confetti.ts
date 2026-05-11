import confetti from 'canvas-confetti'

export function fireCelebration() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#fff'],
  })
}

export function fireMilestoneConfetti() {
  const duration = 2500
  const end = Date.now() + duration
  const interval = setInterval(() => {
    if (Date.now() > end) { clearInterval(interval); return }
    confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1', '#8b5cf6', '#10b981'] })
    confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#f59e0b', '#ec4899', '#fff'] })
  }, 200)
}
