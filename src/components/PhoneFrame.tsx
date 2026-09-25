import type { ReactNode } from 'react'

// On a phone the app is full-bleed. On desktop it sits in a device-sized frame so
// reviewers see the intended proportions. The switch is pure CSS (see .frame in styles.css).
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="desk">
      <div className="frame">{children}</div>
    </div>
  )
}
