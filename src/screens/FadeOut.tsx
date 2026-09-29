import { PressButton } from '../components/PressButton'
import { focusScreen } from '../lib/focus'

export function FadeOut({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="layout">
      <div className="stack center grow">
        <h1 className="display" tabIndex={-1} ref={focusScreen}>
          Goodnight.
        </h1>
      </div>
      {/* Stays visible at the contrast floor so VoiceOver and keyboard users can always find it. */}
      <div className="actions">
        <PressButton stage="rest" variant="quiet" onClick={onRestart}>
          Start over
        </PressButton>
      </div>
    </div>
  )
}
