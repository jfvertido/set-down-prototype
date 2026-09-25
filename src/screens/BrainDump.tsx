import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { PressButton } from '../components/PressButton'
import { SupportResources } from '../components/SupportResources'
import { requestPark } from '../lib/park'
import { maxInputChars, type ParkResponse } from '../lib/parkTypes'
import { stages } from '../design/tokens'

const t = stages.park
const exit = { opacity: 0, transition: { duration: t.standard / 1000, ease: t.ease } }
const enter = {
  initial: { opacity: 0, y: t.travel },
  animate: { opacity: 1, y: 0, transition: { duration: t.screen / 1000, ease: t.ease } },
}

type View = { name: 'write' } | { name: 'parking' } | { name: 'result'; result: ParkResponse }

export function BrainDump({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('')
  const [view, setView] = useState<View>({ name: 'write' })
  const fieldId = useId()

  const writing = view.name === 'write' || view.name === 'parking'
  const parking = view.name === 'parking'
  const result = view.name === 'result' ? view.result : null

  async function submit() {
    setView({ name: 'parking' })
    setView({ name: 'result', result: await requestPark(text) })
  }

  return (
    <div className="layout">
      <AnimatePresence mode="wait" initial={false}>
        {writing && (
          <motion.form
            key="write"
            className="stack grow"
            exit={exit}
            aria-busy={parking}
            onSubmit={(e) => {
              e.preventDefault()
              if (!parking) submit()
            }}
          >
            <label htmlFor={fieldId} className="title">
              What's still on your mind?
            </label>
            <textarea
              id={fieldId}
              className="field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Anything at all. It doesn't need to be tidy."
              maxLength={maxInputChars}
              readOnly={parking}
              rows={6}
            />
            <div className="actions">
              <PressButton stage="park" type="submit" disabled={!text.trim() || parking}>
                {parking ? 'Parking…' : 'Park it'}
              </PressButton>
              <PressButton stage="park" variant="quiet" type="button" onClick={onDone} disabled={parking}>
                Skip
              </PressButton>
            </div>
          </motion.form>
        )}

        {result?.kind === 'parked' && (
          <motion.section key="parked" className="stack grow" aria-labelledby="parked-title" {...enter}>
            <h1 id="parked-title" className="title">
              Parked for tomorrow
            </h1>
            {result.items.length > 0 && (
              <ul className="parked">
                {result.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            <p className="lede" role="status">
              {result.acknowledgment}
            </p>
            <div className="actions">
              <PressButton stage="park" onClick={onDone}>
                Continue
              </PressButton>
            </div>
          </motion.section>
        )}

        {result?.kind === 'crisis' && (
          <motion.section key="support" className="stack grow" {...enter}>
            <SupportResources onBack={() => setView({ name: 'write' })} onContinue={onDone} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
