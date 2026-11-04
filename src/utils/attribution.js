// First-party acquisition attribution + visitor id.
//
// Captured client-side on first touch (landing/login/signup entry):
// UTM parameters from the current URL, the referrer HOSTNAME and the
// bare landing path. Persisted in localStorage so it survives the
// login → signup navigation, then submitted with registration
// (authContext.signup) and with the signup-intent beacon.
//
// PRIVACY: no cookies, no IP, no full referrer URL (hostname only),
// no query strings (path only), bounded values. The visitor id is a
// random first-party string (not a device fingerprint).

const VISITOR_ID_KEY = 'rayern_visitor_id'
const ATTRIBUTION_KEY = 'rayern_attribution'
const SIGNUP_INTENT_KEY = 'rayern_signup_intent_sent'

const MAX_SOURCE = 64
const MAX_CAMPAIGN = 128

// Same pattern the server accepts: [A-Za-z0-9_-]{8,64}.
const VALID_VISITOR_ID = /^[A-Za-z0-9_-]{8,64}$/

function safeGet(storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value)
  } catch {
    // Storage unavailable — the session simply behaves as unknown.
  }
}

function randomVisitorId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '')
    }
  } catch {
    // Fall through to the entropy fallback.
  }

  const random = Math.random().toString(36).slice(2)
  const time = Date.now().toString(36)

  return `v${time}${random}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32)
}

/**
 * Stable anonymous visitor id for this origin. A `vid` URL parameter
 * (appended by the landing page when it links here) takes precedence
 * so the same visitor joins across origins.
 */
export function getOrCreateVisitorId() {
  const fromUrl =
    typeof location !== 'undefined'
      ? new URLSearchParams(location.search).get('vid')
      : null

  if (fromUrl && VALID_VISITOR_ID.test(fromUrl)) {
    safeSet(localStorage, VISITOR_ID_KEY, fromUrl)
    return fromUrl
  }

  const existing = safeGet(localStorage, VISITOR_ID_KEY)

  if (existing && VALID_VISITOR_ID.test(existing)) {
    return existing
  }

  const created = randomVisitorId()

  safeSet(localStorage, VISITOR_ID_KEY, created)

  return created
}

function cleanUtm(value, maxLength) {
  if (typeof value !== 'string') return null

  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim()

  if (!cleaned) return null

  return cleaned.slice(0, maxLength)
}

function readUtmFromLocation() {
  if (typeof location === 'undefined') return {}

  const params = new URLSearchParams(location.search)

  return {
    source: cleanUtm(params.get('utm_source'), MAX_SOURCE),
    medium: cleanUtm(params.get('utm_medium'), MAX_SOURCE),
    campaign: cleanUtm(params.get('utm_campaign'), MAX_CAMPAIGN),
  }
}

function readReferrerHost() {
  if (typeof document === 'undefined' || !document.referrer) return null

  try {
    // HOSTNAME only — never the full referrer URL (its query can
    // contain personal data), never a port (server-side validation
    // accepts bare hostnames).
    return new URL(document.referrer).hostname.slice(0, 128) || null
  } catch {
    return null
  }
}

function readLandingPath() {
  if (typeof location === 'undefined') return null

  return location.pathname.slice(0, 256) || null
}

/**
 * Capture the first-touch attribution once per browser. Repeated calls
 * fill only empty slots (e.g. utm arrives on the second navigation)
 * and never overwrite an already-recorded first touch.
 */
export function captureAttribution() {
  try {
    const storedRaw = safeGet(localStorage, ATTRIBUTION_KEY)

    let stored = null

    if (storedRaw) {
      try {
        stored = JSON.parse(storedRaw)
      } catch {
        stored = null
      }
    }

    const utm = readUtmFromLocation()
    const referrerHost = readReferrerHost()
    const landingPath = readLandingPath()

    const merged = {
      visitorId: getOrCreateVisitorId(),
      source: stored?.source ?? utm.source ?? null,
      medium: stored?.medium ?? utm.medium ?? null,
      campaign: stored?.campaign ?? utm.campaign ?? null,
      referrerHost: stored?.referrerHost ?? referrerHost,
      landingPath: stored?.landingPath ?? landingPath,
      capturedAt: stored?.capturedAt ?? new Date().toISOString(),
    }

    // Fill gaps from a later utm-bearing navigation without
    // clobbering the first touch.
    if (!merged.source && utm.source) merged.source = utm.source
    if (!merged.medium && utm.medium) merged.medium = utm.medium
    if (!merged.campaign && utm.campaign) merged.campaign = utm.campaign

    safeSet(localStorage, ATTRIBUTION_KEY, JSON.stringify(merged))

    return merged
  } catch {
    return null
  }
}

/** Attribution payload for /auth/register (shape validated server-side). */
export function getRegistrationAttribution() {
  try {
    captureAttribution()

    const raw = safeGet(localStorage, ATTRIBUTION_KEY)

    if (!raw) return null

    const stored = JSON.parse(raw)

    const payload = {
      visitorId: getOrCreateVisitorId(),
      source: stored.source ?? null,
      medium: stored.medium ?? null,
      campaign: stored.campaign ?? null,
      referrerHost: stored.referrerHost ?? null,
      landingPath: stored.landingPath ?? null,
    }

    if (
      !VALID_VISITOR_ID.test(payload.visitorId || '')
    ) {
      delete payload.visitorId
    }

    return payload
  } catch {
    return null
  }
}

/**
 * POST /auth/signup-intent — records that the signup page was
 * reached (funnel step). Once per browser session, fire-and-forget,
 * never throws, never blocks navigation.
 */
export async function recordSignupIntent() {
  try {
    if (typeof sessionStorage === 'undefined') return

    if (safeGet(sessionStorage, SIGNUP_INTENT_KEY)) return

    safeSet(sessionStorage, SIGNUP_INTENT_KEY, '1')

    const attribution = getRegistrationAttribution()

    const API_BASE =
      import.meta.env.VITE_API_URL ||
      'https://rayern-backend.onrender.com'

    fetch(`${API_BASE}/api/v1/auth/signup-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attribution ?? {}),
      keepalive: true,
      credentials: 'omit',
      mode: 'cors',
    }).catch(() => {
      // Funnel instrumentation must never surface to the user.
    })
  } catch {
    // Same contract: swallow.
  }
}
