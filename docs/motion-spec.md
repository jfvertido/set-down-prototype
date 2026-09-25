# Set Down motion spec

Draft 1, 2026-09-24. The numbers here are mirrored in `src/design/tokens.ts`; change both together. The screens, including the parking, crisis support and resuming states, and a spec card for each are in [design/set-down.pen](../design/set-down.pen). An earlier version is in [Figma](https://www.figma.com/design/LW6t6B0wYDiSXYYv2KCS4S).

## The idea

The UI goes to sleep with you. Every step of the routine is a little slower, a little dimmer, a little warmer and a little emptier than the one before it, so by the last screen there's one word on a near-black background and nothing is moving.

To make that feel deliberate rather than just "slow," four things change together at each step. The motion slows down, the easing stops announcing arrivals, elements travel shorter distances, and the light drops and warms. If only one of these changed, the effect would read as lag. When all four move together, it reads as the app settling.

## The four stages

| | Arrive | Brain dump | Breathe | Fade out |
|---|---|---|---|---|
| Tempo multiplier | 1.0x | 1.35x | 1.8x | 2.4x |
| Micro (press, toggle) | 160ms | 220ms | 290ms | 380ms |
| Standard (element in/out) | 400ms | 540ms | 720ms | 960ms |
| Screen enter | 700ms | 950ms | 1260ms | 1680ms |
| Enter easing | `(0.2, 0, 0, 1)` | `(0.3, 0, 0.1, 1)` | `(0.4, 0, 0.2, 1)` | `(0.45, 0, 0.55, 1)` |
| Enter travel | 16px up | 12px up | 6px up | none, opacity only |
| Background | `oklch(0.30 0.07 285)` + dusk gradient | `oklch(0.24 0.045 305)` | `oklch(0.18 0.03 340)` | dims to `oklch(0.12 0.015 45)` |
| What's on screen | time, greeting, one button, duration hint | prompt, text field, two buttons | circle, phase label, dots, skip | one word, one low-key restart |

Base durations are 160 / 400 / 700ms, multiplied by the tempo and rounded to 10ms.

The easing column is where most of the feel comes from. Arrive uses a strong deceleration curve: things land quickly and settle, which reads as responsive and a bit awake. Each stage moves the curve toward a symmetric ease-in-out, and Fade out is nearly sinusoidal. A symmetric curve has no moment of landing, so by the end, elements drift in rather than arrive.

Nothing overshoots anywhere in the app. No bounce, no spring with a damping ratio under 1. Overshoot reads as energy, and energy is the wrong thing to add at 11pm.

## Transitions between stages

Screens change with a wait-then-enter sequence. The outgoing screen fades out using its own standard duration and curve (opacity only, no travel). Then the incoming screen fades in and rises by its stage's travel distance, on its own screen-enter duration.

Exits are shorter than enters on purpose. Leaving should feel like a step you've finished, and the attention belongs to what's coming in.

Background and text colors transition on the incoming stage's screen-enter clock. They're registered CSS custom properties, so the browser interpolates them in Oklab. This matters for the dim: interpolating in sRGB drops brightness fast at first and then crawls, which the eye reads as a flicker followed by a stall.

The dusk gradient on Arrive is a separate layer. It drifts vertically on a 40-second ease-in-out loop (160% background height, alternating), and fades out on the Brain dump screen-enter clock once you tap Begin.

## Breathe: 4-7-8

| Phase | Duration | Circle | Label |
|---|---|---|---|
| Breathe in | 4s | scale 0.62 to 1.0 | "Breathe in" |
| Hold | 7s | holds at 1.0 | "Hold" |
| Breathe out | 8s | scale 1.0 to 0.62 | "Breathe out" |

Four cycles, 76 seconds total. One progress dot fills per completed cycle.

The circle uses a sine in-out curve, `(0.37, 0, 0.63, 1)`, for both inhale and exhale. A breath accelerates and decelerates evenly, and a decelerating UI curve here would make the top of each inhale feel like it hit a wall. The phase label crossfades over 600ms, centered on the phase boundary so the new word is fully legible when the circle changes direction.

The label sits in an `aria-live="polite"` region, so VoiceOver announces each phase. The dots have a text equivalent ("Breath 2 of 4").

If the page is hidden partway through (the phone locks, or the person switches apps), the routine pauses. Browsers stop animation frames on hidden pages but keep firing timers, so without the pause the person would come back to a circle that's out of step with its label. When the page is visible again, the circle settles at its smallest size and the unfinished breath starts over after 720ms. Completed breaths stay counted.

I'm deliberately not animating anything during the hold. It's tempting to add a shimmer or a slow glow, but seven seconds of stillness is the point of that phase.

## Fade out: the 60-second dim

"Goodnight." enters at the Breathe colors and holds for 3 seconds. Then the background and text dim together over 60 seconds on `(0.4, 0, 0.6, 1)`, a gentle in-out so neither the start nor the end has a visible edge.

| | Start | End |
|---|---|---|
| Background | `oklch(0.18 0.03 340)`, `#1a0c16` | `oklch(0.12 0.015 45)`, `#0a0403` |
| Text | `oklch(0.86 0.03 60)`, `#e0cdbe` | `oklch(0.58 0.045 55)`, `#907461` |
| Contrast | 12.30:1 | 4.68:1 |

The hue moves from plum (340) through red to amber (45) while chroma drops. That's the warming: the last thing on screen is a dim amber word on warm black, with no blue in it at all.

A web page can't control the device's backlight, so the final frame is only as dark as the phone's brightness setting allows. That limits the prototype, and I'll mention it in the case study instead of pretending otherwise.

## Contrast, measured

Every text color was checked against its background with WCAG 2.1 relative luminance, computed from the OKLCH values after conversion to sRGB.

| Stage | Text | Muted text |
|---|---|---|
| Arrive, top of gradient | 12.35:1 | 7.94:1 |
| Arrive, middle | 9.99:1 | 6.42:1 |
| Arrive, horizon band | 5.52:1 | 3.55:1, fails |
| Brain dump | 13.12:1 | 7.72:1 |
| Breathe | 12.30:1 | 7.02:1 |
| Fade out, end of dim | 4.68:1 | same as text |
| Fade out, lowest point sampled across the 60s | 4.68:1 | |

The one failure is a layout rule, not a color change: muted text never sits in the bottom third of Arrive, where the horizon band is. The duration hint under Begin uses full text color for that reason. The primary button inverts the pair (stage background color on a stage text fill), so its label matches the text ratios: 12.35:1, 13.12:1 and 12.30:1 across the first three stages.

The Fade out floor is 4.5:1 for text, even though most of what's on screen is large text that only needs 3:1. I'd rather hold the stricter line on the screen where people are most likely to be squinting.

## Reduced motion

With `prefers-reduced-motion: reduce`:

- Screen transitions drop the travel and keep the opacity fade. Motion handles this through `MotionConfig reducedMotion="user"`.
- The dusk gradient stops drifting and stays at its starting position.
- The breathing circle keeps a fixed size. Its fill pulses in opacity from 0.35 to 1.0 on the same 4-7-8 timings and curve, so the rhythm survives without anything expanding toward the viewer.
- The 60-second dim still runs. It changes luminance, not position, and it doesn't cause the vestibular problems the setting exists for.
- The press feedback (scale to 0.97) is dropped.

## Out of scope for this spec

Haptics are out, because the Vibration API isn't available in iOS Safari and faking them isn't worth it. Ambient sound is a phase 4 decision, and if it ships it follows the same arc: it gets quieter and lower in pitch at each stage and fades with the dim.

## Open questions

- Four breathing cycles (76s) is the common starting recommendation for 4-7-8. Is that the right length for a first-time user, or should there be a three-cycle option?
- Should "Start over" on the last screen appear only after the dim finishes? It's present from the start right now, so keyboard and VoiceOver users can always reach it.
- The typeface is Nunito, self-hosted, in the app and both design files. It was picked because the system rounded face only exists on Apple devices and doesn't render in Figma. A licensed display face would add more brand character, but it would cost load time on the first screen.
