import type { Page } from '@playwright/test'

/**
 * Shared helper: mock all /api/* routes so E2E tests don't depend on backend.
 *
 * Playwright route-matching 為 LIFO：**後註冊的 handler 先被呼叫**。本 helper 內部：
 *   1. 先註冊 catch-all `/api/**`（fulfill `{}`）— 預設底線，避免任何未預期的 API 打到真實後端
 *   2. 再註冊具體 `/api/history-info`（AppPage 依賴）— 後註冊 = 優先匹配
 *
 * # INVARIANT — 呼叫方擴充規則
 *
 * 若某 spec 需要額外具體 route（e.g. `/api/auth`, `/api/business-logic`），必須
 * **在 test body 內呼叫 `mockApis(page)` 之後**再註冊：
 *
 *   await mockApis(page)
 *   await page.route('/api/auth', route => route.fulfill({ ... }))  // 後註冊 → 搶先匹配
 *   await page.route('/api/business-logic', route => route.fulfill({ ... }))
 *
 * **絕對不要**把 `mockApis(page)` 放在具體 route 後面 — 那樣 catch-all 會變成最後註冊，
 * 搶先攔截具體 route，導致 test 等不到預期資料（Stage 2 K-021 第 6 case 原本就因此 timeout）。
 *
 * 本 helper 用 function 包起來 + 單一 entry point，防止呼叫方弄錯順序。
 * 不用 `route.fallback()` 實作「catch-all fall through」，因為 fallback 需要下游 handler，
 * 本情境的「catch-all」語義是「兜底 fulfill」，不是「傳給下一個」。
 */
export async function mockApis(page: Page): Promise<void> {
  // 1. Catch-all — 先註冊（LIFO 下級）
  await page.route('/api/**', route =>
    route.fulfill({ status: 200, body: '{}' })
  )
  // 2. 常用具體 mock — 後註冊（LIFO 優先匹配）
  await page.route('/api/history-info', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        '1H': { filename: 'test.csv', latest: '2024-01-01 00:00', bar_count: 1000 },
        '1D': { filename: 'test.csv', latest: '2024-01-01', bar_count: 500 },
      }),
    })
  )
}
