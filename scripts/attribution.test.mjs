/**
 * Funnel instrumentation and error-reporter budget.
 *
 * These paths fail silently by design: a wrong payload key is a 400
 * nobody sees, a wrong day key loses a visitor-day, and a counter
 * reset by a reload means the report cap never holds. Each check
 * below pins the behaviour that was actually broken (or that a future
 * edit is most likely to break again).
 *
 * The modules are imported by plain Node — outside Vite there is no
 * `import.meta.env`, which is exactly why the API base is resolved
 * lazily and why the documented production default is asserted here.
 *
 * Run: node scripts/attribution.test.mjs
 */
import { strict as assert } from 'node:assert'

globalThis.fetch = async () => ({ ok: true, status: 202 })

const attribution = await import('../src/utils/attribution.js')

const API = 'https://rayern-backend.onrender.com'
const VISIT_URL = `${API}/api/v1/visitors/visit`
const SIGNUP_URL = `${API}/api/v1/auth/signup-intent`
const DAY_KEY = 'rayern_visitor_beacon_day'

const SIGNUP_KEYS = [
  'campaign',
  'medium',
  'path',
  'referrerHost',
  'source',
  'surface',
  'visitorId',
]

let passed = 0
const failures = []

function makeStorage() {
  const map = new Map()

  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value))
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

// A readable store plus a fetch stub: `respond` decides what the
// server says, `calls` keeps every request for assertions.
function installEnv({ respond = () => ({ ok: true, status: 202 }) } = {}) {
  const storage = makeStorage()
  const session = makeStorage()
  const calls = []

  globalThis.localStorage = storage
  globalThis.sessionStorage = session
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })

    return respond(url, init)
  }

  return { storage, session, calls }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function bodyOf(call) {
  return JSON.parse(call.init.body)
}

function checksFor(url, calls) {
  return calls.filter((call) => call.url === url)
}

async function check(label, fn) {
  try {
    await fn()
    passed += 1
    console.log(`  ok   ${label}`)
  } catch (error) {
    failures.push(`${label}: ${error.message}`)
    console.log(`  FAIL ${label}\n       ${error.message}`)
  }
}

console.log('== App visit beacon (surface "app") ==')

await check('posts one beacon with the exact field set the server accepts', async () => {
  const { storage, calls } = installEnv()

  await attribution.recordVisit()

  const sent = checksFor(VISIT_URL, calls)

  assert.equal(sent.length, 1, 'expected exactly one visit beacon')

  const body = bodyOf(sent[0])

  assert.deepEqual(Object.keys(body).sort(), SIGNUP_KEYS)
  assert.equal(body.surface, 'app')
  assert.equal(
    'landingPath' in body,
    false,
    'landingPath is not a visit field (strict schema rejects it)',
  )
  assert.match(body.visitorId, /^[A-Za-z0-9_-]{8,64}$/)
  assert.equal(storage.getItem(DAY_KEY), today())
})

await check('does not beacon twice on the same UTC day', async () => {
  const { calls } = installEnv()

  await attribution.recordVisit()
  await attribution.recordVisit()
  await attribution.recordVisit()

  assert.equal(checksFor(VISIT_URL, calls).length, 1)
})

await check('leaves the day unmarked when the server rejects it, then retries', async () => {
  let accepting = false

  const { storage, calls } = installEnv({
    respond: () => (accepting ? { ok: true, status: 202 } : { ok: false, status: 429 }),
  })

  await attribution.recordVisit()

  // A 429 from the analytics limiter must not burn the day.
  assert.equal(checksFor(VISIT_URL, calls).length, 1)
  assert.equal(storage.getItem(DAY_KEY), null)

  await attribution.recordVisit()

  assert.equal(checksFor(VISIT_URL, calls).length, 2, 'next load retried')

  accepting = true

  await attribution.recordVisit()

  assert.equal(checksFor(VISIT_URL, calls).length, 3)
  assert.equal(storage.getItem(DAY_KEY), today())

  // Marked day: no further attempts.
  await attribution.recordVisit()

  assert.equal(checksFor(VISIT_URL, calls).length, 3)
})

await check('sends nothing when the visitor id cannot be stored', async () => {
  const { calls } = installEnv()

  globalThis.localStorage = {
    getItem() {
      throw new Error('denied')
    },
    setItem() {
      throw new Error('denied')
    },
  }

  await attribution.recordVisit()

  assert.equal(checksFor(VISIT_URL, calls).length, 0)
})

await check('adopts the landing page visitor id from ?vid=', async () => {
  const { storage } = installEnv()

  globalThis.location = { search: '?vid=landingvisitorid123', pathname: '/' }

  try {
    assert.equal(attribution.getOrCreateVisitorId(), 'landingvisitorid123')
    assert.equal(storage.getItem('rayern_visitor_id'), 'landingvisitorid123')
  } finally {
    delete globalThis.location
  }
})

console.log('\n== Signup-intent beacon ==')

await check('sends `path`, never the stored `landingPath` key', async () => {
  const { calls } = installEnv()

  await attribution.recordSignupIntent()

  const sent = checksFor(SIGNUP_URL, calls)

  assert.equal(sent.length, 1)

  const body = bodyOf(sent[0])

  // The server's signup-intent schema is strict and names the field
  // `path`; sending `landingPath` made every beacon a 400.
  assert.deepEqual(Object.keys(body).sort(), SIGNUP_KEYS)
  assert.equal('landingPath' in body, false)
  assert.equal(body.surface, 'app')
})

await check('sends at most once per browser session', async () => {
  const { calls } = installEnv()

  await attribution.recordSignupIntent()
  await attribution.recordSignupIntent()

  assert.equal(checksFor(SIGNUP_URL, calls).length, 1)
})

console.log('\n== Error-reporter session budget ==')

await check('the 8-report cap holds across a reload', async () => {
  const { session, calls } = installEnv()

  const load1 = await import('../src/utils/errorReporter.js?load=1')
  const load2 = await import('../src/utils/errorReporter.js?load=2')

  const reports = () =>
    calls.filter((call) => call.url === `${API}/api/v1/telemetry/client-errors`)

  for (let i = 0; i < 3; i += 1) {
    load1.reportApiFailure({ kind: 'api_error', endpoint: `/api/v1/a/${i}` })
  }

  assert.equal(reports().length, 3)
  assert.equal(session.getItem('rayern:error-report-count'), '3')

  // A reload resets module state; the persisted count must survive it
  // (before the fix a bump wrote the fresh in-memory count, resetting
  // the stored value to 1 and blowing the cap wide open).
  for (let i = 0; i < 20; i += 1) {
    load2.reportApiFailure({ kind: 'api_error', endpoint: `/api/v1/b/${i}` })
  }

  assert.equal(reports().length, 8, 'cap is 8 reports per session')
  assert.equal(session.getItem('rayern:error-report-count'), '8')
})

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exitCode = 1
