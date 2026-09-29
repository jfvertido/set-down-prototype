// iOS doesn't shrink the page when the keyboard opens, so on Brain dump it covered "Park it".
// Fit the frame to the visible area instead (see .frame in styles.css): it shrinks while the
// keyboard is up, and the actions sit just above it.

export function fitToVisibleArea() {
  const vv = window.visualViewport
  if (!vv) return

  const root = document.documentElement.style
  const update = () => {
    root.setProperty('--visible-top', `${vv.offsetTop}px`)
    root.setProperty('--visible-height', `${vv.height}px`)
  }

  update()
  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
}
