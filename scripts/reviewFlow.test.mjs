/**
 * Review states + Action Center navigation.
 *
 * The SSR harness in publicReviewRender.test.mjs covers the
 * states reachable without data (loading, invalid link).  This
 * file covers the data-driven review states: it asserts each
 * branch exists, that it is wired to the stylesheet, and that
 * the client decisions carry the submission identity needed to
 * stop a stale approval.
 *
 * Run: node scripts/reviewFlow.test.mjs
 */
import { createServer } from 'vite'
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

function assertTrue(value, message) {
  if (!value) throw new Error(message)
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a !== e) throw new Error(`${message} (expected ${e}, got ${a})`)
}

const vite = await createServer({
  root: clientRoot,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})

try {
  const css = await vite.ssrLoadModule(
    '/src/pages/reviewPage/publicReviewPage.module.css',
  )
  const classes = css.default ?? css

  const jsx = readFileSync(
    path.join(clientRoot, 'src/pages/reviewPage/publicReviewPage.jsx'),
    'utf8',
  )

  console.log('\n== Public review: key states are rendered and styled ==')

  const states = [
    ['Ready for Review', 'decision section for a submitted deliverable'],
    ['In Review', 'active client review with decision controls'],
    ['Changes Requested', 'change-request outcome'],
    ['Approved', 'approval outcome'],
  ]

  for (const [status, label] of states) {
    check(`renders the ${label}`, () => {
      assertTrue(
        jsx.includes(`status ===\n              '${status}'`) ||
          jsx.includes(`'${status}'`),
        `no branch found for status "${status}"`,
      )
    })
  }

  check('client can request changes with meaningful feedback', () => {
    assertTrue(jsx.includes('client-feedback'), 'missing feedback textarea id')
    assertTrue(
      jsx.includes('handleRequestChanges'),
      'missing request-changes handler',
    )
    assertTrue(
      jsx.includes('Request changes'),
      'missing request-changes control',
    )
  })

  check('client can approve the submission', () => {
    assertTrue(jsx.includes('handleApprove'), 'missing approve handler')
    assertTrue(
      jsx.includes('Approve deliverable'),
      'missing approve control',
    )
  })

  check('review controls have accessible labels', () => {
    const labels = [...jsx.matchAll(/<label[^>]*htmlFor="([^"]+)"/g)].map((m) => m[1])
    assertTrue(labels.length >= 2, `expected labelled controls, found ${labels.length}`)
    const areas = [...jsx.matchAll(/<textarea[^>]*id="([^"]+)"/g)].map((m) => m[1])
    for (const id of areas) {
      assertTrue(labels.includes(id), `textarea "${id}" has no matching <label>`)
    }
  })

  console.log('\n== Submitted content and images ==')

  check('renders the submitted image collection', () => {
    assertTrue(jsx.includes('imageGallery'), 'missing image gallery')
    assertTrue(jsx.includes('imageItem'), 'missing image item')
    assertTrue(
      jsx.includes('submitted attachment') || jsx.includes('Submitted attachment'),
      'images need meaningful alt text',
    )
    assertTrue(jsx.includes('images.map'), 'images must be mapped, not rendered singly')
  })

  check('a text-only deliverable shows an intentional empty state', () => {
    assertTrue(jsx.includes('noImages'), 'missing no-images state')
    assertTrue(
      jsx.includes('No images were attached'),
      'missing empty-state copy',
    )
  })

  check('images open at full size', () => {
    assertTrue(jsx.includes('target="_blank"'), 'images should open full size')
    assertTrue(jsx.includes('rel="noreferrer"'), 'missing rel for external links')
  })

  check('every image/review class is covered by the stylesheet', () => {
    const needed = [
      'imageGallery',
      'imageItem',
      'noImages',
      'versionTag',
      'statusNoticeWarning',
      'reloadButton',
      'approvedState',
      'approveBox',
      'decisionActions',
      'feedbackForm',
      'commentList',
      'deliveryMeta',
      'contentGrid',
      'panel',
    ]
    const missing = needed.filter((name) => !classes[name])
    assertEqual(missing, [], `unstyled: ${missing.join(', ')}`)
  })

  console.log('\n== Submission-version integrity in the client ==')

  check('client decisions echo the submission being reviewed', () => {
    assertTrue(jsx.includes('submissionId'), 'submissionId not read from payload')
    const requestIdx = jsx.indexOf('requestPublicChanges(')
    const approveIdx = jsx.indexOf('approvePublicDeliverable(')
    assertTrue(requestIdx > 0, 'request-changes call missing')
    assertTrue(approveIdx > 0, 'approve call missing')
    const requestBlock = jsx.slice(requestIdx, requestIdx + 240)
    const approveBlock = jsx.slice(approveIdx, approveIdx + 240)
    assertTrue(
      requestBlock.includes('submissionId'),
      'request-changes must send the submission id',
    )
    assertTrue(
      approveBlock.includes('submissionId'),
      'approve must send the submission id',
    )
  })

  check('a superseded submission is explained instead of approved', () => {
    assertTrue(
      jsx.includes('STALE_SUBMISSION'),
      'stale response code not handled',
    )
    assertTrue(jsx.includes('isStale'), 'stale flag missing')
    assertTrue(
      jsx.includes('newer version'),
      'stale message must explain an updated review is available',
    )
    assertTrue(
      jsx.includes('handleReload'),
      'stale state must offer a reload action',
    )
  })

  check('the page shows which version is under review', () => {
    assertTrue(jsx.includes('versionTag'), 'missing version tag')
    assertTrue(jsx.includes('submissionVersion'), 'missing submission version')
  })

  console.log('\n== Action Center navigation ==')

  const actionJsx = readFileSync(
    path.join(clientRoot, 'src/pages/actionCenterPage/actionCenterPage.jsx'),
    'utf8',
  )
  const appJsx = readFileSync(path.join(clientRoot, 'src/app.jsx'), 'utf8')

  check('action items navigate to their source record', () => {
    assertTrue(actionJsx.includes('openItem'), 'items are not clickable')
    assertTrue(actionJsx.includes('item.href'), 'items do not expose a route')
    assertTrue(
      actionJsx.includes('navigate(item.href)'),
      'clicking must navigate to the existing record route',
    )
  })

  // Hrefs are produced server-side, so read them from the
  // aggregator rather than assuming the client builds them.
  const controllerJsx = readFileSync(
    path.join(
      clientRoot,
      '..',
      'server',
      'src',
      'controllers',
      'actionCenterController.js',
    ),
    'utf8',
  )

  check('every target route exists in the router', () => {
    const templates = [
      ...new Set(
        [...controllerJsx.matchAll(/`\/(tasks|review|meetings)\/\$\{[^}]+\}`/g)].map(
          (m) => `/${m[1]}/:id`,
        ),
      ),
    ]
    // Exact (non-parameterised) links, e.g. /meetings
    const exact = [
      ...new Set(
        [...controllerJsx.matchAll(/`(\/(?:tasks|review|meetings))`/g)].map((m) => m[1]),
      ),
    ]

    const found = [...templates, ...exact]
    assertTrue(found.length >= 2, `no href templates found in the aggregator`)

    for (const route of found) {
      assertTrue(
        appJsx.includes(`path="${route}"`),
        `router has no "${route}" route — clicking would fall through to the catch-all`,
      )
    }
  })

  check('no link targets a route that does not exist', () => {
    const raw = [...controllerJsx.matchAll(/`([^`]*\/\$\{[^}]+\})`/g)].map((m) => m[1])
    for (const href of raw) {
      const segment = href.split('/')[1]
      const hasParam = appJsx.includes(`path="/${segment}/:id"`)
      const hasExact = appJsx.includes(`path="/${segment}"`)
      assertTrue(
        hasParam || hasExact,
        `href "${href}" has no matching /${segment} route`,
      )
    }
  })

  check('action center sections are all rendered', () => {
    for (const section of ['needsAttention', 'waitingOnOthers', 'comingUp']) {
      assertTrue(actionJsx.includes(section), `missing section ${section}`)
    }
  })

  check('each item states why it is listed and its status', () => {
    assertTrue(actionJsx.includes('item.detail'), 'missing reason')
    assertTrue(actionJsx.includes('item.status'), 'missing status')
    assertTrue(actionJsx.includes('item.kind'), 'missing category')
    assertTrue(
      actionJsx.includes('item.dueDate') || actionJsx.includes('item.date'),
      'missing date',
    )
  })
} catch (error) {
  failures.push(`harness failure: ${error.message}`)
  console.log(`  FAIL harness: ${error.stack}`)
} finally {
  await vite.close()
}

console.log(`\n${passed} passed, ${failures.length} failed`)
if (failures.length > 0) process.exitCode = 1
