// Client-side error reporting — sanitized, bounded, fire-and-forget.
//
// Detects three failure classes (all reported to
// POST /api/v1/telemetry/client-errors):
//   api_error            a non-2xx API response the app surfaced
//   network_error        fetch itself rejected (offline, DNS, CORS,
//                        connection reset)
//   unexpected_response  the API answered with HTML instead of JSON —
//                        the classic symptom of an incorrect API base
//                        URL (or a proxy/captive portal)
//   config_error         the configured API base URL is unusable
//
// PRIVACY CONTRACT: reports carry only kind, method, a query-stripped
// endpoint path with id-like segments replaced, HTTP status, server
// error code, a scrubbed message and the page pathname. NEVER request
// bodies, headers, Authorization material, cookies, or full URLs.
// The server re-scrubs every field again (defence in depth).
//
// BOUNDING: at most MAX_REPORTS_PER_SESSION reports per browser
// session; unexpected_response is deduped per path; the reporter
// never reports failures of its own endpoint (no loops); sending is
// fire-and-forget and must never throw into app code.

// VITE_API_URL is inlined by Vite at build time. It is read inside a
// try so the literal `import.meta.env.VITE_API_URL` still gets
// replaced during the build, while importing this module outside Vite
// (a plain Node test) throws here instead of at module load and falls
// back to the documented default.
function resolveApiBase() {
  try {
    const configured = import.meta.env.VITE_API_URL

    if (configured) return configured
  } catch {
    // Not bundled by Vite — use the default base below.
  }

  return 'https://rayern-backend.onrender.com'
}

const API_BASE = resolveApiBase()

const REPORT_PATH = '/api/v1/telemetry/client-errors'

const MAX_REPORTS_PER_SESSION = 8
const SESSION_COUNT_KEY = 'rayern:error-report-count'

const reportedPaths = new Set()

let inMemoryCount = 0

function sessionCount() {
  try {
    const raw = sessionStorage.getItem(SESSION_COUNT_KEY)

    const parsed = raw ? Number.parseInt(raw, 10) : 0

    return Number.isNaN(parsed) ? 0 : parsed
  } catch {
    return inMemoryCount
  }
}

// Increments the PERSISTED count and stores the result. Persisting the
// in-memory counter (rather than storage + 1) reset the stored value
// to 1 on every reload, because inMemoryCount starts at 0 again after
// a reload — so the per-session cap never actually held.
function bumpSessionCount() {
  const next = sessionCount() + 1

  inMemoryCount = next

  try {
    sessionStorage.setItem(SESSION_COUNT_KEY, String(next))
  } catch {
    // Storage unavailable (private mode) — in-memory bound applies.
  }
}

function overBudget() {
  return sessionCount() >= MAX_REPORTS_PER_SESSION
}

// Path hygiene: strip query/fragment (they can carry tokens and
// personal data), then replace id-like segments with placeholders so
// stored endpoints stay low-cardinality templates.
export function sanitizePath(value) {
  if (typeof value !== 'string' || value.length === 0) return null

  let path = value.split('#')[0].split('?')[0]

  if (!path.startsWith('/')) path = `/${path}`

  path = path
    .split('/')
    .map((segment) => {
      if (/^[0-9a-f]{24}$/i.test(segment)) return ':id'
      if (/^\d+$/.test(segment)) return ':id'
      if (/^[A-Za-z0-9_-]{20,}$/.test(segment)) return ':param'
      return segment
    })
    .join('/')

  return path.slice(0, 200)
}

// Message scrubbing: emails, bearer tokens, JWTs, long hex runs and
// sensitive key=value pairs are redacted; output is truncated.
export function sanitizeMessage(value) {
  if (typeof value !== 'string' || value.length === 0) return null

  let out = value

  out = out.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
  out = out.replace(
    /eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g,
    '[redacted-jwt]',
  )
  out = out.replace(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    '[redacted-email]',
  )
  out = out.replace(
    /\b(password|passwd|secret|token|api[_-]?key|authorization|refresh_token|access_token)\b\s*["']?\s*[:=]\s*["']?[^\s,;"'}]+/gi,
    '$1=[redacted]',
  )
  out = out.replace(/\b[0-9a-f]{32,}\b/gi, '[redacted-hex]')
  out = out.replace(/\b[0-9a-f]{24}\b/gi, '[redacted-id]')
  // Control characters are stripped (this regex intentionally matches
  // them so they can be removed).
  // eslint-disable-next-line no-control-regex
  out = out.replace(/[\u0000-\u001f\u007f]+/g, ' ')

  if (out.length > 300) out = `${out.slice(0, 300)}…`

  return out
}

function send(report) {
  if (overBudget()) return

  if (report.kind === 'config_error' || report.kind === 'network_error') {
    // One report per path per session for these classes.
    const key = `${report.kind}:${report.endpoint ?? report.page ?? ''}`

    if (reportedPaths.has(key)) return

    reportedPaths.add(key)
  }

  if (
    report.kind === 'unexpected_response' &&
    report.endpoint &&
    reportedPaths.has(`unexpected:${report.endpoint}`)
  ) {
    return
  }

  if (report.kind === 'unexpected_response' && report.endpoint) {
    reportedPaths.add(`unexpected:${report.endpoint}`)
  }

  // Never report failures of the reporting endpoint itself.
  if (report.endpoint?.startsWith('/api/v1/telemetry/')) return

  bumpSessionCount()

  const body = JSON.stringify({
    ...report,
    occurredAt: new Date().toISOString(),
    page: sanitizePath(
      typeof location !== 'undefined' ? location.pathname : null,
    ),
  })

  try {
    // keepalive lets the report survive page navigation/unload;
    // fetch (not sendBeacon) so we control the JSON content type
    // the API expects. credentials: 'omit' — reports are anonymous.
    fetch(`${API_BASE}${REPORT_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
      mode: 'cors',
    }).catch(() => {
      // Telemetry must never surface to the user. Server-side
      // rate limiting and the session budget bound retries.
    })
  } catch {
    // Same contract: swallow.
  }
}

/**
 * Report a failed API request / network failure / config problem.
 * Safe to call anywhere; never throws; silently no-ops when over the
 * per-session budget.
 */
export function reportApiFailure({
  kind,
  endpoint = null,
  method = null,
  status = null,
  code = null,
  message = null,
} = {}) {
  try {
    if (!kind) return

    send({
      kind,
      endpoint: sanitizePath(endpoint),
      method:
        typeof method === 'string' ? method.slice(0, 10).toUpperCase() : null,
      status: Number.isInteger(status) ? status : null,
      code: typeof code === 'string' ? code.slice(0, 64) : null,
      message: sanitizeMessage(message),
    })
  } catch {
    // Never throw from telemetry.
  }
}

/**
 * Startup validation of the configured API base URL. An unusable base
 * (empty, not absolute, missing scheme) is itself a reportable
 * configuration problem — the dashboard sees it even if every later
 * request fails before reaching report code.
 */
export function validateApiConfig(apiBase = API_BASE) {
  try {
    if (typeof apiBase !== 'string' || apiBase.trim() === '') {
      reportApiFailure({
        kind: 'config_error',
        endpoint: null,
        message: 'API base URL is empty or missing.',
      })
      return false
    }

    const parsed = new URL(apiBase)

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      reportApiFailure({
        kind: 'config_error',
        endpoint: null,
        message: 'API base URL has an unsupported protocol.',
      })
      return false
    }

    return true
  } catch {
    reportApiFailure({
      kind: 'config_error',
      endpoint: null,
      message: 'API base URL is not a valid absolute URL.',
    })
    return false
  }
}
