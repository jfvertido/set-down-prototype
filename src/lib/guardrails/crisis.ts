// First layer of crisis routing. Plain code, so it runs on the phone before anything is
// sent anywhere, and again on the server before any model call. The model's `concern`
// flag is the second layer, for phrasings this list misses.
//
// The list leans toward recall: a false positive shows support resources to someone who
// didn't need them, which is a much smaller harm than a miss. It deliberately skips
// common hyperbole like "this deck is killing me", which would fire on ordinary evenings.

const patterns: RegExp[] = [
  /\bsuicid(e|al)\b/,
  /\bkill(ing)?\s+myself\b/,
  /\b(hurt|hurting|harm|harming|cut|cutting)\s+myself\b/,
  /\bself[\s-]?harm/,
  /\bend(ing)?\s+(it\s+all|my\s+life|things)\b/,
  /\b(want|wanted|wanting)\s+to\s+die\b/,
  /\bwish\s+i\s+(was|were)\s+dead\b/,
  /\bbetter\s+off\s+(dead|without\s+me)\b/,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive|be\s+here\s+anymore|wake\s+up)\b/,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|go\s+on|going\s+on)\b/,
  /\bcan'?t\s+go\s+on\b/,
  /\boverdos(e|ing)\b/,
]

const normalize = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'")

export function hasCrisisLanguage(text: string): boolean {
  const t = normalize(text)
  return patterns.some((p) => p.test(t))
}
