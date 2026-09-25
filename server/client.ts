import Anthropic from '@anthropic-ai/sdk'

/**
 * One place to build the Claude client, for both the Vercel function and the Vite dev server.
 *
 * ANTHROPIC_WORKSPACE_ID is only needed for an API key that isn't scoped to a workspace: the
 * API then requires the anthropic-workspace-id header on every request. A workspace-scoped
 * key doesn't need it.
 */
export function createClient(env: { ANTHROPIC_API_KEY?: string; ANTHROPIC_WORKSPACE_ID?: string }): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null
  return new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: 15_000,
    maxRetries: 1,
    defaultHeaders: env.ANTHROPIC_WORKSPACE_ID ? { 'anthropic-workspace-id': env.ANTHROPIC_WORKSPACE_ID } : undefined,
  })
}
