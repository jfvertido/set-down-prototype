import { PressButton } from '../components/PressButton'

export function FadeOut({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="layout">
      <div className="stack center grow">
        <h1 className="display">Goodnight.</h1>
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
