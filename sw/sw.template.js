// Service worker for Set Down. The build (vite.config.ts) fills in the version and file list
// below with the hashed files of that build, so every deploy gets a fresh cache.
//
// After one visit the whole routine works offline: the crisis check runs on the phone, and
// "Park it" falls back to a local split when /api/park can't be reached.

const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = `set-down-${VERSION}`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', ...PRECACHE]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('set-down-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only same-origin GETs. /api is never cached: what people write there is private.
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // ignoreVary: servers can send "Vary: Origin", and the page's crossorigin script and style
  // requests carry an Origin header the precache requests didn't, so a strict match misses and
  // the app fails to load offline. File names are content-hashed, so ignoring Vary is safe.
  const match = (r) => caches.match(r, { ignoreVary: true })

  // Pages: network first so a new deploy shows up, cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => match('/')))
    return
  }

  // Hashed assets never change, so the cache wins.
  event.respondWith(match(req).then((hit) => hit ?? fetch(req)))
})
