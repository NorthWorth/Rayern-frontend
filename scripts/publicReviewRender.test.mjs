/**
 * Public review page: rendering + stylesheet loading.
 *
 * Verifies that the page actually renders through its real
 * route, that the CSS module resolves to hashed class names,
 * and that those hashed names are present in the stylesheet
 * Vite emits for the chunk. A successful build alone does not
 * prove any of this.
 *
 * Run: node scripts/publicReviewRender.test.mjs
 */
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement as h } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientRoot = path.resolve(__dirname, '..')

// The API client reads localStorage at module scope, and the
// auth context touches window. Provide minimal shims so the
// component tree can be rendered outside a browser.
globalThis.localStorage ??= {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
}
globalThis.window ??= globalThis
globalThis.window.addEventListener ??= () => {}
globalThis.window.removeEventListener ??= () => {}
globalThis.window.dispatchEvent ??= () => {}

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

const vite = await createServer({
  root: clientRoot,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})

try {
  console.log('\n== Stylesheet resolution ==')

  const cssModule = await vite.ssrLoadModule(
    '/src/pages/reviewPage/publicReviewPage.module.css',
  )
  const classes = cssModule.default ?? cssModule

  const requiredClasses = [
    'publicReviewPage',
    'reviewShell',
    'reviewHeader',
    'hero',
    'eyebrow',
    'titleRow',
    'imageGallery',
    'imageItem',
    'noImages',
    'versionTag',
    'contentGrid',
    'panel',
    'panelHeader',
    'primaryButton',
    'secondaryButton',
    'feedbackForm',
    'commentList',
    'decisionSection',
    'approvedState',
    'statusNotice',
    'statusNoticeWarning',
    'reloadButton',
    'deliveryMeta',
    'reviewFooter',
    'state',
  ]

  check('CSS module exports every class the page renders', () => {
    const missing = requiredClasses.filter((name) => !classes[name])
    assertEqual(missing, [], `missing from CSS module: ${missing.join(', ')}`)
  })

  check('exported class names are hashed by the CSS modules pipeline', () => {
    assertEqual(
      /^_[a-zA-Z]+_[a-z0-9]+_\d+$/.test(classes.publicReviewPage),
      true,
      `expected a hashed name, got "${classes.publicReviewPage}"`,
    )
  })

  console.log('\n== Built stylesheet carries the rules ==')

  const distAssets = path.join(clientRoot, 'dist', 'assets')
  const cssFiles = existsSync(distAssets)
    ? readdirSync(distAssets).filter((name) => name.endsWith('.css'))
    : []

  check('a build output exists to inspect', () => {
    assertEqual(cssFiles.length > 0, true, 'run `npm run build` first')
  })

  const builtCss = cssFiles
    .map((name) => readFileSync(path.join(distAssets, name), 'utf8'))
    .join('\n')

  check('built CSS contains the rules for every exported class', () => {
    const missing = []
    for (const name of requiredClasses) {
      const hashed = classes[name]
      if (!hashed) continue
      // CSS modules emit `.<hashed>{...}`
      if (!builtCss.includes(`.${hashed}{`) && !builtCss.includes(`.${hashed} `)) {
        missing.push(`${name} -> ${hashed}`)
      }
    }
    assertEqual(missing, [], `not in built CSS: ${missing.join(', ')}`)
  })

  check('built CSS keeps responsive breakpoints for the page', () => {
    const hasMedia = /@media[^{]*max-width:\s*(640|850)px/.test(builtCss)
    assertEqual(hasMedia, true, 'expected a max-width media query')
  })

  check('the public review chunk ships its own stylesheet', () => {
    const chunk = cssFiles.find((name) => name.startsWith('publicReviewPage'))
    assertEqual(Boolean(chunk), true, 'no publicReviewPage*.css chunk emitted')
    const size = readFileSync(path.join(distAssets, chunk), 'utf8').length
    assertEqual(size > 3000, true, `stylesheet suspiciously small: ${size} bytes`)
  })

  console.log('\n== Rendering through the real route ==')

  const { default: PublicReviewPage } = await vite.ssrLoadModule(
    '/src/pages/reviewPage/publicReviewPage.jsx',
  )
  const { DeliverableProvider } = await vite.ssrLoadModule(
    '/src/context/deliverableContext.jsx',
  )
  const { AuthProvider } = await vite.ssrLoadModule('/src/context/authContext.jsx')

  function renderAt(entries) {
    return renderToStaticMarkup(
      h(
        MemoryRouter,
        { initialEntries: entries },
        h(
          AuthProvider,
          null,
          h(
            DeliverableProvider,
            { loadOnMount: false },
            h(
              Routes,
              null,
              h(Route, {
                path: '/public-review/:token',
                element: h(PublicReviewPage),
              }),
              h(Route, {
                path: '*',
                element: h(PublicReviewPage),
              }),
            ),
          ),
        ),
      ),
    )
  }

  const withToken = renderAt(['/public-review/abcdef0123456789abcdef0123456789'])

  check('page renders its root element with the module class', () => {
    assertEqual(
      withToken.includes(`class="${classes.publicReviewPage}"`),
      true,
      'root <main> does not carry the hashed publicReviewPage class',
    )
  })

  check('page renders the loading state with the page styles applied', () => {
    assertEqual(withToken.includes(classes.state), true, 'state class missing')
    assertEqual(
      /Loading review/i.test(withToken),
      true,
      'loading copy missing',
    )
    assertEqual(
      withToken.includes(classes.reviewHeader) || withToken.includes(classes.reviewShell),
      false,
      'loading state should not render the full shell yet',
    )
  })

  const withoutToken = renderAt(['/public-review/'])

  check('an invalid link renders the unavailable state, still styled', () => {
    assertEqual(
      withoutToken.includes(`class="${classes.publicReviewPage}"`),
      true,
      'error state lost the page class',
    )
    assertEqual(withoutToken.includes(classes.state), true, 'state class missing')
    assertEqual(/Review unavailable/i.test(withoutToken), true, 'unavailable copy missing')
  })

  check('every class the JSX renders is defined in its stylesheet', () => {
    const jsx = readFileSync(
      path.join(clientRoot, 'src/pages/reviewPage/publicReviewPage.jsx'),
      'utf8',
    )
    const referenced = new Set(
      [...jsx.matchAll(/styles\.([A-Za-z0-9_]+)/g)].map((match) => match[1]),
    )
    const missing = [...referenced].filter((name) => !classes[name])
    assertEqual(missing, [], `rendered but unstyled: ${missing.join(', ')}`)
    assertEqual(referenced.size > 25, true, 'expected the page to reference its styles')
  })

  check('rendered markup applies the stylesheet to the root and state elements', () => {
    const rendered = withToken + withoutToken
    for (const name of [classes.publicReviewPage, classes.state]) {
      assertEqual(
        rendered.includes(name),
        true,
        `expected rendered HTML to contain "${name}"`,
      )
    }
  })

  check('accessibility: the page exposes a labelled status region', () => {
    const html = withoutToken + withToken
    assertEqual(/role="status"|aria-live/.test(html), true, 'no live region found')
  })
} catch (error) {
  failures.push(`harness failure: ${error.message}`)
  console.log(`  FAIL harness: ${error.stack}`)
} finally {
  await vite.close()
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) {
    throw new Error(`${message} (expected ${e}, got ${a})`)
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exitCode = 1
