# Set Down

A short evening routine for setting the day down before sleep: park what's on your mind, breathe, and let the screen dim to near-black. It's a portfolio prototype, inspired by Calm but not affiliated with it.

Live: https://set-down-prototype.vercel.app

The motion spec is in [docs/motion-spec.md](docs/motion-spec.md). Its numbers live in code at [src/design/tokens.ts](src/design/tokens.ts). Screens and spec notes are in [Figma](https://www.figma.com/design/LW6t6B0wYDiSXYYv2KCS4S).

## Run it

```bash
npm install
npm run dev
```

The dev server listens on your network (`--host`), so you can open it on your phone from the same Wi-Fi.

Two dev-only URL parameters help with testing and screen recordings:

- `?stage=breathe` jumps straight to a stage (`arrive`, `park`, `breathe` or `rest`).
- `?motion=reduce` forces the reduced-motion version without changing your OS setting.

`npm test` runs the breathing timeline, guardrail and Brain dump tests.

## The AI step

"Park it" sends the text to `/api/park`, which asks Claude (`claude-opus-5`) to turn it into a short list for tomorrow. To run it locally, create `.env.local` in the project root with your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

If the API says the key "is not scoped to a workspace", either create a key inside a workspace in the Claude Console, or add the workspace ID on a second line:

```
ANTHROPIC_WORKSPACE_ID=...
```

Then restart `npm run dev`. The key stays on the dev server and is never sent to the browser. For Vercel, set the same variables in the project's environment variables.

Without a key, everything still works: the endpoint returns 503 and the phone parks the text by splitting it into lines.

The guardrails, in order (code in [server/park.ts](server/park.ts) and [src/lib/guardrails](src/lib/guardrails)):

1. **Crisis language** is checked on the phone before anything is sent, and again on the server. A match shows 988 and other support resources, and the model is never called.
2. **Claude's own concern flag** routes to the same resources, for phrasings the pattern list misses.
3. **Traceability:** each item comes back with the exact phrase it came from. Code checks that phrase is in the text and that the item adds no new words (allowing plurals, tense and one-letter typo fixes).
4. **One corrective retry** with the specific problems, if time allows. Then a **safe fallback**: a plain split of the person's own text.
5. **No advice:** an acknowledgment that gives advice, asks a question or uses clinical words is replaced with a fixed line.

Nothing people write is logged or cached.

## Status

| Phase | State |
|---|---|
| 1. Spec and scaffold | Done: motion spec, tokens, stage transitions, 60s dim, walkable flow, Figma frames |
| 2. Shell | Done: 4-7-8 breathing loop, reduced-motion pulse, press feedback, pause while hidden |
| 3. AI | Done: Claude endpoint, traceability check with one retry and a local fallback, crisis routing. Needs a live test with an API key |
| 4. Polish | Not started |
| 5. Proof | Not started |

## Stack

Vite, React, TypeScript and Motion (the library formerly called Framer Motion, imported from `motion/react`). The API route targets Vercel serverless functions.
