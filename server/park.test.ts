import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it, vi } from 'vitest'
import { handleParkRequest, park } from './park'

type Output = { items: { text: string; source: string }[]; acknowledgment: string; concern: boolean }

// A stand-in for the SDK client that returns scripted parse() results in order.
function fakeClient(...replies: (Output | 'refusal' | Error)[]) {
  const parse = vi.fn(async () => {
    const next = replies.shift()
    if (next === undefined) throw new Error('No more scripted replies')
    if (next instanceof Error) throw next
    if (next === 'refusal') return { stop_reason: 'refusal', parsed_output: null }
    return { stop_reason: 'end_turn', parsed_output: next }
  })
  return { client: { beta: { messages: { parse } } } as unknown as Anthropic, parse }
}

const text = 'email sam about the offsite, dentist thursday, finish the deck'
const good: Output = {
  items: [
    { text: 'Email Sam about the offsite', source: 'email sam about the offsite' },
    { text: 'Dentist Thursday', source: 'dentist thursday' },
    { text: 'Finish the deck', source: 'finish the deck' },
  ],
  acknowledgment: "That's all parked for tonight.",
  concern: false,
}
const invented: Output = { ...good, items: [{ text: 'Book a dentist appointment', source: 'dentist thursday' }] }

describe('park', () => {
  it('routes crisis language to support resources without calling the model', async () => {
    const { client, parse } = fakeClient(good)
    expect(await park(client, "I don't want to be alive anymore")).toEqual({ kind: 'crisis' })
    expect(parse).not.toHaveBeenCalled()
  })

  it('returns the model’s list when every item traces back', async () => {
    const { client, parse } = fakeClient(good)
    expect(await park(client, text)).toEqual({
      kind: 'parked',
      items: ['Email Sam about the offsite', 'Dentist Thursday', 'Finish the deck'],
      acknowledgment: "That's all parked for tonight.",
      source: 'model',
    })
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('retries once with the problems, and uses the corrected list', async () => {
    const { client, parse } = fakeClient(invented, good)
    const r = await park(client, text)
    expect(r).toMatchObject({ kind: 'parked', source: 'model-retry' })
    expect(parse).toHaveBeenCalledTimes(2)
    const retryPrompt = (parse.mock.calls[1] as unknown as [{ messages: { content: string }[] }])[0].messages[0].content
    expect(retryPrompt).toMatch(/book, appointment/)
  })

  it('falls back to a plain split when the retry also invents items', async () => {
    const { client } = fakeClient(invented, invented)
    expect(await park(client, text)).toEqual({
      kind: 'parked',
      items: ['Email sam about the offsite', 'Dentist thursday', 'Finish the deck'],
      acknowledgment: "That's everything for tonight. It'll be here in the morning.",
      source: 'fallback',
    })
  })

  it('skips the retry when the first attempt used up the time budget', async () => {
    const { client, parse } = fakeClient(invented, good)
    let t = 0
    const now = () => (t += 10_000)
    expect(await park(client, text, now)).toMatchObject({ source: 'fallback' })
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('keeps good items but swaps in a safe acknowledgment when it gives advice', async () => {
    const { client } = fakeClient({ ...good, acknowledgment: 'You should try to rest.' })
    expect(await park(client, text)).toMatchObject({
      source: 'model',
      acknowledgment: "That's everything for tonight. It'll be here in the morning.",
    })
  })

  it('routes to support resources when the model raises a concern', async () => {
    const { client } = fakeClient({ ...good, concern: true })
    expect(await park(client, 'everything feels pointless lately')).toEqual({ kind: 'crisis' })
  })

  it('parks locally on a refusal or an API error', async () => {
    expect(await park(fakeClient('refusal').client, text)).toMatchObject({ source: 'fallback' })
    expect(await park(fakeClient(new Error('network')).client, text)).toMatchObject({ source: 'fallback' })
  })
})

describe('handleParkRequest', () => {
  it('rejects non-POST and malformed bodies', async () => {
    expect((await handleParkRequest('GET', null, null)).status).toBe(405)
    expect((await handleParkRequest('POST', { words: 'hi' }, null)).status).toBe(400)
  })

  it('still routes crisis language when no API key is configured', async () => {
    expect(await handleParkRequest('POST', { text: 'I want to die' }, null)).toEqual({
      status: 200,
      json: { kind: 'crisis' },
    })
  })

  it('returns 503 without an API key so the client parks locally', async () => {
    expect((await handleParkRequest('POST', { text }, null)).status).toBe(503)
  })
})
