import { describe, expect, it } from 'vitest'
import { hasCrisisLanguage } from './crisis'
import { checkAcknowledgment, checkItems } from './trace'

describe('hasCrisisLanguage', () => {
  it.each([
    "honestly I don't want to be alive anymore",
    'I keep thinking about killing myself',
    'been having suicidal thoughts again',
    'everyone would be better off without me',
    'I want to end it all',
    'I wish I were dead',
    'thinking about hurting myself',
    'I can’t go on like this', // curly apostrophe, as iOS types it
    'no reason to live',
  ])('flags %j', (text) => expect(hasCrisisLanguage(text)).toBe(true))

  it.each([
    'this deck is killing me',
    'my boss will kill me if the report is late',
    'dying to see the new episode',
    'email Sam, dentist Thursday, finish the deck',
    'the end of the quarter is stressful',
  ])('does not flag everyday hyperbole %j', (text) => expect(hasCrisisLanguage(text)).toBe(false))
})

const input = 'email sam about the offsite, dentist thursday\nfinish the deck. worried about the review'

describe('checkItems', () => {
  it('passes items that use the person’s own words', () => {
    const r = checkItems(input, [
      { text: 'Email Sam about the offsite', source: 'email sam about the offsite' },
      { text: 'Dentist Thursday', source: 'dentist thursday' },
      { text: 'Finish the deck', source: 'finish the deck' },
      { text: 'Worried about the review', source: 'worried about the review' },
    ])
    expect(r).toEqual({ ok: true, problems: [] })
  })

  it('rejects an invented task, even with a real source phrase', () => {
    const r = checkItems(input, [{ text: 'Book a dentist appointment', source: 'dentist thursday' }])
    expect(r.ok).toBe(false)
    expect(r.problems[0]).toMatch(/book, appointment/)
  })

  it('rejects a source that is not an exact phrase from the text', () => {
    const r = checkItems(input, [{ text: 'Email Sam', source: 'email Sam about the budget' }])
    expect(r.ok).toBe(false)
    expect(r.problems[0]).toMatch(/source/)
  })

  it('allows light cleanup: plurals, tense and a one-letter typo fix', () => {
    const r = checkItems('call the dentsit, pay bills, emailed jo', [
      { text: 'Call the dentist', source: 'call the dentsit' },
      { text: 'Pay bill', source: 'pay bills' },
      { text: 'Email Jo', source: 'emailed jo' },
    ])
    expect(r.ok).toBe(true)
  })

  it('allows a missing letter in a short word, but not a changed one', () => {
    expect(checkItems('cal mom back', [{ text: 'Call mom back', source: 'cal mom back' }]).ok).toBe(true)
    expect(checkItems('fix the car', [{ text: 'Fix the cat', source: 'fix the car' }]).ok).toBe(false)
  })

  it('rejects more than ten items', () => {
    const many = Array.from({ length: 11 }, () => ({ text: 'Finish the deck', source: 'finish the deck' }))
    expect(checkItems(input, many).ok).toBe(false)
  })
})

describe('checkAcknowledgment', () => {
  it('passes one calm sentence', () => {
    expect(checkAcknowledgment("That's parked for tonight. ").ok).toBe(true)
  })

  it.each([
    'You should try to get some rest.',
    'Have you considered talking to a therapist?',
    'All parked!',
    'That sounds like anxiety.',
    'Parked. Sleep well.',
  ])('rejects %j', (ack) => expect(checkAcknowledgment(ack).ok).toBe(false))
})
