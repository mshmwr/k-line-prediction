# Release Versioning & CI/CD Design

**Date:** 2026-04-19  
**Ticket:** K-019（待建）  
**Status:** Approved（BQ-1~5 resolved 2026-04-19）

---

## Summary

每次 deploy 觸發版本發布流程：自動產生版本文件、git tag、GitHub Release（含 Playwright 截圖）。目的是建立 UI「時光機」——未來可翻回任一版本查看當時畫面與變更內容。

---

## Acceptance Criteria

**AC-K019-1：本機 release script 執行**
- Given：main 有 commits（含 K-XXX reference）且無重複 tag
- When：執行 `node scripts/create-release.js`
- Then：`docs/releases/vX.X.X.md` 建立，包含正確 tickets 清單
- And：`git tag vX.X.X` 建立
- And：`git push --follow-tags` 觸發 CI

**AC-K019-2：CI pipeline 完整執行**
- Given：tag `v*.*.*` 被 push 到 GitHub
- When：GitHub Actions workflow 執行
- Then：frontend build + Firebase deploy + Cloud Run deploy 全部成功
- And：health check curl 通過
- And：Playwright 對 `PROD_URL` 截出 3 張圖（Home / About / App login）
- And：`gh release create` 建立 Release，含截圖 assets

**AC-K019-3：Release 文件格式**
- Given：release 流程完成
- Then：`docs/releases/vX.X.X.md` 含 frontmatter（version / date / tickets）
- And：GitHub Release body 含版本號、日期、tickets 清單

**AC-K019-4：Deploy 失敗保護**
- Given：CI 中 Firebase 或 Cloud Run deploy 失敗
- When：workflow 執行到該 step
- Then：後續 steps 不執行，不建 GitHub Release

**AC-K019-5：截圖失敗標注**
- Given：Playwright 截圖失敗（timeout / PROD_URL unreachable）
- When：CI 繼續執行到 gh release create
- Then：Release 仍建立，body 標注 `⚠️ 截圖不可用：<失敗原因>`

---

## Versioning Scheme

Semantic versioning：`vMAJOR.MINOR.PATCH`

| 類型 | 說明 |
|------|------|
| MAJOR | 重大功能上線（架構或核心邏輯重寫） |
| MINOR | 一批 tickets deploy（正常 release） |
| PATCH | Hotfix（不含新功能） |

---

## Release Flow

### 本機 Release Script（任何人可跑）

`scripts/create-release.js`，執行方式：

```bash
node scripts/create-release.js [version]
# 例：node scripts/create-release.js v1.1.0
# 不帶版本號時，script 從 PM-dashboard.md ticket 類型自動推論
```

**版本號推論邏輯（不帶參數時）：**
- 含 `feat` 類型 ticket → MINOR increment
- 全為 `fix/test/docs/refactor` → PATCH increment
- MAJOR 需手動帶入（架構重寫時）

**Script 步驟：**
1. 從 `git log <last-tag>..HEAD` grep `K-\d+` 取得本次 tickets（無 last-tag 時用 initial commit 為 base）
2. 建立 `docs/releases/` 目錄（若不存在）
3. 產生 `docs/releases/vX.X.X.md`（見格式）
4. `git commit -m "release: vX.X.X"`
5. `git tag vX.X.X`
6. `git push origin main --follow-tags`

**初始版號：** v1.0.0（Phase 1-3 已完整上線）

### GitHub Actions（CI）負責
觸發條件：`push` 到 tag `v*.*.*`

| Step | 工具 |
|------|------|
| Checkout | actions/checkout |
| Setup Node + Python | actions/setup-node, setup-python |
| Build frontend | `npm run build` |
| Deploy Firebase Hosting | firebase-tools |
| Deploy Cloud Run backend | gcloud CLI |
| Health check（等 Cloud Run ready）| curl poll |
| Playwright 截圖 | `e2e/screenshot.spec.ts` against `PROD_URL` |
| `gh release create` | GitHub CLI，上傳截圖 assets |

無 CI commit-back，無 workflow loop 風險。

---

## Release Document Format

路徑：`docs/releases/vX.X.X.md`（進 git，鎖進 tag snapshot）

```markdown
---
version: vX.X.X
date: YYYY-MM-DD
tickets: [K-XXX, K-YYY]
---

## vX.X.X — YYYY-MM-DD

### 變更內容
- [K-XXX] ticket 標題
- [K-YYY] ticket 標題

### 部署
- Commit: <sha>
- Firebase: https://k-line-xxx.web.app
- Cloud Run: https://api-xxx.run.app
```

---

## Playwright Screenshot Spec

新增 `e2e/screenshot.spec.ts`（不進一般 test suite，CI only）：
- 截頁面：**Home、About、/app 入口畫面**（不做 Playwright login）
- `fullPage: true`
- 輸出至 `release-screenshots/`（.gitignore，只活在 CI artifact）
- 上傳成 GitHub Release asset（PNG）

環境變數：`PROD_URL`（CI 注入，指向 Firebase Hosting URL）

**截圖失敗處理（BQ-3）：**
- 截圖失敗時 CI job 不 fail-fast
- GitHub Release 仍建立，但 body 標注：`⚠️ 截圖不可用：<失敗原因，例：Playwright timeout / PROD_URL unreachable>`
- Deploy 失敗 → fail-fast，不建 Release

**Future Enhancement（/business-logic 頁面實作後）：**  
`/business-logic` 頁面目前尚未實作（K-017 PM 裁決先跳過）。實作完成後，需將 post-auth `/business-logic` 畫面加入截圖 spec。  
→ 屆時在 /business-logic 對應 ticket 中追加此需求，更新 `screenshot.spec.ts`。

---

## GitHub Secrets 需求

| Secret | 用途 |
|--------|------|
| `FIREBASE_TOKEN` | Firebase Hosting deploy |
| `GCP_SA_KEY` | Cloud Run deploy（service account JSON） |
| `GITHUB_TOKEN` | `gh release create`（Actions 內建，無需額外設定） |

---

## GitHub Release Body（Markdown）

````markdown
## vX.X.X — YYYY-MM-DD

### 變更內容
- [K-XXX] ticket 標題

### 截圖
（截圖以 asset 附件形式上傳，見 Assets 區塊）

### 部署資訊
- Commit: <sha>
````

---

## Out of Scope

- 自動 changelog website
- Semantic release bot（版本號由 Claude Code 決定，非自動計算）
- Rollback 機制

---

## Spec Self-Review

- [x] 無 TBD / 未完成段落
- [x] 無內部矛盾（CI 不 commit-back，flow 單向）
- [x] Scope 適合單一 implementation plan
- [x] 無歧義需求
