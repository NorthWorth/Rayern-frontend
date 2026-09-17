// Rayern service worker.
//
// Strategy (deliberately minimal and app-data-safe):
// - Navigations (HTML): network-first so every deploy is picked up
//   immediately; the cached shell is only a fallback when offline.
// - Hashed build assets (/assets/*): cache-first — filenames are
//   content-hashed, so a cached hit is always correct for its URL.
// - Other same-origin files (icons, manifest, favicon): stale-while-
//   revalidate.
// - Everything else is passed through untouched: non-GET requests,
//   cross-origin traffic (the API host), and any same-origin /api/*
//   path are never intercepted, so authentication, token refresh,
//   logout, and API error handling behave exactly as without the SW.
//
// Bump CACHE_VERSION when you want to force all clients to discard
// every cache on the next load (e.g. after a breaking asset change).

const CACHE_VERSION = 'rayern-v3'

const SHELL_CACHE = `${CACHE_VERSION}-shell`
const ASSET_CACHE = `${CACHE_VERSION}-assets`

const SHELL_URL = '/'
const PRECACHE_URLS = [SHELL_URL, '/manifest.webmanifest', '/icons/pwa-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, ASSET_CACHE]

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !currentCaches.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isCacheable(response) {
  return response && response.ok && response.type === 'basic'
}

function isStaticFilePath(pathname) {
  const lastSegment = pathname.split('/').pop() || ''

  return (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    lastSegment.includes('.')
  )
}

// Network-first with cached-shell fallback. Successful HTML is also
// copied over the cached shell so the offline fallback never goes
// stale across deploys.
async function handleNavigation(request) {
  const cache = await caches.open(SHELL_CACHE)

  try {
    const response = await fetch(request)

    if (response.ok && isCacheable(response)) {
      cache.put(SHELL_URL, response.clone())
      return response
    }

    const shellResponse = await fetch(SHELL_URL)

    if (isCacheable(shellResponse)) {
      cache.put(SHELL_URL, shellResponse.clone())
    }

    return shellResponse
  } catch {
    const cached = await cache.match(SHELL_URL)

    if (cached) {
      return cached
    }

    throw new Error('Rayern is offline and no cached shell is available.')
  }
}

// Immutable hashed assets: serve from cache, populate on first use.
async function handleHashedAsset(request) {
  const cached = await caches.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (isCacheable(response)) {
    const cache = await caches.open(ASSET_CACHE)
    cache.put(request, response.clone())
  }

  return response
}

// Icons/manifest and similar files: serve cached immediately, refresh
// in the background so the next visit is up to date.
async function handleStaticFile(request) {
  const cache = await caches.open(ASSET_CACHE)

  const cached = await cache.match(request)

  const refresh = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached || refresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Never intercept non-GET traffic (mutations, auth POSTs, uploads).
  if (request.method !== 'GET') {
    return
  }

  // Never intercept range requests (media streaming/downloads).
  if (request.headers.has('range')) {
    return
  }

  const url = new URL(request.url)

  // Never intercept cross-origin traffic — this covers the API host,
  // so no API, auth, or token-refresh response can ever be cached.
  if (url.origin !== self.location.origin) {
    return
  }

  // Defense in depth: if the API is ever proxied onto the app origin
  // (VITE_API_URL pointing at /api), keep it out of the SW entirely.
  if (url.pathname.startsWith('/api/')) {
    return
  }

  if (request.mode === 'navigate' && !isStaticFilePath(url.pathname)) {
    event.respondWith(handleNavigation(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(handleHashedAsset(request))
    return
  }

  event.respondWith(handleStaticFile(request))
})
