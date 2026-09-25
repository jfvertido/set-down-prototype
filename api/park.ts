import type { VercelRequest, VercelResponse } from '@vercel/node'
// Vercel runs this as a native ES module, so relative imports need .js extensions (they
// resolve to the .ts files at build time). Everything this file reaches follows the same rule.
import { createClient } from '../server/client.js'
import { handleParkRequest } from '../server/park.js'

// POST { text } -> ParkResponse (src/lib/parkTypes.ts). The guardrails live in server/park.ts.
// ANTHROPIC_API_KEY (and ANTHROPIC_WORKSPACE_ID, if the key needs it) come from the Vercel
// project's environment variables.
const client = createClient(process.env)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { status, json } = await handleParkRequest(req.method, req.body, client)
  // What people write here is private: never cache it, and never log it.
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(json)
}
