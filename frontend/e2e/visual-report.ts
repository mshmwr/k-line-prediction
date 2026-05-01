/**
 * K-008 Visual Report Script
 *
 * 對「已知頁面路由全集」各截一張全頁截圖並輸出為單檔 HTML 報告。
 *
 * 執行方式：
 *   TICKET_ID=K-008 npx playwright test visual-report.ts
 *
 * 未設 TICKET_ID 時直接 throw（fail-fast），避免產生 K-UNKNOWN 孤兒 artifact。
 *
 * 輸出：../docs/reports/K-<TICKET_ID>-visual-report.html
 *
 * 設計決策見 docs/tickets/K-008-visual-report.md §Architecture。
 */

import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM-compatible __dirname (package.json has "type": "module")
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── 頁面清單（固定順序，MVP）────────────────────────────────────────────────
type RouteEntry = {
  label: string
  routePath: string
  // 若 authRequired=true，不截圖，在報告中標 placeholder
  authRequired?: boolean
  authNote?: string
}

const ROUTES: RouteEntry[] = [
  { label: 'Home', routePath: '/' },
  { label: 'App (K-Line Prediction)', routePath: '/app' },
  { label: 'About', routePath: '/about' },
  { label: 'Dev Diary', routePath: '/diary' },
  {
    label: 'Business Logic',
    routePath: '/business-logic',
    authRequired: true,
    authNote: '需登入，下期補（K-008 MVP 不做 auth fixture）',
  },
]

// ── Section 狀態 ─────────────────────────────────────────────────────────────
type SectionResult =
  | {
      status: 'success'
      label: string
      routePath: string
      screenshotBase64: string
      width: number
      height: number
      httpStatus: number | null
    }
  | {
      status: 'failure'
      label: string
      routePath: string
      errorMessage: string
      errorStack: string
    }
  | {
      status: 'auth-required'
      label: string
      routePath: string
      note: string
    }

// ── Ticket ID（env var）─────────────────────────────────────────────────────
// W1 修復：不在 module 頂層呼叫。改由 test.beforeAll() lazy 執行，
// 避免 Playwright test collection 階段（包含 --list 與其他 project run）
// 誤印 warning 到既有 E2E stdout。
// W4 修復：對 TICKET_ID 做 whitelist 驗證，阻擋 path traversal（`../` 等）。
function resolveTicketId(): string {
  const raw = process.env.TICKET_ID
  if (!raw || raw.trim() === '') {
    throw new Error('[visual-report] TICKET_ID env var is required. Run: TICKET_ID=K-NNN npx playwright test visual-report.ts')
  }
  // 允許傳 "K-008" 或 "008"；normalize 到不含前綴
  const normalized = raw.replace(/^K-/i, '')
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw new Error(`Invalid TICKET_ID: ${raw}`)
  }
  return normalized
}

// visual-report.ts 位於 frontend/e2e/，報告輸出到 ../../docs/reports/
const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'reports')

// ── HTML 產生 ───────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSection(r: SectionResult): string {
  const commonHeader = `
    <h2>${escapeHtml(r.label)}</h2>
    <p class="route"><code>${escapeHtml(r.routePath)}</code></p>
  `

  if (r.status === 'success') {
    return `
  <section class="page-section success">
    ${commonHeader}
    <p class="meta">Dimensions: ${r.width} × ${r.height}${
      r.httpStatus !== null ? ` · HTTP ${r.httpStatus}` : ''
    }</p>
    <img src="data:image/png;base64,${r.screenshotBase64}" alt="${escapeHtml(r.label)} screenshot">
  </section>`
  }

  if (r.status === 'failure') {
    return `
  <section class="page-section failure">
    ${commonHeader}
    <p class="meta">Status: <strong>FAILED</strong></p>
    <pre class="error">${escapeHtml(r.errorMessage)}\n\n${escapeHtml(r.errorStack)}</pre>
  </section>`
  }

  // auth-required
  return `
  <section class="page-section auth-required">
    ${commonHeader}
    <div class="placeholder">${escapeHtml(r.note)}</div>
  </section>`
}

function renderHtml(ticketId: string, results: SectionResult[]): string {
  const generatedAt = new Date().toISOString()
  const failures = results.filter((r) => r.status === 'failure').length
  const successes = results.filter((r) => r.status === 'success').length
  const authRequired = results.filter((r) => r.status === 'auth-required').length

  const sectionsHtml = results.map(renderSection).join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>K-${escapeHtml(ticketId)} — Visual Report</title>
  <style>
    :root {
      color-scheme: dark light;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      margin: 0;
      padding: 2rem;
      line-height: 1.5;
    }
    header {
      position: sticky;
      top: 0;
      background: #0f172a;
      padding: 1rem 0;
      border-bottom: 1px solid #334155;
      margin-bottom: 1.5rem;
      z-index: 10;
    }
    header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    header p {
      margin: 0.25rem 0;
      font-size: 0.875rem;
      color: #94a3b8;
    }
    main {
      display: grid;
      gap: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }
    .page-section {
      background: #1e293b;
      border-radius: 0.5rem;
      padding: 1.25rem;
      border: 1px solid #334155;
    }
    .page-section.failure {
      border-color: #dc2626;
      background: #2d1314;
    }
    .page-section.auth-required {
      border-color: #8b5cf6;
      background: #1e1a3b;
    }
    .page-section h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
    }
    .page-section p.route {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
    }
    .page-section code {
      background: #0f172a;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-size: 0.8125rem;
    }
    .page-section p.meta {
      margin: 0 0 1rem 0;
      font-size: 0.8125rem;
      color: #94a3b8;
    }
    .page-section img {
      max-width: 100%;
      height: auto;
      display: block;
      border-radius: 0.375rem;
      border: 1px solid #334155;
    }
    .page-section .error {
      background: #0f172a;
      color: #fca5a5;
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      font-size: 0.8125rem;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .page-section .placeholder {
      color: #c4b5fd;
      font-style: italic;
      padding: 0.75rem 0;
    }
  </style>
</head>
<body>
  <header>
    <h1>K-${escapeHtml(ticketId)} — Visual Report</h1>
    <p>Generated at ${escapeHtml(generatedAt)} · Base URL: http://localhost:5173</p>
    <p>Pages: ${successes} captured, ${failures} failed, ${authRequired} auth-required (not captured)</p>
  </header>
  <main>${sectionsHtml}
  </main>
</body>
</html>
`
}

// ── Playwright test describe ────────────────────────────────────────────────

test.describe('K-008 Visual Report', () => {
  test.describe.configure({ mode: 'serial' })

  // W3 修復：results 陣列放 describe closure 內，並由 test.beforeAll 重置，
  // 確保 retries / --repeat-each 等情境下不會累積重複 section。
  // W1 修復：TICKET_ID 在 beforeAll lazy 解析，避免 module load 階段印 warning。
  let ticketId: string
  let outputPath: string
  let results: SectionResult[]

  test.beforeAll(() => {
    ticketId = resolveTicketId()
    outputPath = path.join(OUTPUT_DIR, `K-${ticketId}-visual-report.html`)
    results = []
  })

  for (const route of ROUTES) {
    test(`capture ${route.label} (${route.routePath})`, async ({ page }) => {
      if (route.authRequired) {
        results.push({
          status: 'auth-required',
          label: route.label,
          routePath: route.routePath,
          note: route.authNote ?? '需登入',
        })
        return
      }

      try {
        const response = await page.goto(route.routePath, { waitUntil: 'networkidle' })
        const httpStatus = response?.status() ?? null

        // 取 full-page screenshot（Playwright 會自動滾動 capture 整頁高度）
        const buffer = await page.screenshot({ fullPage: true, type: 'png' })

        // viewport 給定 1280×720（Playwright default），full-page 高度從 layout 推出
        const viewport = page.viewportSize() ?? { width: 1280, height: 720 }
        const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight)

        results.push({
          status: 'success',
          label: route.label,
          routePath: route.routePath,
          screenshotBase64: buffer.toString('base64'),
          width: viewport.width,
          height: documentHeight,
          httpStatus,
        })
      } catch (err) {
        const e = err as Error
        const stackLines = (e.stack ?? '').split('\n').slice(0, 3).join('\n')
        results.push({
          status: 'failure',
          label: route.label,
          routePath: route.routePath,
          errorMessage: e.message ?? String(err),
          errorStack: stackLines,
        })
        // 不 rethrow — 交由 afterAll 聚合後統一決定 exit code
      }
    })
  }

  test.afterAll(async () => {
    // 確保輸出目錄存在
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })

    const html = renderHtml(ticketId, results)
    fs.writeFileSync(outputPath, html, 'utf-8')

    // eslint-disable-next-line no-console
    console.log(`[visual-report] wrote ${outputPath}`)

    // 聚合失敗 → 透過 expect 讓 runner exit code = 1；但 HTML 已寫出
    const failures = results.filter((r) => r.status === 'failure')
    expect(failures, `visual-report: ${failures.length} page(s) failed`).toHaveLength(0)
  })
})
