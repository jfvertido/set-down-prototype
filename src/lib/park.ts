import { hasCrisisLanguage } from './guardrails/crisis.js'
import { limits } from './guardrails/trace.js'
import type { ParkResponse } from './parkTypes.js'

export interface ParkResult {
  /** Short items for tomorrow. Each one must trace back to the user's own words. */
  items: string[]
  /** One calm sentence of acknowledgment. No advice, clinical or otherwise. */
  acknowledgment: string
}

// The safe fallback. It only splits what the person typed, so every item traces to their
// text by construction. Used whenever the AI step is unavailable, slow, or fails its checks.
export function parkLocally(text: string): ParkResult {
  const items = text
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/[.]+$/, ''))
    .filter(Boolean)
    .slice(0, limits.maxItems)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))

  return {
    items,
    acknowledgment: items.length
      ? "That's everything for tonight. It'll be here in the morning."
      : 'Nothing to park. That works too.',
  }
}

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string')

function isParkResponse(v: unknown): v is ParkResponse {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  if (r.kind === 'crisis') return true
  return r.kind === 'parked' && isStringArray(r.items) && typeof r.acknowledgment === 'string'
}

/**
 * Crisis language is checked here first, so support resources appear even with no network
 * and nothing is sent. Anything that goes wrong after that (offline, slow, a 503 with no API
 * key, a malformed reply) parks locally instead of leaving someone waiting at bedtime.
 */
export async function requestPark(text: string, timeoutMs = 20_000): Promise<ParkResponse> {
  if (hasCrisisLanguage(text)) return { kind: 'crisis' }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('/api/park', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: unknown = await res.json()
    if (!isParkResponse(data)) throw new Error('Unexpected response')
    return data
  } catch {
    return { kind: 'parked', ...parkLocally(text), source: 'fallback' }
  } finally {
    window.clearTimeout(timer)
  }
}
