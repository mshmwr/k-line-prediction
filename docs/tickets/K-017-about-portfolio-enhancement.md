---
id: K-017
title: /about portfolio-oriented recruiter enhancement
status: open
type: feat
priority: medium
created: 2026-04-19
---

## 背景

目前 `/about` 描述文字以「專案技術棧 + Phase Gate 流程」為主（K-007 更新至 Railway→Firebase+CR），但訊號對象是「讀過 README 的 tech reader」而非「快速瀏覽 portfolio 的 recruiter / hiring manager」。

本 ticket 將 `/about` 重寫為 **portfolio-oriented recruiter page**，主軸為「一個人透過 6 個 AI agent 端到端交付功能，每個 feature 都有 doc trail」。同時在 homepage 上方補一條 thin banner 導入 /about，並補 2 個支援 artifact（audit script + 公開版協議文件）讓陳述能被 recruiter 自行驗證。

文案內容已於 2026-04-19 session 討論定稿（8 sections + 2 scope +1 artifacts），本 ticket 職責為把文案翻成結構化 PRD + AC，並交付 Architect 做組件拆分 + script / protocols doc 架構。

## 範圍

**含（8 sections + 2 scope +1 artifacts）：**

### Section 1 — PageHeaderSection（One operator 聲明 — Option A，42 字）
```
One operator, orchestrating AI agents end-to-end —
PM, architect, engineer, reviewer, QA, designer.
Every feature ships with a doc trail.
```

### Section 2 — Metrics strip（4 narrative metrics + subtext）
| Metric | Subtext |
|--------|---------|
| Features Shipped | 17 tickets, K-001 → K-017 |
| First-pass Review Rate | Reviewer catches issues before QA on most tickets |
| Post-mortems Written | Every ticket has cross-role retrospective |
| Guardrails in Place | Bug Found Protocol, per-role retro logs, audit script |

### Section 3 — 6 Role Cards（Owns X + Artefact）
| Role | Owns | Artefact |
|------|------|----------|
| PM | Requirements, AC, Phase Gates | PRD.md, docs/tickets/K-XXX.md |
| Architect | System design, cross-layer contracts | docs/designs/K-XXX-*.md |
| Engineer | Implementation, stable checkpoints | commits + ticket retrospective |
| Reviewer | Code review, Bug Found Protocol | Review report + Reviewer 反省 |
| QA | Regression, E2E, visual report | Playwright results + docs/reports/*.html |
| Designer | Pencil MCP, flow diagrams | .pen file + get_screenshot output |

### Section 4 — How AI Stays Reliable（3 pillars + V3 mechanism + 1-line anchor）

**Persistent Memory**
File-based memory system indexed in `MEMORY.md` survives every session; past mistakes, preferences, and project state persist cross-conversation.
> *Every "stop doing X" becomes a memory entry — corrections outlive the session.*

**Structured Reflection**
Each role appends to `docs/retrospectives/<role>.md` after every ticket; the PM aggregates cross-role patterns. Bug Found Protocol gates fixes behind mandatory reflection + memory write.
> *No memory write = the bug is not closed.*

**Role Agents**
PM / Architect / Engineer / Reviewer / QA / Designer are separate agents with spec'd responsibilities. Handoffs produce artifacts that `./scripts/audit-ticket.sh K-XXX` can verify end-to-end.
> *No artifact = no handoff.*

Pillar 底部 inline link 進入 `docs/ai-collab-protocols.md`（公開版協議文件）。

### Section 5 — Anatomy of a Ticket（K-002 / K-008 / K-009 trio）
每張票卡片含：Ticket ID + 標題 + 一句 outcome + 一句 learning + 連到 `docs/tickets/K-XXX.md`（GitHub 外部 link）。

- **K-002**（大重構 UI optimization）— 展示 And-clause 系統性遺漏 → 三角色反省 → per-role retro log 機制產生。
- **K-008**（Bug Found Protocol 範例 / 自動化視覺報告 script）— 展示 protocol 四步。
- **K-009**（TDD bug fix — 1H 預測 MA history）— 展示 test-driven discipline。

### Section 6 — Project Architecture snapshot
```
How the codebase stays legible for a solo operator + AI agents.
```

**Monorepo, contract-first**
Frontend (React/TypeScript) and backend (FastAPI/Python) live in one repo. Every cross-layer change starts with a written API contract mapping `snake_case` (backend) ↔ `camelCase` (frontend) — parallel agents implement against it.

**Docs-driven tickets**
Acceptance Criteria are written in Behavior-Driven Development (BDD) style — Given/When/Then/And scenarios — so every Playwright test mirrors the spec 1:1. Flow: PRD → `docs/tickets/K-XXX.md` → role retrospectives.

**Three-layer testing pyramid**
- **Unit** — Vitest (frontend), pytest (backend)
- **Integration** — FastAPI test client
- **E2E** — Playwright, including a visual-report pipeline that renders every page to HTML for human review

### Section 7 — BuiltByAIBanner homepage（Option C）
```
One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*
```
放在 homepage（`/`）上方 thin banner，click 導向 `/about`。

### Section 8 — Footer CTA
```
**Let's talk →** `yichen.lee.20@gmail.com`
Or see the source: [GitHub](https://github.com/mshmwr/k-line-prediction) · [LinkedIn](https://linkedin.com/in/yichenlee-career)
```

### Scope +1 (A): `scripts/audit-ticket.sh`（portfolio demo script, not CI gate）
- Usage: `./scripts/audit-ticket.sh K-XXX`
- Check groups A–G：
  - **A. Ticket file** — frontmatter: id / title / status / type / priority / created；status=closed 時須有 closed date
  - **B. AC** — ticket `## 驗收條件` section 存在；PRD.md 可 grep 到 `AC-XXX-*`
  - **C. Architecture** — `docs/designs/K-XXX-*.md` 存在 OR ticket 明確聲明「無需 Architecture」；若有設計檔則末尾需有 `## Retrospective`
  - **D. Commit trail** — `git log --grep="K-XXX"` ≥ 1 筆；排除 vague msg（wip/fix 等）
  - **E. Code Review** — ticket `## Retrospective` 有 Reviewer 反省段（不用 git log heuristic）
  - **F. Retrospectives (K-008+)** — ticket 有 5 個角色反省 + per-role log 有 `## YYYY-MM-DD — K-XXX` entry
  - **G. QA / Playwright** — grep 對應 spec；visual report HTML 存在 `docs/reports/K-XXX-*.html`
- Exit codes：0 all pass / 1 warning / 2 critical missing
- Output：coloured checklist only（**no --json flag, YAGNI**）
- **Skip F/G for tickets with `created < 2026-04-18`**（K-001~K-007 pre-dates per-role retro 機制）

### Scope +1 (B): `docs/ai-collab-protocols.md`（公開版協議文件）
- Location: `docs/ai-collab-protocols.md`
- 從 `/about` Section 4 "How AI Stays Reliable" 各 pillar 底部 inline link 進入
- Curation 策略：mechanism-focused（Role Flow + Bug Found Protocol + Per-role Retro 機制定義）+ 2–3 條 curated 英文 retrospective 節選（非全部翻譯）

**不含：**
- 新功能邏輯（本票為 `/about` + homepage banner + 支援 artifact，無預測/MA99/history 邏輯改動）
- CI gate 整合 audit-ticket.sh（僅 portfolio demo，`./scripts/audit-ticket.sh` 不接上 pre-commit / GitHub Actions）
- audit-ticket.sh 的 `--json` 輸出（YAGNI，current scope 不需要 machine-readable 格式）
- 全部 retrospective 翻譯進 `ai-collab-protocols.md`（只 curated 2–3 條）
- 其他頁面（/app /diary /business-logic）改動
- NavBar / Footer 以外的 homepage 結構改動（僅加 thin banner，不動其他 section）
- K-001~K-007 回填 per-role retrospective（audit script F/G 對這批 ticket 直接 skip）

## 設計決策紀錄

| 決策項目 | 內容 | 來源 | 時間 |
|----------|------|------|------|
| Target audience | `/about` 主訊號對象為 recruiter / hiring manager，不是 tech reader | 使用者確認 | 2026-04-19 |
| Header 文案選項 | Option A（42 字，strong claim + "every feature ships with a doc trail"），不選 Option B/C | 使用者確認 | 2026-04-19 |
| Metrics 策略 | 4 個 narrative metric，不上 dashboard 計數器（資料量不足以支撐 CI-style number；用「has/does」敘述避開「exactly N%」語義） | 使用者確認 | 2026-04-19 |
| 6 role cards 格式 | 「Owns X + Artefact」，不用「Responsibility + Tools」；artefact 欄位直接給 filesystem path 讓 recruiter 可驗證 | 使用者確認 | 2026-04-19 |
| Pillar 選擇 | 3 pillars（Persistent Memory / Structured Reflection / Role Agents），不展開至 5 pillars | 使用者確認 | 2026-04-19 |
| Pillar 結構 | V3（3 段落 + 每段 1-line anchor），anchor 引用句改為 italic blockquote | 使用者確認 | 2026-04-19 |
| Ticket trio 選擇 | K-002 / K-008 / K-009 三張為 anatomy 代表 — 各自示範 And-clause discipline / Bug Found Protocol / TDD，不全列 17 張 | 使用者確認 | 2026-04-19 |
| Architecture snapshot 範圍 | 只含 monorepo contract-first / docs-driven tickets / 3-layer testing 三點，不展開至資料層/部署細節（後者在 GitHub README） | 使用者確認 | 2026-04-19 |
| Homepage banner 文案 | Option C — 「One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*」，不選 Option A/B | 使用者確認 | 2026-04-19 |
| Banner 位置 | homepage 最上方 thin banner，click 導 `/about`；不改其他 homepage section | 使用者確認 | 2026-04-19 |
| Footer CTA 內容 | email + GitHub + LinkedIn 三連結，不加 resume download / phone | 使用者確認 | 2026-04-19 |
| audit-ticket.sh 定位 | portfolio demo script，not CI gate；no --json flag (YAGNI) | 使用者確認 | 2026-04-19 |
| audit F/G skip 規則 | `created < 2026-04-18` 的 ticket 直接 skip F/G（per-role retro 機制啟用前） | 使用者確認 | 2026-04-19 |
| protocols doc curation | mechanism-focused + 2–3 條 curated 英文 retrospective 節選，不全譯 | 使用者確認 | 2026-04-19 |
| Curated retrospective 3 條選擇（**revised 2026-04-19**） | (1) **Engineer K-008 W4** — env var as tainted source（**Persistent Memory** pillar；呼應「corrections outlive the session」—「sanitize by sink not source」已提煉成 memory rule，最能示範「memory rule 跨 session 保存」的作用）；(2) **Engineer K-002** — And-clause 系統性遺漏（**Structured Reflection** pillar；Engineer 實作時習慣性略過 And 子句導致 SectionHeader icon 漏實作，此事件直接催生 per-role retro log 機制，最能示範「reflection 機制如何誕生」）；(3) **Architect K-008 W2/S3** — truth table 設計紀律（**Role Agents** pillar；獨立 Architect agent 因 Bug Found Protocol 四步被逼出「配置/狀態 × 執行時機」truth table 紀律，示範獨立 role agent 的價值）。三條跨 3 個 ticket（K-008 / K-002 / K-008）、跨 2 個 role（Engineer / Architect），符合設計檔 §4.4 原則 1（有根因+改善）/ 2（跨 role）/ 3（跨 ticket，避免全 K-008 同族）；K-002 條目原文為中文，需英譯對齊 `/about` 英文基調；K-008 二條原文為英文，不需翻譯。**Revision 原因：** 使用者 2026-04-19 回饋要求 3 條跨 3 ticket 而非全 K-008，把原 Reviewer K-008 條目替換為 Engineer K-002 And-clause 遺漏，並把 Architect K-008 pillar 從 Structured Reflection 調整到 Role Agents。§4.4 原則 4（避免 memory 已收）本次仍對 Engineer K-008 W4 刻意 deviate（「sanitize by sink not source」已在 memory index），理由為「受眾不同：memory 給 agent 讀 / protocols doc 給 recruiter 讀；memory 已收代表此條最重要，值得對外展示」 | PM 裁決 | 2026-04-19 |
| `frontend/public/docs/` copy 方案 | Option 1 — build step 加 `prebuild` hook，用 bash `cp docs/ai-collab-protocols.md frontend/public/docs/` 於 `frontend/package.json` scripts 加 `"prebuild": "mkdir -p public/docs && cp ../docs/ai-collab-protocols.md public/docs/"`。不選 Option 2（手動 copy 必 drift）/ Option 3（symlink 跨平台不安全）/ Option 4（Vite plugin 引額外依賴 `vite-plugin-static-copy`，對單檔 overkill）。需補 AC-017-BUILD 明示 build-time artifact 同步機制 | PM 裁決 | 2026-04-19 |

## 放行狀態

**PRD locked。放行 Architect。** 8 sections + 2 scope +1 artifacts 文案 + 設計決策全部定稿，AC 完整覆蓋，no blocking question。Architect 下一步負責 `/about` 組件樹拆分 + props interface + `scripts/audit-ticket.sh` 架構設計 + `docs/ai-collab-protocols.md` 文件結構設計。

## 驗收條件

### AC-017-HEADER：PageHeaderSection 呈現 One operator 聲明 `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面載入完成
**Then** 頁面最上方顯示 PageHeaderSection，文字內容為 "One operator, orchestrating AI agents end-to-end — PM, architect, engineer, reviewer, QA, designer. Every feature ships with a doc trail."
**And** 文字呈現為視覺上的 hero heading（`h1` 或同級視覺層次），字級大於 body 文字
**And** 六個角色名（PM / architect / engineer / reviewer / QA / designer）以逗號分隔正確列出，拼寫與大小寫與上述一致
**And** 結尾句 "Every feature ships with a doc trail." 獨立視覺段落（換行或獨立 `<p>` / `<span>`），不被擠進同一行
**And** Header 區塊 Playwright 斷言使用 `{ exact: true }` 比對文字，避免 description 誤命中

---

### AC-017-METRICS：Metrics strip 四條 narrative metric + subtext `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 Metrics 區塊
**Then** 顯示 4 個 metric card，依序為：Features Shipped / First-pass Review Rate / Post-mortems Written / Guardrails in Place
**And** Features Shipped 的 subtext 為 "17 tickets, K-001 → K-017"
**And** First-pass Review Rate 的 subtext 為 "Reviewer catches issues before QA on most tickets"
**And** Post-mortems Written 的 subtext 為 "Every ticket has cross-role retrospective"
**And** Guardrails in Place 的 subtext 為 "Bug Found Protocol, per-role retro logs, audit script"
**And** 所有 metric 以 narrative 敘述呈現，**不得出現 "exactly N%"** 這類精確數值宣告（未提供 CI 驗證資料）
**And** Playwright 斷言逐條驗證 4 個 metric title 與其對應 subtext，不依 index 定位

---

### AC-017-ROLES：6 Role Cards 呈現 Owns X + Artefact `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Role Cards" 區塊
**Then** 顯示 6 張 role card，依序為 PM / Architect / Engineer / Reviewer / QA / Designer
**And** 每張卡片含兩個欄位：`Owns`（責任） 與 `Artefact`（交付物路徑）
**And** PM 卡片 Owns = "Requirements, AC, Phase Gates"、Artefact = "PRD.md, docs/tickets/K-XXX.md"
**And** Architect 卡片 Owns = "System design, cross-layer contracts"、Artefact = "docs/designs/K-XXX-*.md"
**And** Engineer 卡片 Owns = "Implementation, stable checkpoints"、Artefact = "commits + ticket retrospective"
**And** Reviewer 卡片 Owns = "Code review, Bug Found Protocol"、Artefact = "Review report + Reviewer 反省"
**And** QA 卡片 Owns = "Regression, E2E, visual report"、Artefact = "Playwright results + docs/reports/*.html"
**And** Designer 卡片 Owns = "Pencil MCP, flow diagrams"、Artefact = ".pen file + get_screenshot output"
**And** Playwright 斷言逐卡片驗證 Role name + Owns + Artefact 三欄位，共 18 條斷言（6 × 3）

---

### AC-017-PILLARS：How AI Stays Reliable 三支柱 + mechanism + anchor `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "How AI Stays Reliable" 區塊
**Then** 顯示 3 個 pillar，依序為 Persistent Memory / Structured Reflection / Role Agents
**And** Persistent Memory pillar 描述含 "`MEMORY.md`" 與 "cross-conversation" 關鍵詞
**And** Persistent Memory 底部 anchor 引用為 italic blockquote：`> *Every "stop doing X" becomes a memory entry — corrections outlive the session.*`
**And** Structured Reflection pillar 描述含 "`docs/retrospectives/<role>.md`" 與 "Bug Found Protocol" 關鍵詞
**And** Structured Reflection 底部 anchor 引用為：`> *No memory write = the bug is not closed.*`
**And** Role Agents pillar 描述含 "PM / Architect / Engineer / Reviewer / QA / Designer" 與 "`./scripts/audit-ticket.sh K-XXX`" 關鍵詞
**And** Role Agents 底部 anchor 引用為：`> *No artifact = no handoff.*`
**And** 每個 pillar 底部有 inline link 導向 `/docs/ai-collab-protocols.md`（同網站內相對 path）
**And** Playwright 斷言驗證 3 個 pillar title + 3 個 anchor blockquote + 3 個 inline link 目標 URL

---

### AC-017-TICKETS：Anatomy of a Ticket 呈現 K-002 / K-008 / K-009 trio `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Anatomy of a Ticket" 區塊
**Then** 顯示 3 張 ticket 卡片，依序為 K-002 / K-008 / K-009
**And** 每張卡片含：Ticket ID / 標題 / 一句 outcome / 一句 learning / 外部連結
**And** K-002 卡片標題為 "UI optimization"（或中英對照版）；outcome 描述大重構並展示 And-clause 系統性遺漏被三角色反省攔截；learning 指向「per-role retro log 機制因此建立」
**And** K-008 卡片標題為 "Visual report script"；outcome 描述自動化視覺報告 script 完整流程；learning 指向「Bug Found Protocol 四步示範」
**And** K-009 卡片標題為 "1H MA history fix"；outcome 描述 1H 預測 MA history 來源錯誤的 TDD bug fix；learning 指向「test-driven discipline 示範」
**And** 每張卡片的外部連結導向該 ticket 的 GitHub 檔案（e.g. `https://github.com/mshmwr/k-line-prediction/blob/main/docs/tickets/K-002-ui-optimization.md`）
**And** Playwright 斷言驗證 3 張卡片的 ID / 標題 / 連結 href

---

### AC-017-ARCH：Project Architecture snapshot 三個點 `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至 "Project Architecture" 區塊
**Then** 顯示 intro 句 "How the codebase stays legible for a solo operator + AI agents."
**And** 顯示三個子區塊：`Monorepo, contract-first` / `Docs-driven tickets` / `Three-layer testing pyramid`
**And** Monorepo 區塊描述含 "React/TypeScript" / "FastAPI/Python" / "`snake_case` (backend) ↔ `camelCase` (frontend)" 關鍵詞
**And** Docs-driven tickets 區塊描述含 "Given/When/Then/And" / "Playwright test mirrors the spec 1:1" / "PRD → `docs/tickets/K-XXX.md` → role retrospectives" 關鍵詞
**And** Three-layer testing pyramid 區塊列三層：`Unit — Vitest (frontend), pytest (backend)` / `Integration — FastAPI test client` / `E2E — Playwright, including a visual-report pipeline that renders every page to HTML for human review`
**And** Playwright 斷言驗證 3 個子區塊 title + 各自關鍵詞存在

---

### AC-017-BANNER：Homepage BuiltByAIBanner `[K-017]`

**Given** 使用者訪問 `/`（homepage）
**When** 頁面載入完成
**Then** homepage 最上方（NavBar 下方、Hero 上方）顯示 thin banner
**And** banner 文字為 "One operator. Six AI agents. Every ticket leaves a doc trail. *See how →*"
**And** "See how →" 為視覺強調（italic 或 link underline），整條 banner clickable
**And** click banner 導向 `/about`（SPA 路由，不發生全頁 reload）
**And** banner 樣式為「thin」（視覺上不得搶走 Hero 的主視覺位置，高度明顯小於 Hero）
**And** banner 存在不破壞 AC-HOME-1 既有斷言（Hero / 專案邏輯 / 技術棧 / 開發日記四個 Section 仍顯示）
**And** Playwright 斷言：banner 文字存在（`{ exact: true }`）+ click 後 URL 為 `/about`

---

### AC-017-FOOTER：Footer CTA email + GitHub + LinkedIn `[K-017]`

**Given** 使用者訪問 `/about`
**When** 頁面滾動至底部
**Then** 顯示 Footer CTA 區塊
**And** 顯示 "Let's talk →" 文字開頭
**And** 顯示 email：`yichen.lee.20@gmail.com`（`mailto:` 連結）
**And** 顯示 "Or see the source:" 引導句後接 GitHub 與 LinkedIn 兩個連結
**And** GitHub 連結 href = `https://github.com/mshmwr/k-line-prediction`，顯示文字為 "GitHub"
**And** LinkedIn 連結 href = `https://linkedin.com/in/yichenlee-career`，顯示文字為 "LinkedIn"
**And** 三個連結在新分頁開啟（`target="_blank"` + `rel="noopener noreferrer"`）
**And** Playwright 斷言驗證三個 href 完整匹配 + `mailto:` prefix 正確

---

### AC-017-AUDIT：audit-ticket.sh 可執行並輸出 A–G checklist `[K-017]`

**Given** 專案根目錄已有 `scripts/audit-ticket.sh`
**When** 執行 `./scripts/audit-ticket.sh K-002`（closed ticket，created=2026-04-16 < 2026-04-18 → skip F/G）
**Then** script exit code 為 0（全 pass）
**And** stdout 含 A / B / C / D / E 五組 check 結果（彩色 checklist 格式）
**And** F / G 兩組標記為 SKIP（reason: `created < 2026-04-18`）

**Given** 同上 script
**When** 執行 `./scripts/audit-ticket.sh K-008`（closed ticket，created=2026-04-18 → 含 F/G）
**Then** exit code 為 0
**And** stdout 含 A–G 全部 7 組 check 結果
**And** F 組確認 ticket `## Retrospective` 有 5 個角色反省段 + per-role log 有對應 `## YYYY-MM-DD — K-008` entry
**And** G 組確認 Playwright spec 有 grep 到 K-008 + `docs/reports/K-008-*.html` 存在

**Given** 同上 script
**When** 執行 `./scripts/audit-ticket.sh K-999`（不存在的 ticket）
**Then** exit code 為 2（critical missing）
**And** stdout 明確報告 A 組 fail（ticket file 不存在）

**Given** 同上 script
**When** 執行一個 closed ticket 的 commit trail 僅為 vague msg（e.g. 所有 commit msg 均為 "wip" / "fix"）
**Then** D 組標記為 warning（exit code ≥ 1），明確提示 vague msg 被排除

**And** script 不提供 `--json` flag（YAGNI）
**And** script 用 bash，不依賴 node / python runtime
**And** 輸出為人類可讀 coloured checklist，不為 machine-readable JSON

---

### AC-017-PROTOCOLS：docs/ai-collab-protocols.md 公開版文件 `[K-017]`

**Given** 專案根目錄已有 `docs/ai-collab-protocols.md`
**When** 任何人（含 recruiter）開啟該檔
**Then** 文件含三個主要 section：`Role Flow` / `Bug Found Protocol` / `Per-role Retrospective Log`
**And** Role Flow section 定義 6 角色名稱與職責（對應 `/about` Section 3 的 Owns X）
**And** Bug Found Protocol section 列出四步（反省 → PM 確認反省品質 → 寫 memory → 放行修復），並引用 K-008 / K-009 為示範
**And** Per-role Retrospective Log section 說明 `docs/retrospectives/<role>.md` 機制 + K-008 起啟用 + 條目格式（YYYY-MM-DD / 做得好 / 沒做好 / 下次改善）
**And** 文件含 **3 條 curated 英文 retrospective 節選**（非全翻譯所有 retro），每條明確標註 ticket ID + role + 原文出處連結；3 條為：
  - **Engineer K-008 W4** — env var as tainted source（掛在 **Persistent Memory** pillar 底下；原文英文，不需翻譯）
  - **Engineer K-002** — And-clause systematic omission（掛在 **Structured Reflection** pillar 底下；原文中文，需英譯並對齊英文基調。建議英譯：*"The And-clause for SectionHeader icons (AC-002-ICON And 3) was silently skipped during implementation because I habitually parse AC as Given/When/Then and treat And-clauses as secondary. The bug passed Engineer, Architect-review, and QA gates before Code Review caught it. From this ticket onward, every implementation starts by enumerating all Then/And clauses as a flat checklist, and every And gets a Playwright assertion."*）
  - **Architect K-008 W2/S3** — truth table discipline for config × execution timing（掛在 **Role Agents** pillar 底下；原文英文，不需翻譯）
**And** `/about` Section 4 的三個 pillar 底部 inline link 均導向此檔的對應 anchor（Persistent Memory → Per-role Retrospective Log / Structured Reflection → Bug Found Protocol / Role Agents → Role Flow）
**And** 文件以英文撰寫（對齊 `/about` 的英文文案基調），不為全翻譯的中文版

---

### AC-017-BUILD：`docs/ai-collab-protocols.md` build-time 同步至 `frontend/public/docs/` `[K-017]`

**Given** 專案根目錄已有 `docs/ai-collab-protocols.md`（source of truth）
**When** 執行 `npm run build`（`frontend/` 目錄下）
**Then** `frontend/package.json` 的 `prebuild` hook 自動執行，將 `docs/ai-collab-protocols.md` 複製到 `frontend/public/docs/ai-collab-protocols.md`
**And** build 產出的 `frontend/dist/docs/ai-collab-protocols.md` 存在且內容與 source of truth 完全相同（byte-for-byte）
**And** Firebase Hosting deploy 後，訪問 `https://<prod-domain>/docs/ai-collab-protocols.md` 回傳 markdown 原始文字（HTTP 200 + `Content-Type: text/markdown` 或 `text/plain`），不被 SPA fallback 導回 HomePage
**And** `/about` Section 4 的三個 pillar inline link（`/docs/ai-collab-protocols.md#...`）於 production 環境 click 後可正確跳轉至該 markdown 檔的對應 anchor

**Given** 開發者更新 `docs/ai-collab-protocols.md` 內容
**When** 重新執行 `npm run build`
**Then** `frontend/public/docs/ai-collab-protocols.md` 被覆寫為最新版本（無需手動同步）
**And** 若 `frontend/public/docs/` 目錄不存在，prebuild hook 自動建立（`mkdir -p`）

**And** `frontend/public/docs/ai-collab-protocols.md` 不得 commit 進 git（在 `.gitignore` 加 `frontend/public/docs/`），避免雙份 source of truth 造成 drift
**And** Playwright E2E 新增一條斷言：navigate 至 `/docs/ai-collab-protocols.md` 得到 markdown 文字（或 raw content，body 含 `# AI Collaboration Protocols` 標題），而非 HomePage `<html>` 回應
**And** `prebuild` script 若找不到 `../docs/ai-collab-protocols.md`（例如 source file 被誤刪 / 路徑重構未同步）必須以 **non-zero exit code 失敗**，不得 silent skip；失敗訊息明確指出缺失檔案絕對路徑，避免 source file 遺失卻仍 build 成功、production 訪問 `/docs/ai-collab-protocols.md` 得到 stale 或 404

---

## 相關連結

- [PRD.md — K-017 section](../../PRD.md#k-017-about-portfolio-enhancement)
- [PM-dashboard.md](../../../PM-dashboard.md)
- [K-002 ticket（示範）](./K-002-ui-optimization.md)
- [K-008 ticket（示範）](./K-008-visual-report.md)
- [K-009 ticket（示範）](./K-009-1h-ma-history-fix.md)

---

## Retrospective

（Architect / Engineer / Reviewer / QA / Designer 各自於完成階段補上反省；PM 於 QA PASS 後彙整）
