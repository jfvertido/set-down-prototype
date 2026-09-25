// The traceability check: every parked item has to come from the person's own words.
// The model returns each item with the exact phrase it came from; this code checks both,
// so a plausible-sounding invented task ("Book the dentist") can't slip through when the
// person only wrote "dentist Thursday".

export interface ModelItem {
  text: string
  source: string
}

export interface TraceResult {
  ok: boolean
  problems: string[]
}

export const limits = { maxItems: 10, maxItemChars: 80, maxAckChars: 160 }

// Small words that can appear in a cleaned-up item without being in the original.
const stopwords = new Set(
  'a an the and or but to of for on in at by with from about my me i im i\'m is are be do it this that tomorrow'.split(' '),
)

// The acknowledgment is one calm sentence. It must not give advice or sound clinical.
const ackBlocklist = [
  /\bshould\b/, /\btry\b/, /\bconsider\b/, /\bremember to\b/, /\bmake sure\b/, /\byou need\b/,
  /\btherap/, /\bdoctor\b/, /\bmedicat/, /\bdiagnos/, /\bdisorder\b/, /\banxiety\b/,
  /\bdepress/, /\binsomnia\b/, /\bsymptom/, /\btreatment\b/, /\bcounsel/,
]

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const words = (s: string) => normalize(s).split(' ').filter(Boolean)
const stem = (w: string) => w.replace(/'s$/, '').replace(/(ing|ed|es|s)$/, '')

// Phone typos are often two swapped letters ("dentsit"), so a swap counts as one edit.
function isSwap(a: string, b: string) {
  if (a.length !== b.length) return false
  const diff = [...a].flatMap((ch, i) => (ch === b[i] ? [] : [i]))
  return diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]
}

function withinOneEdit(a: string, b: string) {
  if (isSwap(a, b)) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0
  let j = 0
  let edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
      continue
    }
    if (++edits > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else {
      i++
      j++
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

// A word "comes from" the input if it's there, shares a stem with something there, or is a
// one-letter typo fix ("cal" -> "call", "dentsit" -> "dentist"). Short words need at least
// four letters so a fix can't turn "car" into "cat".
function wordInInput(word: string, inputWords: string[]) {
  return inputWords.some(
    (w) => w === word || stem(w) === stem(word) || (word.length >= 4 && withinOneEdit(w, word)),
  )
}

export function checkItems(input: string, items: ModelItem[]): TraceResult {
  const problems: string[] = []
  const normInput = normalize(input)
  const inputWords = words(input)

  if (items.length > limits.maxItems) problems.push(`More than ${limits.maxItems} items.`)

  items.forEach((item, n) => {
    const label = `Item ${n + 1} ("${item.text}")`
    if (!item.text.trim()) return problems.push(`${label} is empty.`)
    if (item.text.length > limits.maxItemChars) problems.push(`${label} is too long.`)

    const src = normalize(item.source)
    if (src.length < 2 || !normInput.includes(src)) {
      problems.push(`${label} has a source that isn't an exact phrase from the text.`)
    }

    const invented = words(item.text).filter((w) => !stopwords.has(w) && !wordInInput(w, inputWords))
    if (invented.length) problems.push(`${label} uses words that aren't in the text: ${invented.join(', ')}.`)
  })

  return { ok: problems.length === 0, problems }
}

export function checkAcknowledgment(ack: string): TraceResult {
  const problems: string[] = []
  const a = ack.toLowerCase()
  if (!ack.trim()) problems.push('Acknowledgment is empty.')
  if (ack.length > limits.maxAckChars) problems.push('Acknowledgment is too long.')
  if (/[?!]/.test(ack)) problems.push('Acknowledgment has a question or exclamation mark.')
  if ((ack.match(/[.]\s+\S/g) ?? []).length > 0) problems.push('Acknowledgment is more than one sentence.')
  const hits = ackBlocklist.filter((p) => p.test(a))
  if (hits.length) problems.push('Acknowledgment gives advice or uses clinical language.')
  return { ok: problems.length === 0, problems }
}
