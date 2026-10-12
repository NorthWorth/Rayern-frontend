/**
 * Frontend security-header configuration.
 *
 * The public site (app.rayern.com.ng) is served as static assets by
 * Vercel, so browser-facing security headers come from vercel.json —
 * NOT from the Express API and NOT from Vite. A passing API header
 * test therefore says nothing about the HTML document a browser
 * actually loads. This test asserts the hosting configuration itself.
 *
 * Run: node scripts/securityHeaders.test.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientRoot = path.resolve(__dirname, '..')

let passed = 0
const failures = []

function check(label, fn) {
  try {
    fn()
    passed += 1
    console.log(`  ok   ${label}`)
  } catch (error) {
    failures.push(`${label}: ${error.message}`)
    console.log(`  FAIL ${label}\n       ${error.message}`)
  }
}

const vercel = JSON.parse(readFileSync(path.join(clientRoot, 'vercel.json'), 'utf8'))
const indexHtml = readFileSync(path.join(clientRoot, 'index.html'), 'utf8')

// Flatten every configured (source, header) pair.
const configured = new Map()
for (const rule of vercel.headers ?? []) {
  for (const header of rule.headers ?? []) {
    configured.set(header.key.toLowerCase(), { value: header.value, source: rule.source })
  }
}

function headerValue(name) {
  const entry = configured.get(name.toLowerCase())
  return entry ? entry.value : null
}

console.log('== Hosting security headers (vercel.json) ==')

check('a catch-all route rule exists for the HTML document', () => {
  const sources = (vercel.headers ?? []).map((rule) => rule.source)
  if (!sources.some((source) => source === '/(.*)' || source === '/(.*)' || source.includes('(.*)'))) {
    throw new Error(`no catch-all header rule; got ${JSON.stringify(sources)}`)
  }
})

check('X-Frame-Options is DENY', () => {
  const value = headerValue('X-Frame-Options')
  if (value !== 'DENY') throw new Error(`expected DENY, got ${JSON.stringify(value)}`)
})

check("Content-Security-Policy enforces frame-ancestors 'none'", () => {
  const csp = headerValue('Content-Security-Policy')
  if (!csp) throw new Error('no Content-Security-Policy configured')
  if (!/frame-ancestors\s+'none'/.test(csp)) {
    throw new Error(`frame-ancestors 'none' missing from: ${csp}`)
  }
})

check('X-Content-Type-Options is nosniff', () => {
  const value = headerValue('X-Content-Type-Options')
  if (value !== 'nosniff') throw new Error(`expected nosniff, got ${JSON.stringify(value)}`)
})

check('a Referrer-Policy is configured', () => {
  const value = headerValue('Referrer-Policy')
  if (!value || !value.trim()) throw new Error('no Referrer-Policy configured')
})

check('the CSP does not use unsafe-eval or a wildcard default', () => {
  const csp = headerValue('Content-Security-Policy') ?? ''
  if (/'unsafe-eval'/.test(csp)) throw new Error("CSP allows 'unsafe-eval'")
  if (/default-src\s+\*/.test(csp)) throw new Error('CSP default-src is a wildcard')
})

console.log('\n== No meta-tag CSP duplication ==')

check('index.html does not declare a CSP via <meta http-equiv>', () => {
  // frame-ancestors can only be enforced from a response header; a meta
  // CSP is ignored for it and would create an inconsistent policy.
  if (/http-equiv=["']?content-security-policy/i.test(indexHtml)) {
    throw new Error('found a meta CSP in index.html')
  }
})

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exitCode = 1
