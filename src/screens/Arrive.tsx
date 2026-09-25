import { PressButton } from '../components/PressButton'

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 17) return 'Hi there.'
  if (hour >= 17 && hour < 21) return 'Good evening.'
  return "It's getting late."
}

export function Arrive({ onBegin }: { onBegin: () => void }) {
  const now = new Date()
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="layout">
      <p className="eyebrow">
        <time dateTime={now.toISOString()}>{time}</time>
      </p>
      {/* Copy sits in the top two-thirds: muted text fails AA over the horizon band. */}
      <div className="stack">
        <h1 className="display">{greetingFor(now.getHours())}</h1>
        <p className="lede">Ready to wind down?</p>
      </div>
      <div className="actions">
        <PressButton stage="arrive" onClick={onBegin}>
          Begin
        </PressButton>
        <p className="hint">About four minutes</p>
      </div>
    </div>
  )
}
