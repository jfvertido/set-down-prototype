// Screens swap in place, so the button someone just pressed disappears and focus falls back to
// <body>. VoiceOver then loses its place or starts again from the top. Instead, each screen moves
// focus to its heading when it appears. These are ref callbacks with a stable identity, so React
// calls them once when the element mounts, not on every render.

let firstScreen = true

/** For a stage's main heading. Skips the first screen of a page load, so the page doesn't grab focus before anyone has touched it. */
export function focusScreen(el: HTMLElement | null) {
  if (!el) return
  if (firstScreen) {
    firstScreen = false
    return
  }
  el.focus({ preventScroll: true })
}

/** For a heading that appears within a screen, after something the person did. */
export function focusOnMount(el: HTMLElement | null) {
  el?.focus({ preventScroll: true })
}
