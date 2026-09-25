import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react'
import { PressButton } from '../components/PressButton'
import { breath, cssEase, stages } from '../design/tokens'
import { phaseLabel, useBreathTimeline } from '../lib/useBreathTimeline'

const t = stages.breathe

export function Breathe({ onDone }: { onDone: () => void }) {
  // Reads MotionConfig, so it follows the OS setting (and the dev ?motion=reduce override).
  const reduce = useReducedMotionConfig()
  // Wait for the screen to finish arriving before the first inhale.
  const { phase, label, completed } = useBreathTimeline(t.screen, onDone)

  const full = phase === 'in' || phase === 'hold'
  const duration = phase === 'in' ? breath.inhaleMs : phase === 'out' ? breath.exhaleMs : 0
  const transition = { duration: duration / 1000, ease: breath.ease }
  const half = breath.labelCrossfadeMs / 2 / 1000

  return (
    <div className="layout">
      <div className="stack center grow">
        {reduce ? (
          // Reduced motion: nothing grows toward the viewer. The same rhythm plays as an opacity pulse.
          <motion.div
            className="breath"
            aria-hidden="true"
            initial={{ opacity: breath.opacityMin }}
            animate={{ opacity: full ? breath.opacityMax : breath.opacityMin }}
            transition={transition}
          />
        ) : (
          <motion.div
            className="breath"
            aria-hidden="true"
            initial={{ scale: breath.scaleMin }}
            animate={{ scale: full ? breath.scaleMax : breath.scaleMin }}
            transition={transition}
          />
        )}

        {/* The live region stays mounted; only its contents swap, so VoiceOver announces each phase. */}
        <div className="phase-slot" aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={label}
              className="phase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: half, ease: breath.ease } }}
              exit={{ opacity: 0, transition: { duration: half, ease: breath.ease } }}
            >
              {phaseLabel[label]}
            </motion.p>
          </AnimatePresence>
        </div>

        <ol className="dots" aria-label={`Breath ${Math.min(completed + 1, breath.cycles)} of ${breath.cycles}`}>
          {Array.from({ length: breath.cycles }, (_, i) => (
            <li key={i} data-done={i < completed} style={{ transition: `background-color ${t.standard}ms ${cssEase(t.ease)}` }} />
          ))}
        </ol>
      </div>
      <div className="actions">
        <PressButton stage="breathe" variant="quiet" onClick={onDone}>
          Skip ahead
        </PressButton>
      </div>
    </div>
  )
}
