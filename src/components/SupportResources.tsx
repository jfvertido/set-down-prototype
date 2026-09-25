import { useEffect, useRef } from 'react'
import { PressButton } from './PressButton'

// Shown instead of the parked list when crisis language is detected. No AI is involved in
// this screen, and it gives no advice: it points to people who can help, right now.
export function SupportResources({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  // Move focus here so VoiceOver reads this screen first, not whatever was focused before.
  useEffect(() => heading.current?.focus(), [])

  return (
    <>
      <h1 ref={heading} tabIndex={-1} className="title">
        You don't have to hold this alone tonight.
      </h1>
      <p className="lede">
        What you wrote sounds heavy. If you're thinking about ending your life or hurting yourself, you can talk to
        someone right now.
      </p>
      <ul className="resources">
        <li>
          <strong>988 Suicide &amp; Crisis Lifeline</strong>
          <span>Call or text 988, any time (US).</span>
        </li>
        <li>
          <strong>Crisis Text Line</strong>
          <span>Text HOME to 741741 (US).</span>
        </li>
        <li>
          <strong>Outside the US</strong>
          <span>
            Find a local line at <a href="https://findahelpline.com">findahelpline.com</a>.
          </span>
        </li>
      </ul>
      <p className="hint-left">If you're in immediate danger, call 911.</p>
      <div className="actions">
        <a className="btn primary" href="tel:988">
          Call 988
        </a>
        <a className="btn quiet" href="sms:988">
          Text 988
        </a>
        <PressButton stage="park" variant="quiet" type="button" onClick={onBack}>
          Go back to what I wrote
        </PressButton>
        <PressButton stage="park" variant="quiet" type="button" onClick={onContinue}>
          Continue to breathing
        </PressButton>
      </div>
    </>
  )
}
