// Single source of truth for the motion spec (docs/motion-spec.md).
// If a number changes here, change it in the spec too.

export type StageId = 'arrive' | 'park' | 'breathe' | 'rest'

export const stageOrder: StageId[] = ['arrive', 'park', 'breathe', 'rest']

export type Bezier = [number, number, number, number]

export interface StageTokens {
  /** Multiplier applied to the base durations. The routine slows down as it goes. */
  tempo: number
  /** Durations in ms, already multiplied by tempo. */
  micro: number
  standard: number
  screen: number
  /** Enter curve for this stage. Starts decelerating, ends nearly symmetric. */
  ease: Bezier
  /** How far content travels on enter, in px. Shrinks to zero by the last stage. */
  travel: number
  /** Colors in OKLCH so the browser interpolates them in Oklab (perceptually even). */
  bg: string
  text: string
  muted: string
}

const base = { micro: 160, standard: 400, screen: 700 }

const scaled = (tempo: number) => ({
  tempo,
  micro: Math.round((base.micro * tempo) / 10) * 10,
  standard: Math.round((base.standard * tempo) / 10) * 10,
  screen: Math.round((base.screen * tempo) / 10) * 10,
})

export const stages: Record<StageId, StageTokens> = {
  arrive: {
    ...scaled(1),
    ease: [0.2, 0, 0, 1],
    travel: 16,
    bg: 'oklch(0.30 0.07 285)',
    text: 'oklch(0.96 0.012 80)',
    muted: 'oklch(0.82 0.025 75)',
  },
  park: {
    ...scaled(1.35),
    ease: [0.3, 0, 0.1, 1],
    travel: 12,
    bg: 'oklch(0.24 0.045 305)',
    text: 'oklch(0.92 0.018 70)',
    muted: 'oklch(0.76 0.025 65)',
  },
  breathe: {
    ...scaled(1.8),
    ease: [0.4, 0, 0.2, 1],
    travel: 6,
    bg: 'oklch(0.18 0.03 340)',
    text: 'oklch(0.86 0.03 60)',
    muted: 'oklch(0.70 0.035 55)',
  },
  rest: {
    ...scaled(2.4),
    ease: [0.45, 0, 0.55, 1],
    travel: 0,
    // Starts at the breathe colors; the 60s dim below carries it to the end state.
    bg: 'oklch(0.18 0.03 340)',
    text: 'oklch(0.86 0.03 60)',
    muted: 'oklch(0.70 0.035 55)',
  },
}

/** Arrive's drifting dusk gradient. Muted text must stay out of the bottom third (fails AA over the horizon band). */
export const dusk = {
  top: 'oklch(0.30 0.07 285)',
  mid: 'oklch(0.36 0.07 320)',
  horizon: 'oklch(0.50 0.08 40)',
  driftMs: 40_000,
}

/** 4-7-8 breathing. Sine in-out because a breath has no "arrival" moment. */
export const breath = {
  inhaleMs: 4000,
  holdMs: 7000,
  exhaleMs: 8000,
  cycles: 4,
  ease: [0.37, 0, 0.63, 1] as Bezier,
  scaleMin: 0.62,
  scaleMax: 1,
  // Reduced motion: size stays fixed, only fill opacity changes.
  opacityMin: 0.35,
  opacityMax: 1,
  labelCrossfadeMs: 600,
  // If the page is hidden mid-routine (phone locked, app switched), the routine pauses and
  // restarts the unfinished breath this long after the page is visible again.
  resumeDelayMs: 720,
}

/** The last screen dims and warms to near-black. Text never drops below 4.5:1 (measured 4.68:1 at the end). */
export const restDim = {
  durationMs: 60_000,
  ease: [0.4, 0, 0.6, 1] as Bezier,
  bg: 'oklch(0.12 0.015 45)',
  text: 'oklch(0.58 0.045 55)',
  // Goodnight holds at full stage color this long before the dim starts.
  holdMs: 3000,
}

/** Exits are opacity-only and use the outgoing stage's standard duration. */
export const exitFor = (id: StageId) => ({
  duration: stages[id].standard / 1000,
  ease: stages[id].ease,
})

export const cssEase = (b: Bezier) => `cubic-bezier(${b.join(', ')})`
