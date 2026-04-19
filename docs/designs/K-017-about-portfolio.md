---
title: K-017 — /about portfolio-oriented recruiter enhancement — Architecture
type: design
tags: [K-017, Architecture, Frontend, Scripts, Docs]
status: draft
authors: [senior-architect]
related_ticket: docs/tickets/K-017-about-portfolio-enhancement.md
updated: 2026-04-19
---

## Summary

K-017 重寫 `/about` 為 portfolio-oriented recruiter page（8 sections），在 homepage 加一條導向 `/about` 的 thin banner，並交付兩個支援 artifact（`scripts/audit-ticket.sh` + `docs/ai-collab-protocols.md`）。本設計為純 UI + docs/script 新增，無跨層 API 合約變更、無後端異動。

**主要決策：**
1. `/about` 組件樹採「每個 PRD section = 一個 Section 容器組件 + 多個 presentational sub-component」的粒度，既有 14 個 about/ 組件只保留 1 個（`RoleCard` 需重設 interface），其餘 13 個刪除。
2. `audit-ticket.sh` 採 bash function 模組化 + ANSI escape 上色 + early-skip-by-date，不引入 jq / yq / node 依賴。
3. `ai-collab-protocols.md` 以 mechanism 三段 + curated retrospective appendix 組織，每段首標 stable anchor ID 讓 `/about` inline link 跳轉。

---

## 1. 技術方案選擇

### 決策 A：`/about` 組件拆分粒度

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| A1. 單檔 AboutPage.tsx 含所有 JSX | 一個 600+ 行大檔；所有 section 行內 | 易讀行順、難單測、違反既有 components/about/ 子目錄慣例 |
| A2. 每 PRD section = 一個容器組件 + 需要時再切 sub-component（推薦） | 8 個 `*Section.tsx`（7 個新增 + 1 個 `PageHeaderSection` 改寫）；MetricCard / RoleCard / PillarCard / TicketAnatomyCard / ArchPillarCard / FooterCtaLink 等 sub-component | 對齊現有 about/ 子目錄慣例、Playwright 可用 `data-section` attr 或 section heading 鎖定、每檔 < 120 行 |
| A3. 一張大 config JSON 驅動 + 泛用 SectionRenderer | 文案集中、組件少 | Playwright 無法用 structural selector 精準斷言，且 AC-017-ROLES 18 條斷言對欄位 ordering 敏感，data-driven render 容易漂移 |

**推薦：A2。** Playwright 斷言（AC 規定每區 3~9 條）需要可辨識的 semantic container；既有 `about/` 目錄已有子組件慣例，延用讓讀 codebase 的 recruiter 看到一致風格。

### 決策 B：`audit-ticket.sh` bash 結構

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| B1. 單一 main 函式 + inline check | 快速 | 難讀、難擴充、check group 界線糊 |
| B2. 每個 check group 一個 bash function（推薦） | `check_a_ticket_file` / `check_b_ac` / … / `check_g_qa` 7 個 function + `main` dispatcher + `log_ok` / `log_warn` / `log_fail` / `log_skip` utility | 模組化清楚、未來要加 H/I group 只加 function 即可、echo 邏輯集中方便測 |
| B3. 引入 jq / yq 解 frontmatter | parse 精準 | 引入非 stdlib 依賴，違反 AC「bash，不依賴 node / python runtime」；macOS 預設無 jq |

**推薦：B2。** Frontmatter 欄位只讀 `id` / `title` / `status` / `type` / `priority` / `created`，用 `grep -E` + `sed` 可解；額外一層 jq 依賴不划算。

### 決策 C：`ai-collab-protocols.md` 文件組織

| 方案 | 描述 | Trade-off |
|------|------|-----------|
| C1. 三 section flat 列（推薦） | `## Role Flow` / `## Bug Found Protocol` / `## Per-role Retrospective Log`，每段含 intro + subsection + appendix 引 retrospective 節選 | 簡單、anchor ID 穩定（markdown h2 自動 slug）、recruiter 線性讀得完 |
| C2. 依「人 / 機制 / 證據」主題分類 | 更敘事化 | anchor 不對應 `/about` pillar 名稱，需額外 map 表 |
| C3. 每條 retrospective 一 section | 最細 | 太長、破壞 mechanism-focused 原則（見 K-017 PRD curation 策略） |

**推薦：C1。** 對齊 PRD 既有三 section 命名 + `/about` Section 4 pillar inline link 目標明確。

---

## 2. 組件樹拆分（`/about` + homepage banner）

### 2.1 AboutPage 新組件樹

```
AboutPage.tsx
  ├─ <UnifiedNavBar />                              (既有，不動)
  ├─ <PageHeaderSection />                          (S1 — 改寫既有檔)
  ├─ <MetricsStripSection />                        (S2 — 新增)
  │     └─ <MetricCard title subtext /> × 4
  ├─ <RoleCardsSection />                           (S3 — 新增)
  │     └─ <RoleCard role owns artefact /> × 6      (既有 RoleCard 重設 interface)
  ├─ <ReliabilityPillarsSection />                  (S4 — 新增)
  │     └─ <PillarCard title body anchorQuote docsHref /> × 3
  ├─ <TicketAnatomySection />                       (S5 — 新增)
  │     └─ <TicketAnatomyCard id title outcome learning href /> × 3
  ├─ <ProjectArchitectureSection />                 (S6 — 新增)
  │     └─ <ArchPillarBlock title body testingPyramid? /> × 3
  └─ <FooterCtaSection />                           (S8 — 新增)
        └─ <FooterCtaLink href label external /> × 3 (email / GitHub / LinkedIn)
```

**S7 — `BuiltByAIBanner`** 放在 `HomePage.tsx`，不在 AboutPage（見 2.3）。

### 2.2 既有 about/ 檔案處置

| 檔名 | 動作 | 理由 |
|------|------|------|
| `PageHeaderSection.tsx` | **改寫**（保留檔名） | S1 新文案取代舊 "What Is This Project?" |
| `RoleCard.tsx` | **重設 interface**（保留檔名） | 由 `responsibilities: string[]` 改為 `owns: string; artefact: string`，符合 AC-017-ROLES |
| `AiCollabSection.tsx` | **刪除** | 舊 5-role cards 被 S3 新 6-role cards 取代 |
| `HumanAiSection.tsx` / `ContributionColumn.tsx` | **刪除** | 舊人機對比，PRD 不再含 |
| `TechDecSection.tsx` / `TechDecCard.tsx` | **刪除** | 舊 tech decisions，被 S6 architecture snapshot 取代 |
| `TechStackSection.tsx` / `TechStackRow.tsx` | **刪除** | 舊 tech stack 表，S6 含必要關鍵詞 |
| `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` | **刪除** | PRD 無截圖區 |
| `FeaturesSection.tsx` / `FeatureBlock.tsx` | **刪除** | PRD 無 features 清單區 |
| `PhaseGateBanner.tsx` | **刪除** | AiCollabSection 附屬，連帶刪 |

**新增**（放 `frontend/src/components/about/`）：
`MetricsStripSection.tsx` / `MetricCard.tsx` / `RoleCardsSection.tsx` / `ReliabilityPillarsSection.tsx` / `PillarCard.tsx` / `TicketAnatomySection.tsx` / `TicketAnatomyCard.tsx` / `ProjectArchitectureSection.tsx` / `ArchPillarBlock.tsx` / `FooterCtaSection.tsx` / `FooterCtaLink.tsx`

### 2.3 Homepage BuiltByAIBanner 放置

**位置：** `HomePage.tsx` 內，`<UnifiedNavBar />` 下方、`<HeroSection />` 上方（thin banner 在 nav 與 hero 之間，符合 PRD「最上方 thin banner」）。

**組件檔：** `frontend/src/components/home/BuiltByAIBanner.tsx`（新增，放 home/ 子目錄）

**Link 機制：** 用 `react-router-dom` 的 `Link to="/about"`（SPA 導航，符合 AC「不發生全頁 reload」）。整條 banner 為單一 `<Link>` 包裹，確保 banner 任何位置 click 都有效。

```tsx
// HomePage.tsx 新增一行（pseudo-code）
<UnifiedNavBar />
<BuiltByAIBanner />            // ← 新增
<HeroSection />
<ProjectLogicSection />
<DevDiarySection … />
```

### 2.4 Props Interface（TypeScript pseudo-code）

```ts
// PageHeaderSection — 無 props，文案寫死對應 AC-017-HEADER
interface PageHeaderSectionProps {}

// MetricsStripSection — 無 props，內部定義 4 筆 MetricCard data
interface MetricCardProps {
  title: string
  subtext: string
}

// RoleCardsSection — 無 props，內部定義 6 筆 role data
interface RoleCardProps {
  role: 'PM' | 'Architect' | 'Engineer' | 'Reviewer' | 'QA' | 'Designer'
  owns: string         // e.g. "Requirements, AC, Phase Gates"
  artefact: string     // e.g. "PRD.md, docs/tickets/K-XXX.md"
}

// ReliabilityPillarsSection — 無 props
interface PillarCardProps {
  title: 'Persistent Memory' | 'Structured Reflection' | 'Role Agents'
  body: ReactNode                    // 可能含 <code>，用 ReactNode 保留格式化彈性
  anchorQuote: string                // blockquote italic 引用句
  docsHref: string                   // e.g. "/docs/ai-collab-protocols.md#per-role-retrospective-log"
}

// TicketAnatomySection — 無 props
interface TicketAnatomyCardProps {
  id: 'K-002' | 'K-008' | 'K-009'
  title: string                      // e.g. "UI optimization"
  outcome: string                    // 一句 outcome
  learning: string                   // 一句 learning
  githubHref: string                 // 完整 GitHub blob URL
}

// ProjectArchitectureSection — 無 props
interface ArchPillarBlockProps {
  title: 'Monorepo, contract-first' | 'Docs-driven tickets' | 'Three-layer testing pyramid'
  body: ReactNode
  testingPyramid?: Array<{ layer: 'Unit' | 'Integration' | 'E2E'; detail: string }>
}

// FooterCtaSection
interface FooterCtaLinkProps {
  href: string
  label: string
  external: boolean                  // true → target=_blank + rel=noopener noreferrer
}

// Homepage banner
interface BuiltByAIBannerProps {}    // 無 props；文案寫死對應 AC-017-BANNER
```

**Why no props for Section roots：** 所有文案由 PRD / AC 鎖死，不需外部注入；寫死在組件內讓 grep 找 AC 文字時一步即到。Sub-component（MetricCard / RoleCard / …）接 props 以減少重複 JSX。

---

## 3. `scripts/audit-ticket.sh` 架構

### 3.1 檔案位置

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/scripts/audit-ticket.sh`
（`scripts/` 目錄不存在 → 新建；不是 `frontend/scripts/` 或 `backend/scripts/`，因為此 script 對整個 K-Line-Prediction 子專案做 audit）

### 3.2 模組化（bash function 拆分）

```bash
# Pseudo-code structure — 非實作

set -euo pipefail

# ── Utilities ─────────────────────────────────────
log_ok()    { printf '\033[0;32m[OK]\033[0m    %s\n' "$1"; }
log_warn()  { printf '\033[0;33m[WARN]\033[0m  %s\n' "$1"; warn_count=$((warn_count+1)); }
log_fail()  { printf '\033[0;31m[FAIL]\033[0m  %s\n' "$1"; fail_count=$((fail_count+1)); }
log_skip()  { printf '\033[0;90m[SKIP]\033[0m  %s\n' "$1"; }
header()    { printf '\n\033[1m=== %s ===\033[0m\n' "$1"; }

# Detect if stdout is TTY — when piped / CI, disable colour via NO_COLOR fallback
if [[ ! -t 1 ]] || [[ -n "${NO_COLOR:-}" ]]; then
  # redefine log_* to strip ANSI
fi

# Parse frontmatter field (grep + sed)
read_frontmatter_field() { … ; }     # $1=file, $2=field_name

# Date comparison helper — returns 0 if $1 < $2 (YYYY-MM-DD string compare works)
date_lt() { [[ "$1" < "$2" ]]; }

# ── Check Groups ──────────────────────────────────
check_a_ticket_file()      { … }    # frontmatter 必填 + status=closed 時須有 closed date
check_b_ac()               { … }    # ## 驗收條件 section 存在 + PRD.md grep "AC-XXX-"
check_c_architecture()     { … }    # docs/designs/K-XXX-*.md 存在 OR ticket 聲明「無需 Architecture」; 設計檔需 ## Retrospective
check_d_commit_trail()     { … }    # git log --grep="K-XXX" ≥ 1 + 排除 vague msg (wip/fix only)
check_e_code_review()      { … }    # ticket ## Retrospective 有 Reviewer 反省段
check_f_retrospectives()   { … }    # 5 角色反省段 + per-role log 有 ## YYYY-MM-DD — K-XXX entry
check_g_qa_playwright()    { … }    # grep spec + docs/reports/K-XXX-*.html 存在

# ── Main Dispatcher ───────────────────────────────
main() {
  local ticket_id="$1"
  local ticket_file="docs/tickets/${ticket_id}-*.md"
  # glob expansion → 取第一個 match

  header "Ticket ${ticket_id}"

  # A is hard prerequisite — if fails, exit 2 immediately
  check_a_ticket_file "$ticket_id" || { log_fail "A failed; cannot continue"; exit 2; }

  check_b_ac "$ticket_id"
  check_c_architecture "$ticket_id"
  check_d_commit_trail "$ticket_id"
  check_e_code_review "$ticket_id"

  # F/G skip logic
  local created
  created=$(read_frontmatter_field "$actual_ticket_file" "created")
  if date_lt "$created" "2026-04-18"; then
    log_skip "F (created=$created < 2026-04-18 — per-role retro 機制啟用前)"
    log_skip "G (same reason)"
  else
    check_f_retrospectives "$ticket_id"
    check_g_qa_playwright "$ticket_id"
  fi

  # Summary + exit code
  if (( fail_count > 0 )); then exit 2; fi
  if (( warn_count > 0 )); then exit 1; fi
  exit 0
}

main "$@"
```

### 3.3 Exit code 規則

| Exit | 意義 | 觸發條件 |
|------|------|----------|
| 0 | All pass | 無 FAIL、無 WARN |
| 1 | Warning | 至少 1 個 WARN（e.g. D 組 vague commit msg）且無 FAIL |
| 2 | Critical missing | 至少 1 個 FAIL（e.g. ticket file 不存在、AC 段缺） |

### 3.4 Date-based skip 邏輯

- `created < 2026-04-18` → skip F / G（不計 WARN / FAIL，純資訊）
- 字串比較即可：bash 的 `[[ "$a" < "$b" ]]` 對 `YYYY-MM-DD` 字典序正確
- 邊界：`created = 2026-04-18` → **不 skip**（含等號的那天起啟用機制，與 PRD "K-008 起啟用" 對齊）

### 3.5 Output 著色策略

- 用 **ANSI escape code**（`\033[...m`），不用 `tput`：`tput` 依賴 terminfo，某些 CI runner / `less -R` 有相容問題
- TTY detect：`[[ -t 1 ]]`，非 TTY 或 `NO_COLOR` env var 設定時 → 重新定義 `log_*` 為無色版本
- Symbol 統一：`[OK]` / `[WARN]` / `[FAIL]` / `[SKIP]`，不用 emoji（對齊 CLAUDE.md 規範 + 對 old-school CI log viewer 相容）

### 3.6 檔案路徑假設

| 類別 | 路徑模板 | Check |
|------|----------|-------|
| Ticket | `docs/tickets/K-XXX-*.md`（glob） | A, B, E, F |
| Design | `docs/designs/K-XXX-*.md`（glob，可多份） | C |
| PRD | `PRD.md`（專案根） | B |
| Per-role retro | `docs/retrospectives/{pm,architect,engineer,reviewer,qa,designer}.md` | F |
| Visual report | `docs/reports/K-XXX-*.html`（glob） | G |
| Playwright specs | `frontend/e2e/*.spec.ts`（grep K-XXX） | G |
| Git log | `git log --all --grep="K-XXX" --oneline` | D |

**Working directory 約定：** script 必須從專案根目錄（K-Line-Prediction/）執行。script 開頭加：
```bash
cd "$(dirname "$0")/.." || exit 2    # 自動切到專案根
```

---

## 4. `docs/ai-collab-protocols.md` 結構

### 4.1 檔案位置

`/Users/yclee/Diary/ClaudeCodeProject/K-Line-Prediction/docs/ai-collab-protocols.md`

### 4.2 章節結構

```markdown
---
title: AI Collaboration Protocols — K-Line Prediction
type: reference
tags: [AI-Collab, Protocols, Public]
updated: YYYY-MM-DD
---

# AI Collaboration Protocols

[1 paragraph intro — One operator, 6 AI agents, every feature leaves a doc trail.]

## Role Flow  {#role-flow}
### The 6 Roles
[Table mirroring /about S3 — Role / Owns / Artefact]
### Handoff Sequence
[PM → Architect → Engineer → Reviewer → QA → PM diagram in ASCII or simple prose]
### What "No artifact = no handoff" means
[Verifiable via ./scripts/audit-ticket.sh K-XXX]

## Bug Found Protocol  {#bug-found-protocol}
### The Four Steps
1. Reflect (responsible role)
2. PM confirms reflection quality
3. Write memory entry
4. Fix released
### Example — K-008 W2/S3
[2-3 sentences pointing to actual ticket]
### Example — K-009 TDD bug fix
[2-3 sentences]

## Per-role Retrospective Log  {#per-role-retrospective-log}
### Mechanism
[docs/retrospectives/<role>.md; K-008 起啟用; YYYY-MM-DD / 做得好 / 沒做好 / 下次改善 format]
### Curated Retrospective Excerpts  {#curated-excerpts}
[2–3 curated English excerpts — see §4.4 selection criteria]

## Verification
[How a recruiter can verify — ./scripts/audit-ticket.sh K-002 / K-008 / K-009]
```

### 4.3 Anchor ID 規劃

GitHub-flavored markdown 自動從 H2 slug 產生 anchor，但為穩定性我們**顯式加 `{#id}`**（redcarpet 忽略、GFM 保留、markdown-it 等多數 renderer 支援）。

| Pillar in `/about` S4 | Inline link target | Markdown anchor |
|------------------------|--------------------|-----------------|
| Persistent Memory | `/docs/ai-collab-protocols.md#per-role-retrospective-log` | `## Per-role Retrospective Log  {#per-role-retrospective-log}` |
| Structured Reflection | `/docs/ai-collab-protocols.md#bug-found-protocol` | `## Bug Found Protocol  {#bug-found-protocol}` |
| Role Agents | `/docs/ai-collab-protocols.md#role-flow` | `## Role Flow  {#role-flow}` |

**注意：** PRD AC-017-PILLARS 寫「每個 pillar 底部有 inline link 導向 `/docs/ai-collab-protocols.md`」——未強制 anchor。但若不加 anchor，recruiter 需手動滾動才找得到對應 section。**建議 Engineer 實作時加 anchor，並於 PR 描述標註此為「超出 AC 最低要求的 UX 增益」**，讓 PM 確認。

**部署考量：** Firebase Hosting rewrite 規則已把所有非 asset request 打到 `/index.html` SPA。靜態 `.md` 檔訪問需要：
- 方案 1（推薦）：把 `docs/ai-collab-protocols.md` **copy 到 `frontend/public/docs/ai-collab-protocols.md`**，build 時進 `frontend/dist/docs/`，可直接訪問
- 方案 2：在 `firebase.json` 加 exact-match `docs/*.md` rewrite（更動部署 config，風險高）

**推薦方案 1**：新增一個 `frontend/public/docs/` 目錄同步。Engineer 實作時用 `cp docs/ai-collab-protocols.md frontend/public/docs/` 或 symlink。**此為 Engineer 任務，要求在實作清單中明示**。

### 4.4 Curated retrospective 節選原則（2–3 條）

**挑選來源：** `docs/retrospectives/architect.md` / `reviewer.md` / `qa.md` / `pm.md`（per-role log），不從單票 `## Retrospective` 挑（單票屬內部紀錄、未經公開整理）。

**挑選原則：**
1. **必含「根因 + 下次改善」**：空泛「溝通要好一點」不選；要有可驗證的行為改動
2. **覆蓋不同角色**：3 條挑時 cover ≥ 2 個 role，避免全是 Architect
3. **時間近 30 天**：有新鮮度，對應 K-008 ~ K-017 的 retrospective
4. **避免重複 memory index 已有條目**：若某反省已提煉成 `MEMORY.md` 的 rule，則不再節選（KB 格式原則）

**建議候選（供 Engineer 參考，最終由使用者挑）：**
- Architect 2026-04-18 K-008 W2/S3 — directory drift 根因 + ticket-level 回填義務
- Reviewer 2026-04-18 K-008 — W2 為何 review 未攔截（若 log 有記）
- QA（待 K-017 完成後補；若 K-008 QA 反省合適亦可）

**引用格式：**
```markdown
### [Architect] 2026-04-18 — K-008 W2/S3 drift
> Source: [docs/retrospectives/architect.md](./retrospectives/architect.md)
>
> [原文引用 2-4 行]
>
> **Lesson codified:** [一句總結]
```

---

## 5. 檔案異動清單

### 新增（19 檔）

| 檔案 | 職責 |
|------|------|
| `frontend/src/components/about/MetricsStripSection.tsx` | S2 容器，內含 4 張 MetricCard |
| `frontend/src/components/about/MetricCard.tsx` | 單張 metric（title + subtext） |
| `frontend/src/components/about/RoleCardsSection.tsx` | S3 容器，內含 6 張 RoleCard |
| `frontend/src/components/about/ReliabilityPillarsSection.tsx` | S4 容器，內含 3 張 PillarCard |
| `frontend/src/components/about/PillarCard.tsx` | 單支 pillar（title + body + italic quote + docs link） |
| `frontend/src/components/about/TicketAnatomySection.tsx` | S5 容器，內含 3 張 TicketAnatomyCard |
| `frontend/src/components/about/TicketAnatomyCard.tsx` | 單張 ticket card（ID + title + outcome + learning + GitHub link） |
| `frontend/src/components/about/ProjectArchitectureSection.tsx` | S6 容器，內含 3 個 ArchPillarBlock |
| `frontend/src/components/about/ArchPillarBlock.tsx` | 單個 arch pillar（含可選 testing pyramid list） |
| `frontend/src/components/about/FooterCtaSection.tsx` | S8 容器 |
| `frontend/src/components/about/FooterCtaLink.tsx` | Footer 單個 link（email / external url） |
| `frontend/src/components/home/BuiltByAIBanner.tsx` | S7 Homepage thin banner → `/about` |
| `scripts/audit-ticket.sh` | Portfolio demo audit script |
| `docs/ai-collab-protocols.md` | 公開版協議文件（英文） |
| `frontend/public/docs/ai-collab-protocols.md` | 同上 copy / symlink（讓 SPA 可直接訪問） |
| `frontend/e2e/about.spec.ts` | `/about` 8 sections 的 Playwright 斷言（AC-017-HEADER / METRICS / ROLES / PILLARS / TICKETS / ARCH / FOOTER） |
| `frontend/e2e/homepage-banner.spec.ts` | AC-017-BANNER 斷言（或加入既有 pages.spec.ts，Engineer 裁定） |
| `backend/tests/test_audit_script.py` 或 bats test（**可選**） | audit-ticket.sh smoke test（AC-017-AUDIT 四個 case） |
| `docs/reports/K-017-visual-report.html` | QA 階段產出（非實作交付物） |

### 修改（5 檔）

| 檔案 | 改動 |
|------|------|
| `frontend/src/pages/AboutPage.tsx` | 整段 JSX 替換為新 8-section tree |
| `frontend/src/pages/HomePage.tsx` | 在 `<UnifiedNavBar />` 與 `<HeroSection />` 之間插入 `<BuiltByAIBanner />` |
| `frontend/src/components/about/PageHeaderSection.tsx` | 文案改為 S1（One operator 聲明） |
| `frontend/src/components/about/RoleCard.tsx` | Interface 由 `responsibilities: string[]` 改為 `owns: string; artefact: string` |
| `agent-context/architecture.md` | `updated:` 改 2026-04-19；Directory Structure 子樹更新（about/ 13 檔刪除 + 11 檔新增 + home/ 加 BuiltByAIBanner）；Frontend Routing 表 `/about` 說明更新為「Portfolio-oriented recruiter page — 8 sections」；新增 `## Scripts & Public Protocols Doc` 段描述 audit-ticket.sh 與 ai-collab-protocols.md；`## Changelog` 加 2026-04-19 一筆 |

### 刪除（13 檔）

`frontend/src/components/about/` 下：
`AiCollabSection.tsx` / `HumanAiSection.tsx` / `ContributionColumn.tsx` / `TechDecSection.tsx` / `TechDecCard.tsx` / `TechStackSection.tsx` / `TechStackRow.tsx` / `ScreenshotsSection.tsx` / `ScreenshotPlaceholder.tsx` / `FeaturesSection.tsx` / `FeatureBlock.tsx` / `PhaseGateBanner.tsx`

（共 12 檔）

**另外：** 既有 `frontend/e2e/pages.spec.ts` 內任何斷言舊 AboutPage 文字（"What Is This Project?" / "AI COLLABORATION" / "HUMAN-AI SYNERGY" 等）的測試必須**移除或改寫**，不然 E2E 會失敗。Engineer 需 `grep -r "What Is This Project\|AI COLLABORATION\|HUMAN-AI\|Tech Decisions" frontend/e2e/` 掃一次。

---

## 6. 實作順序

**Phase A — 可平行（無相互依賴）：**
- A1. `scripts/audit-ticket.sh` 開發 + smoke test（bash，獨立）
- A2. `docs/ai-collab-protocols.md` 撰寫（純文件）
- A3. `/about` 新 section 組件檔（新增 11 個檔，每個可獨立 scaffold）

**Phase B — 依賴 A3：**
- B1. `AboutPage.tsx` 重組 import + JSX
- B2. `PageHeaderSection.tsx` / `RoleCard.tsx` 改寫（interface 先定，再給新 RoleCardsSection 用）
- B3. 舊組件刪除（B1/B2 完成後安全刪）

**Phase C — 依賴 B：**
- C1. `HomePage.tsx` 插 `BuiltByAIBanner`
- C2. `frontend/public/docs/ai-collab-protocols.md` sync（A2 完成後即可，但放 C 確保文件 final）

**Phase D — 依賴 A + B + C：**
- D1. Playwright `about.spec.ts` 寫斷言 + 跑
- D2. Playwright banner 斷言（新增或加 pages.spec.ts）
- D3. 移除 / 改寫舊 AboutPage E2E 斷言
- D4. `npx tsc --noEmit` 通過
- D5. `/playwright` 全跑

**Phase E — 最後：**
- E1. Architecture doc 更新（Architect 任務，已在本文件 Step 強制步驟 a 執行）
- E2. Visual report 產出（QA）

**可平行關鍵路徑：** A1 / A2 / A3 初版同時展開可壓 Engineer 工時；Reviewer 建議 A1 交 Engineer 自寫（bash 簡單）+ A2 交使用者 / PM curate 挑選 retrospective 節選（Architect 只提挑選原則，不選哪 3 條——見 §7 Risk）。

---

## 7. 風險與注意事項

### 7.1 命名 / 拼寫 mismatch（高）
AC-017-HEADER 對 "PM / architect / engineer / reviewer / QA / designer" 逐字大小寫敏感（Playwright `{ exact: true }`）。AC-017-ROLES 又要求 role 名為 "PM / Architect / Engineer / Reviewer / QA / Designer"（S3 大寫化）。**Engineer 須嚴格區分 S1 文案（全小寫角色名）vs S3 card title（Title Case）**，不要在 refactor 時統一。

### 7.2 Playwright 斷言脆弱處（高）
- AC-017-METRICS 「Playwright 斷言逐條驗證 4 個 metric title 與其對應 subtext，不依 index 定位」→ 每張 MetricCard 加 `data-metric-title="Features Shipped"` 或用 `getByRole('heading', { name: 'Features Shipped', exact: true })` + sibling selector 鎖 subtext
- AC-017-ROLES 「6 × 3 = 18 條斷言」→ 建議每張 card wrap in `<article data-role="PM">`，`page.locator('[data-role="PM"]').getByText(owns_text)` 穩定
- AC-017-PILLARS 「anchor blockquote」→ italic blockquote 要用真正的 `<blockquote><em>...` 還是 markdown syntax `> *...*` 渲染？React 組件不 auto-render markdown，須手寫 JSX `<blockquote><em>...</em></blockquote>`

### 7.3 外部 link 安全
AC-017-FOOTER 明定 `rel="noopener noreferrer"` + `target="_blank"`。既有 `CtaButton` 只設 `rel="noreferrer"`（漏 `noopener`）—**FooterCtaLink 不能直接複用 CtaButton，必須自己寫完整 rel**。Ticket anatomy card 的 GitHub link 亦同。

### 7.4 SEO / accessibility
- `<h1>` 在 `/about` 只能一個（現 PageHeaderSection 用 h1，新設計 S1 沿用 h1）。S2/S3/S4/S5/S6/S8 的 section title 改用 `<h2>`。`SectionHeader` 組件預設 `<h2>`，直接複用。
- `aria-label` 給 BuiltByAIBanner（整條 Link）以對 screen reader friendly：`aria-label="About the AI collaboration behind this project"`.
- 文案全英文 → `<html lang="en">` 已設（main.tsx `index.html` 預設），不需改。

### 7.5 i18n
目前專案無 i18n 框架。PRD S1 / S7 / S8 全英文，S1 PM 確認為 recruiter 導向。若未來加 zh-TW 版本，S1 hero 文案需特別處理（重寫而非直譯）。**K-017 scope 只出英文版**。

### 7.6 Bash portability（macOS vs Linux）
`audit-ticket.sh` 若在 Linux CI 跑：
- `grep -E` 兩平台一致
- `sed -i` 在 macOS 需要 `sed -i ''`；**本 script 不做 in-place edit，純 read-only**，無此問題
- `[[ "$a" < "$b" ]]` 在 bash 3.2+（macOS 預設 bash）與 bash 4+ 皆可
- `date` 命令不用（僅字串比較 created），省掉 macOS BSD date vs GNU date 差異
- Shebang 用 `#!/usr/bin/env bash`（不用 `#!/bin/bash`，macOS `/bin/bash` 是 3.2）

### 7.7 Curation 選擇權（中）
挑哪 2–3 條 retrospective 節選**不是 Architect 決策**——涉及對外呈現判斷，應由 PM / 使用者確認。Architect 僅規定 4.4 挑選原則 + 引用格式，Engineer 實作時列候選交使用者選。

### 7.8 Firebase Hosting `.md` 訪問
（見 §4.3 方案 1）Engineer 必須把 `docs/ai-collab-protocols.md` 複製到 `frontend/public/docs/` 下，否則 `/docs/ai-collab-protocols.md` 在 production 會被 SPA fallback 吞掉導回 HomePage。**Playwright E2E 應加一條斷言：navigate 到 `/docs/ai-collab-protocols.md` 得到 markdown 文字（或 raw content），而非 HomePage。**

### 7.9 Drift 預防
Architect doc 同步規則已要求每張票回寫 architecture.md。本票實作過程 Engineer 若新增非計畫內組件（e.g. decorative divider），PM 驗收時需檢查 §5 異動清單與實際 git diff 對照，任何偏差回召 Architect 同步。

### 7.10 K-017 PRD 的 17 tickets 計數
AC-017-METRICS 「Features Shipped 的 subtext 為 "17 tickets, K-001 → K-017"」是寫死的 snapshot。若實作期間新增 K-018 / K-019，此數字 outdated。**PM 已鎖 K-017 為 portfolio snapshot 時間點**，Engineer 不需動態計算；未來若要刷新，開新 ticket。

---

## 8. 放行建議

本文件交付後，Architect 層面需求全部覆蓋，**無 blocking question**。建議 PM 放行 Engineer 執行 Phase A（A1 / A2 / A3 可平行）。

**PM 放行前建議確認 2 點（非 blocking，為保險）：**
1. §4.4 curated retrospective 候選清單需使用者最終挑選（Engineer 實作到 Phase C 時會再列候選）
2. §7.8 Firebase Hosting `.md` 訪問方案（推薦 §4.3 方案 1 — frontend/public/docs/ copy）是否採用

---

## Retrospective

### 2026-04-19 — K-017 /about portfolio enhancement 設計

**做得好：**
- 設計前完整讀了 PRD 全部 10 條 AC + 現有 14 個 about/ 組件 + 既有 AboutPage / HomePage / main.tsx 路由、architecture.md Directory Structure 子樹，確認本次 drift 狀況（about/ 舊組件 13 檔需刪、RoleCard interface 需改、SPA fallback 對 `.md` 訪問是陷阱）
- 把「挑 2–3 條 retrospective 節選」的決策明確 defer 給 PM / 使用者，不越權替 portfolio 對外呈現做內容選擇（符合 senior-architect.md「不做需求決策」原則）
- Section 粒度對齊既有 about/ 子目錄慣例，刪除舊 12 個組件時同時列出對應的 PRD AC section 取代，避免 Engineer 誤刪仍有參考價值的檔

**沒做好：**
- Firebase Hosting 對 `.md` 訪問的陷阱（§7.8）在第一輪設計時差點漏——直到寫完 §4 anchor 規劃要驗證 inline link target 時才回想 SPA fallback 會吞 `.md`，補進 §7 風險。根因：AC-017-PROTOCOLS 只說「文件存在」，沒說「recruiter 點 pillar link 打得開」，設計時習慣只 cover AC 字面條件，對「recruiter 實際使用路徑」的 mental simulation 不夠早介入
- 未先檢查 `frontend/e2e/pages.spec.ts` 是否已對舊 AboutPage 文字（"What Is This Project?" / "AI COLLABORATION"）做斷言——若有，B3 刪除舊組件會直接破 E2E。本文件 §5 已列「Engineer 需 grep 掃」，但若我自己先掃一次給出清單會更具體。

**下次改善：**
- 設計階段在 §7 之前先做一輪「end-to-end recruiter mental walkthrough」——從 homepage 點 banner → /about → 點 pillar link → 點 GitHub link → email — 每一跳都 check 是否 production 可達（SPA、CORS、external link、Firebase rewrite）。此 walkthrough 寫進本 log 作為下次自檢 checklist
- 處理大幅重組既有頁面的 ticket（本票刪 12 改 4 新增 19）時，在 §5 檔案異動清單之前先主動 grep 既有 E2E spec 對舊文案的依賴，把這部分列為 Engineer 必備前置動作，不是單純「註記風險」
