import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { PhoneFrame } from './components/PhoneFrame'
import { Arrive } from './screens/Arrive'
import { BrainDump } from './screens/BrainDump'
import { Breathe } from './screens/Breathe'
import { FadeOut } from './screens/FadeOut'
import { cssEase, dusk, exitFor, restDim, stageOrder, stages, type StageId } from './design/tokens'

// Dev only: ?stage=breathe jumps straight to a stage, and ?motion=reduce forces reduced motion.
// Both exist for testing and screen recordings.
const devParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null

function initialStage(): StageId {
  const q = devParams?.get('stage')
  return stageOrder.includes(q as StageId) ? (q as StageId) : 'arrive'
}

const reducedMotion = devParams?.get('motion') === 'reduce' ? 'always' : 'user'

export function App() {
  const [stage, setStage] = useState<StageId>(initialStage)
  const [dimmed, setDimmed] = useState(false)
  const t = stages[stage]

  // Goodnight holds briefly at the breathe colors, then the 60s dim begins.
  useEffect(() => {
    if (stage !== 'rest') return setDimmed(false)
    const id = window.setTimeout(() => setDimmed(true), restDim.holdMs)
    return () => window.clearTimeout(id)
  }, [stage])

  const bg = dimmed ? restDim.bg : t.bg
  const text = dimmed ? restDim.text : t.text
  const colorMs = dimmed ? restDim.durationMs : t.screen
  const colorEase = cssEase(dimmed ? restDim.ease : t.ease)

  return (
    // "user" makes Motion honor prefers-reduced-motion for transforms automatically.
    <MotionConfig reducedMotion={reducedMotion}>
      <PhoneFrame>
        <div
          className="screen"
          style={{
            ['--bg' as string]: bg,
            ['--text' as string]: text,
            ['--muted' as string]: dimmed ? restDim.text : t.muted,
            // Stage colors ease on the incoming stage's clock. The vars are registered as <color>
            // in styles.css so they can transition, and CSS interpolates them in Oklab, which keeps
            // the long dim looking even instead of front-loaded.
            transition: ['--bg', '--text', '--muted'].map((v) => `${v} ${colorMs}ms ${colorEase}`).join(', '),
          }}
        >
          <div
            className="dusk"
            aria-hidden="true"
            style={{
              opacity: stage === 'arrive' ? 1 : 0,
              backgroundImage: `linear-gradient(180deg, ${dusk.top} 0%, ${dusk.mid} 55%, ${dusk.horizon} 100%)`,
              animationDuration: `${dusk.driftMs}ms`,
              transition: `opacity ${stages.park.screen}ms ${cssEase(stages.park.ease)}`,
            }}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              key={stage}
              className="stage"
              initial={{ opacity: 0, y: t.travel }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: t.screen / 1000, ease: t.ease },
              }}
              exit={{ opacity: 0, transition: exitFor(stage) }}
            >
              {stage === 'arrive' && <Arrive onBegin={() => setStage('park')} />}
              {stage === 'park' && <BrainDump onDone={() => setStage('breathe')} />}
              {stage === 'breathe' && <Breathe onDone={() => setStage('rest')} />}
              {stage === 'rest' && <FadeOut onRestart={() => setStage('arrive')} />}
            </motion.main>
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </MotionConfig>
  )
}
