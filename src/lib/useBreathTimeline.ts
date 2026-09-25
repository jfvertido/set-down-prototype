import { useEffect, useRef, useState } from 'react'
import { breath } from '../design/tokens'

export type BreathPhase = 'in' | 'hold' | 'out'

export const phaseLabel: Record<BreathPhase, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
}

export const cycleMs = breath.inhaleMs + breath.holdMs + breath.exhaleMs

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

/**
 * Drives the 4-7-8 routine. Each run schedules every remaining event up front against one
 * start time, so the timings don't drift the way chained timeouts would over 76 seconds.
 *
 * `phase` moves the circle. `label` changes half a crossfade early, so the label's
 * crossfade is centered on the moment the circle changes direction.
 *
 * Browsers stop animation frames on hidden pages but keep firing timers, so a locked phone
 * would come back to a circle that's out of step with its label. Instead the routine pauses
 * while hidden and restarts the unfinished breath when the page is visible again.
 */
export function useBreathTimeline(startDelayMs: number, onDone: () => void) {
  // null = resting at the smallest size, before an inhale starts.
  const [phase, setPhase] = useState<BreathPhase | null>(null)
  const [label, setLabel] = useState<BreathPhase>('in')
  const [completed, setCompleted] = useState(0)
  const [visible, setVisible] = useState(isVisible)

  const completedRef = useRef(0)
  const startedRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const update = () => setVisible(isVisible())
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  useEffect(() => {
    if (!visible) {
      setPhase(null)
      setLabel('in')
      return
    }

    const delay = startedRef.current ? breath.resumeDelayMs : startDelayMs
    const from = completedRef.current
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, delay + ms))
    const lead = breath.labelCrossfadeMs / 2

    for (let c = from; c < breath.cycles; c++) {
      const start = (c - from) * cycleMs
      const hold = start + breath.inhaleMs
      const out = hold + breath.holdMs
      const end = start + cycleMs

      at(start, () => {
        startedRef.current = true
        setPhase('in')
      })
      at(hold, () => setPhase('hold'))
      at(out, () => setPhase('out'))
      at(end, () => {
        completedRef.current = c + 1
        setCompleted(c + 1)
      })

      // Each run begins with "Breathe in" already showing.
      if (c > from) at(start - lead, () => setLabel('in'))
      at(hold - lead, () => setLabel('hold'))
      at(out - lead, () => setLabel('out'))
    }
    at((breath.cycles - from) * cycleMs, () => onDoneRef.current())

    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [visible, startDelayMs])

  return { phase, label, completed }
}
