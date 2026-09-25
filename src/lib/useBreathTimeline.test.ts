// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { breath } from '../design/tokens'
import { cycleMs, useBreathTimeline } from './useBreathTimeline'

const START = 1260
const lead = breath.labelCrossfadeMs / 2

let visibility: DocumentVisibilityState = 'visible'
const setVisibility = (v: DocumentVisibilityState) => {
  visibility = v
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  vi.useFakeTimers()
  visibility = 'visible'
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useBreathTimeline', () => {
  it('rests before the first inhale, then runs 4-7-8', () => {
    const { result } = renderHook(() => useBreathTimeline(START, () => {}))
    expect(result.current.phase).toBeNull()
    expect(result.current.label).toBe('in')

    advance(START)
    expect(result.current.phase).toBe('in')

    advance(breath.inhaleMs)
    expect(result.current.phase).toBe('hold')

    advance(breath.holdMs)
    expect(result.current.phase).toBe('out')

    advance(breath.exhaleMs)
    expect(result.current.phase).toBe('in')
    expect(result.current.completed).toBe(1)
  })

  it('changes the label half a crossfade before the circle changes direction', () => {
    const { result } = renderHook(() => useBreathTimeline(START, () => {}))
    advance(START + breath.inhaleMs - lead - 1)
    expect(result.current.label).toBe('in')

    advance(1)
    expect(result.current.label).toBe('hold')
    expect(result.current.phase).toBe('in')

    advance(lead)
    expect(result.current.phase).toBe('hold')
  })

  it('finishes after four cycles (76s) and calls onDone once', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useBreathTimeline(START, onDone))
    expect(cycleMs * breath.cycles).toBe(76_000)

    advance(START + 76_000 - 1)
    expect(onDone).not.toHaveBeenCalled()

    advance(1)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(result.current.completed).toBe(4)

    advance(60_000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('pauses while hidden and restarts the unfinished breath when visible', () => {
    const onDone = vi.fn()
    const { result } = renderHook(() => useBreathTimeline(START, onDone))

    // Hide partway through the second breath.
    advance(START + cycleMs + 5_000)
    expect(result.current.completed).toBe(1)
    setVisibility('hidden')
    expect(result.current.phase).toBeNull()
    expect(result.current.label).toBe('in')

    advance(5 * 60_000)
    expect(result.current.completed).toBe(1)
    expect(onDone).not.toHaveBeenCalled()

    setVisibility('visible')
    advance(breath.resumeDelayMs - 1)
    expect(result.current.phase).toBeNull()
    advance(1)
    expect(result.current.phase).toBe('in')

    // Three breaths left.
    advance(3 * cycleMs)
    expect(result.current.completed).toBe(4)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does not start while the page is hidden on mount', () => {
    visibility = 'hidden'
    const { result } = renderHook(() => useBreathTimeline(START, () => {}))
    advance(START + cycleMs)
    expect(result.current.phase).toBeNull()
    expect(result.current.completed).toBe(0)
  })
})
