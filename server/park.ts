import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { hasCrisisLanguage } from '../src/lib/guardrails/crisis.js'
import { checkAcknowledgment, checkItems, limits, type ModelItem } from '../src/lib/guardrails/trace.js'
import { parkLocally } from '../src/lib/park.js'
import { maxInputChars, type ParkResponse } from '../src/lib/parkTypes.js'

const MODEL = 'claude-opus-5'

// Only start the corrective retry if the first attempt left enough time for it. The client
// gives up at 20s and parks locally, so a retry that can't finish in time is wasted.
const RETRY_DEADLINE_MS = 9000

const system = `You help someone set down what's on their mind before sleep. They've written a quick, unfiltered brain dump. Turn it into a short list of things to pick up tomorrow, plus one sentence of acknowledgment.

Items:
- Every item must come from something they wrote. Don't add tasks, steps, reminders or advice they didn't mention.
- Keep their words. Light cleanup is fine: capitalize, drop filler like "I need to", fix an obvious typo. Don't rephrase into new words.
- For each item, "source" is the exact phrase from their text it came from, copied character for character.
- One item per distinct thing; merge repeats. Keep everything they mentioned: nothing they wrote should go missing. At most ${limits.maxItems} items, each under 60 characters.
- A worry or feeling that isn't a task can be an item too, in their words ("Worried about the review").
- If there's nothing to park, return an empty list.

Acknowledgment: one short, warm, plain sentence, under 20 words. It can say the things are parked for now. No advice, suggestions or questions. No clinical or diagnostic language. No exclamation marks or emoji.

concern: true if anything they wrote suggests they might hurt themselves, don't want to be alive, or are in danger. When in doubt, use true. When concern is true, items and acknowledgment are ignored.`

const ParkOutput = z.object({
  items: z.array(z.object({ text: z.string(), source: z.string() })),
  acknowledgment: z.string(),
  concern: z.boolean(),
})
type ParkOutput = z.infer<typeof ParkOutput>

const fallbackAck = "That's everything for tonight. It'll be here in the morning."

async function askClaude(client: Anthropic, text: string, feedback?: string): Promise<ParkOutput | null> {
  const content = feedback
    ? `${text}\n\n---\nA previous list for this text failed a check that every item comes from the person's own words:\n${feedback}\nMake a new list that fixes these.`
    : text

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Short extraction that someone is waiting on at bedtime: low effort keeps it quick.
    output_config: { effort: 'low', format: betaZodOutputFormat(ParkOutput) },
    // If a safety classifier declines, retry server-side on Anthropic's recommended fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system,
    messages: [{ role: 'user', content }],
  })

  if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') return null
  return response.parsed_output ?? null
}

function validate(text: string, out: ParkOutput) {
  const items = checkItems(text, out.items as ModelItem[])
  const ack = checkAcknowledgment(out.acknowledgment)
  return { items, ack }
}

// Log why the model step failed so problems aren't silent. Status and error type only:
// what people write is never logged.
function logFailure(stage: string, err: unknown) {
  const e = err as { status?: number; error?: { error?: { type?: string } }; name?: string }
  console.warn(`[park] ${stage} failed: ${e.status ?? ''} ${e.error?.error?.type ?? e.name ?? 'error'}`.trim())
}

const local = (text: string): ParkResponse => ({ kind: 'parked', ...parkLocally(text), source: 'fallback' })

/**
 * The guardrail pipeline:
 * 1. Crisis language → support resources, and the model is never called.
 * 2. Claude makes the list. Its own concern flag also routes to support resources.
 * 3. Code checks every item traces back to the text. One corrective retry, then a plain
 *    split of the person's text as the safe fallback.
 */
export async function park(client: Anthropic, rawText: string, now = () => Date.now()): Promise<ParkResponse> {
  const text = rawText.slice(0, maxInputChars)
  if (hasCrisisLanguage(text)) return { kind: 'crisis' }
  if (!text.trim()) return { kind: 'parked', items: [], acknowledgment: 'Nothing to park. That works too.', source: 'fallback' }

  const started = now()
  let first: ParkOutput | null = null
  try {
    first = await askClaude(client, text)
  } catch (err) {
    logFailure('first attempt', err)
    return local(text)
  }
  if (!first) return local(text)
  if (first.concern) return { kind: 'crisis' }

  const check = validate(text, first)
  if (check.items.ok) {
    const acknowledgment = check.ack.ok ? first.acknowledgment : fallbackAck
    return { kind: 'parked', items: first.items.map((i) => i.text), acknowledgment, source: 'model' }
  }

  if (now() - started > RETRY_DEADLINE_MS) return local(text)

  let second: ParkOutput | null = null
  try {
    second = await askClaude(client, text, check.items.problems.join('\n'))
  } catch (err) {
    logFailure('retry', err)
    return local(text)
  }
  if (!second) return local(text)
  if (second.concern) return { kind: 'crisis' }

  const recheck = validate(text, second)
  if (!recheck.items.ok) return local(text)
  const acknowledgment = recheck.ack.ok ? second.acknowledgment : fallbackAck
  return { kind: 'parked', items: second.items.map((i) => i.text), acknowledgment, source: 'model-retry' }
}

/** Framework-neutral request handling, shared by the Vercel function and the Vite dev server. */
export async function handleParkRequest(
  method: string | undefined,
  body: unknown,
  client: Anthropic | null,
): Promise<{ status: number; json: unknown }> {
  if (method !== 'POST') return { status: 405, json: { error: 'Use POST.' } }
  const parsed = z.object({ text: z.string().max(maxInputChars * 2) }).safeParse(body)
  if (!parsed.success) return { status: 400, json: { error: 'Expected { text: string }.' } }

  const text = parsed.data.text
  // Crisis routing never depends on the API being configured.
  if (hasCrisisLanguage(text)) return { status: 200, json: { kind: 'crisis' } satisfies ParkResponse }
  if (!client) return { status: 503, json: { error: 'The Claude API key is not configured.' } }

  return { status: 200, json: await park(client, text) }
}
