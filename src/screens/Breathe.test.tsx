// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { afterEach, describe, expect, it } from 'vitest'
import { breath } from '../design/tokens'
import { Breathe } from './Breathe'

afterEach(cleanup)

const circle = (reducedMotion: 'always' | 'never') => {
  const { container } = render(
    <MotionConfig reducedMotion={reducedMotion}>
      <Breathe onDone={() => {}} />
    </MotionConfig>,
  )
  return container.querySelector('.breath') as HTMLElement
}

describe('Breathe for screen readers', () => {
  it('has a heading and reads the progress dots as one label', () => {
    circle('never')
    expect(screen.getByRole('heading', { name: 'Breathe' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Breath 1 of 4' })).toBeTruthy()
    expect(screen.queryByRole('list')).toBeNull()
  })
})

describe('Breathe circle', () => {
  it('scales, starting at its smallest size, when motion is allowed', () => {
    const el = circle('never')
    expect(el.style.transform).toContain(`scale(${breath.scaleMin})`)
  })

  it('keeps a fixed size and pulses opacity under reduced motion', () => {
    const el = circle('always')
    expect(el.style.transform).not.toContain('scale')
    expect(Number(el.style.opacity)).toBeCloseTo(breath.opacityMin)
  })
})
