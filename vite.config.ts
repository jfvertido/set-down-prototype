import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Serves /api/park during `npm run dev` with the same handler the Vercel function uses,
// so the AI step works locally (and from a phone on the same Wi-Fi) without the Vercel CLI.
// The key is read from .env.local on the server side only; it never reaches the client bundle.
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'set-down-dev-api',
    apply: 'serve',
    configureServer(server) {
      if (!env.ANTHROPIC_API_KEY) server.config.logger.warn('ANTHROPIC_API_KEY is not set: /api/park will return 503 and the app will park locally.')

      server.middlewares.use('/api/park', async (req, res) => {
        let raw = ''
        for await (const chunk of req) raw += chunk
        let body: unknown = null
        try {
          body = JSON.parse(raw)
        } catch {
          // handleParkRequest rejects a null body with a 400.
        }

        const { handleParkRequest } = await server.ssrLoadModule('/server/park.ts')
        const { createClient } = await server.ssrLoadModule('/server/client.ts')
        const { status, json } = await handleParkRequest(req.method, body, createClient(env))

        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(json))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // The '' prefix loads every variable, not just VITE_ ones. Only the server plugin reads it.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devApi(env)],
  }
})
