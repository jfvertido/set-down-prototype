// Shared between the client, the dev middleware and the Vercel function.

export const maxInputChars = 2000

export type ParkResponse =
  | {
      kind: 'parked'
      items: string[]
      acknowledgment: string
      /** Where the list came from. Useful in testing; not shown to people. */
      source: 'model' | 'model-retry' | 'fallback'
    }
  | { kind: 'crisis' }
