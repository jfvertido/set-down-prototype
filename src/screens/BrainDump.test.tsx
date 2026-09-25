// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BrainDump } from './BrainDump'

// Skip animations so AnimatePresence swaps views immediately.
const renderDump = (onDone = vi.fn()) =>
  render(
    <MotionConfig transition={{ duration: 0 }} reducedMotion="always">
      <BrainDump onDone={onDone} />
    </MotionConfig>,
  )

const write = (text: string) => {
  fireEvent.change(screen.getByLabelText("What's still on your mind?"), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Park it' }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BrainDump', () => {
  it('shows the list from the API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      kind: 'parked', items: ['Email Sam', 'Finish the deck'], acknowledgment: "That's parked for tonight.", source: 'model',
    }))))
    renderDump()
    write('email sam, finish the deck')
    expect(await screen.findByText('Email Sam')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe("That's parked for tonight.")
  })

  it('parks locally when the API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
    renderDump()
    write('email sam, dentist thursday')
    expect(await screen.findByText('Email sam')).toBeTruthy()
    expect(screen.getByText('Dentist thursday')).toBeTruthy()
  })

  it('shows support resources for crisis language without calling the API', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderDump()
    write("I don't want to be alive anymore")

    const heading = await screen.findByRole('heading', { name: "You don't have to hold this alone tonight." })
    await waitFor(() => expect(document.activeElement).toBe(heading))
    expect(screen.getByRole('link', { name: 'Call 988' }).getAttribute('href')).toBe('tel:988')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('goes back to the text from the support screen', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderDump()
    write('I want to die')
    fireEvent.click(await screen.findByRole('button', { name: 'Go back to what I wrote' }))
    const field = (await screen.findByLabelText("What's still on your mind?")) as HTMLTextAreaElement
    expect(field.value).toBe('I want to die')
  })
})
