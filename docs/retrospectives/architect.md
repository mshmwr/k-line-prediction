# Architect Retrospective Log — K-Line Prediction

Cross-ticket cumulative retrospective log. The senior-architect agent appends one entry before every task close, newest on top.

## Entry format

```
## YYYY-MM-DD — <Ticket ID or Phase name>

**What went well:** (specific event; omit this line if none — do not fabricate)
**What went wrong:** (root cause + why design/review failed to catch it)
**Next-time improvement:** (concrete, actionable follow-up)
```

- Newest first (reverse chronological)
- Coexists with single-ticket `docs/tickets/K-XXX.md` `## Retrospective` Architect entries; neither replaces the other
- Active since 2026-04-18 (from K-008 onward)

---

## 2026-04-27 — K-052 Phase 2 Architect Design Doc (triple-emit + Designer persona patch)

**What went well:** Drafted §1–§21 in one pass against PRD §BQ Resolution Lock-Ins as the in-ticket SOR. Each Lock-In cell traceable to a design-doc section (BQ 1 → §5.1 metrics, BQ 2 → §5.1 lessonsCodified, Zone 1 → §5.2 + §14, Zone 2 → §5.3 + §5.5 weight formula, BQ 3 → §8 frontmatter-gated parser + §9 three-case algorithm + §13 backfill table). Edge-case truth table (§9.2) enumerates 11 cases across the 5 sacred-lifecycle invariants (Add/Modify/Retire happy paths + 5 fatal paths + 1 advisory path + 1 in-flight skip path); each row names exit code so Engineer + QA share one source of truth. Verified before fabricating: ran `grep -nE '^### (AC-|Sacred)' docs/tickets/K-021* K-031* K-034* K-035* K-040* K-046*` to confirm Sacred clause body locations across the 6 backfill candidates BEFORE writing §13 patch table; discovered K-034 has zero AC-shape Sacred headings (its file absorbed K-035 retros but bodies live in K-035 file) and surfaced the grouping ambiguity to PM via §13.2 escalation rather than self-arbitrating.

**What went wrong:** First draft of §5.1 `metrics.lessonsCodified` hardcoded `claude-config/memory/feedback_*.md` glob without considering that the generator runs from `K-Line-Prediction/scripts/` and `claude-config/` lives 3 directories up at `~/Diary/claude-config/` (sibling of `ClaudeCodeProject/`). CI environments don't share the parent layout. Caught during §5 self-review and revised to require `process.env.CLAUDE_CONFIG_PATH` env-var override + null-fallback when path resolves missing. Root cause: Lock-Ins introduced a cross-repo SSOT field (sibling-repo path) without architect-time portability check. Should have surfaced as §0 Scope Question before committing to schema — instead the path concern was absorbed into §5.1 itself, complicating the spec.

**Next time improvement:** When Lock-Ins introduces a new SSOT field whose source lives outside the project repo (sibling repo, parent directory, env-var-pathed asset), surface CI environment portability as a §0 Scope Question BEFORE drafting §5 schema. Add to senior-architect persona §Scope Question Pause Rule trigger list: "any Lock-In field with source path outside `<project-root>/`" — pause + escalate to PM whether to (a) require env-var override, (b) hardcode-with-fallback, or (c) rule the field out-of-scope until path is canonical. PM-time decision saves §5-section rewrite at delivery time.

---

## 2026-04-26 — K-053 Architect Round 2 Verdicts on Engineer Sheet (A1/C1/M1/Z1)

**做得好：** Engineer's Pre-Implementation Design Challenge Sheet surfaced 4 items (A1 TS typing of `'instant'`, C1 `history.scrollRestoration = 'manual'` placement, M1 T-K053-04 query-only test contract, Z1 `'scrollRestoration' in history` SSR-safety guard). All 4 ruled in single response per ≤2-turn obligation: A1 verified empirically with `npx tsc --noEmit EXIT=0` against a temp src test file under repo's actual TS 5.9.3 + tsconfig (avoiding the `--target/--lib` override pitfall that produced spurious moduleResolution errors on first attempt — caught the false-positive and re-ran cleaner); Z1 verified with `grep -rE "createRoot|hydrateRoot|renderToString" frontend/src/` (single hit, SPA-only confirmed); C1 verdict supported by reasoning about React lifecycle + StrictMode idempotency; M1 verdict supported by concrete wrong-axis risk analysis (`page.evaluate(window.history.pushState)` bypasses `history` package wrapper, would not trigger React Router `useLocation` re-render — false-pass risk). Edits landed in same response: §3.1 component spec gained the `useEffect(() => { history.scrollRestoration = 'manual' }, [])` line as canonical Engineer copy-paste source; §3.3 spec contract un-skipped T-K053-03 (per BQ-K053-01 ruling) and added comment-only annotation block where T-K053-04 would have been. Per-item rationale anchored in code conventions (Karpathy Simplicity for Z1, blast-radius minimization for C1) rather than personal preference.

**沒做好：** §12 AC ↔ Test Case Cross-Check Status column for AC-K053-06 left stale ("Pending — PM Phase 1 ruling required") despite the table now reflecting an active T-K053-03 in the Test count column. Caught in self-diff and noted in addendum, but should have Edited §12 in the same Edit pass rather than asking Engineer to refresh. Root cause: addendum-pattern (append rather than table-Edit) is comfortable but creates two-sources-of-truth between addendum verdict and §12 status cell. First A1 verification attempt also wasted ~1 round overriding tsconfig flags (`--target ES2020 --lib ES2020,DOM`) instead of using the project's own `tsc --noEmit` from `frontend/`, which surfaced 14 unrelated module resolution errors before I realized the override was the cause.

**下次改善：** When a verdict mutates §3 spec contract, immediately run a per-section self-diff against §12 (AC ↔ Test cross-check) and §11 (All-Phase Coverage), Edit any stale cells in the same response. Treat §12 as a downstream view of §3 — addendum-only updates are stale-by-default. For tsc / tsx / build-tool verifications, default to running the project's own configured invocation (`cd frontend && npx tsc --noEmit`) before reaching for `--target/--lib` overrides; project tsconfig is the canonical environment, not flag-construction guesses.

---

## 2026-04-26 — K-053 Architect Same-Session Verdict on QA-flagged M1+M2 (factual error round-trip, ≤2 turns honored)

**做得好：** QA Early Consultation surfaced two factual errors in §3.3 (M1 missing `.ts` extension on `mock-apis` import; M2 non-existent `diary-timeline` testid as wait selector); Architect verified both with same-response tool calls (`find frontend/e2e -name "mock-apis*"` + `grep -rn "mock-apis" frontend/e2e/` for M1; `grep -rn "data-testid=\"diary-" frontend/src/` for M2 — confirmed 13 mock-apis hits all use `.ts` extension, and no `diary-timeline` testid exists across 11 diary-* hits). Edits landed in same response as verification, plus full Self-Diff (`diary-timeline` 0 hits / bare `mock-apis` path 0 hits / `mock-apis.ts` 2 hits / `data-testid="diary-entry"` 2 hits — all 4 gates pass). Same-Session Verdict ≤2-turn obligation honored: turn 1 = QA flagged, turn 2 = Architect verified + Edited + addendum + retro entry. Also caught one task-spec inaccuracy via verification (the relayed M1 correction text suggested file lives at `frontend/e2e/mock-apis.ts` but it actually lives at `frontend/e2e/_fixtures/mock-apis.ts` — fix lands as `'./_fixtures/mock-apis.ts'`, matching the 8-spec precedent rather than the relayed suggestion); Architect verified-before-Edit per Global §Pre-response verify triad rather than blindly applying the relayed string.

**沒做好：** Both M1 and M2 are first-pass §3.3 authoring misses that an Engineer's compile + first-spec-run would have caught in seconds, but Engineer would have eaten one full round-trip (read design doc → discover failure → file Design Challenge Sheet → wait for Architect verdict). Root cause for M1: extension-less import is the convention in many TS codebases, but this project's `moduleResolution: "bundler"` tsconfig requires explicit `.ts` — a 5-second `grep -rn "mock-apis" frontend/e2e/` during initial design doc authoring would have surfaced the 8-spec precedent. Root cause for M2: `diary-timeline` was a plausibility-guess rather than a grepped-from-source testid — exactly the failure pattern `feedback_no_fabricated_specifics.md` warns against. Spec contracts referencing testids must come from `grep` output, not memory.

**下次改善：** Codify into `~/.claude/agents/senior-architect.md` §3 / §3.3 contract authoring: any design doc snippet that references (a) module import path (`from '...'`), (b) `data-testid` selector, or (c) file path used in test code MUST cite a `grep` output (file:line) inline within the same paragraph as the snippet. Treat snippets without inline grep citation as unverified pseudo-code (mark `// pseudo` per persona rule "do not write code — use pseudo-code or interface definitions"). When the snippet is intended as copy-paste-ready (the §3.3 case here), the grep citation is mandatory, not optional. This converts the "QA caught it" loop into an "Architect grep gate before doc save" loop.

**做得好：** Pre-Design Audit dry-run (`git show 803935e:frontend/src/main.tsx` + `grep useLocation frontend/src/`) confirmed the canonical mirror pattern (`useGAPageview`) exists exactly as PRD assumed, which let the §3 component spec land first-pass with zero rework. Edge-case truth table (§6) enumerated 16 rows across 5 axes (pathname × hash × search × initial-mount × POP/PUSH/REPLACE/StrictMode) and explicitly named each row's verdict source — PM ruling slot vs Architect default-decision vs spec-verified — so Engineer and Reviewer have zero ambiguity about which cells are debatable. Sacred 7-pattern grep sweep + 5-route regression sweep both came back zero hits, validating the "purely additive UX" framing.

**沒做好：** Truth table row notes mixed "Architect default rationale" with "PM ruling required" inside prose paragraphs rather than a separate column — Reviewer has to re-read full row note to confirm which ruling slot a row belongs to. Specifically rows #5 (hash removal → reset, Architect default) and #11 (refresh-mid-scroll → always-reset, Architect default) are easy to mistake for PM-ruling slots without careful reading. Cost was tolerable here (16 rows, 1-page table) but at 30+ rows it would degrade.

**下次改善：** When edge-case truth tables include a mix of Architect-default-decisions and PM-ruling-slots, add an explicit "Verdict Source" column (values: `PRD AC`, `PM ruling pending`, `Architect default — challengeable`) so Engineer / Reviewer can scan-grep instead of paragraph-read. Codify into senior-architect persona §Edge cases truth table contract on next persona Edit cycle.
---

## 2026-04-26 — K-051 Phase 4 design

**What went well:** Pre-Design Audit `git show HEAD:` evidence on `predictor.py` lines 8 / 11 / 155-157 / 331-336 / 343-345 caught the dual-callsite implication of the AC-051-10 gate change up front. PM brief framed the fix as "single line 156 + line 335"; only by reading both `_fetch_30d_ma_series` callsites in `find_top_matches` did the candidate-side `if not candidate_30d_ma: continue` (line 343-345) silently-tightening behavior surface. Documented in §8.3 with explicit cross-reference to QA Phase 4 Early Consultation finding #1 and PM B-Phase4-hidden-callsite ruling — Engineer reads one section to know "top-N composition will shift, AC-051-08 positive integration test still passes, do not panic". Without the audit dry-run that line of reasoning would have only emerged at Engineer's pytest run, costing one round-trip back to PM.

**What went wrong:** §1.3 CJK enumeration sweep took ~40% of total design time — 29 grep hits had to be classified individually with citation rationale. Initial classification used a 2-column split (`translate / preserve`) but 18 of 29 hits fell into "preserve" without distinguishing functional-preserve (regex parser literals at `MainChart.tsx:33,38` will literally break the AM/PM parser if removed) from out-of-scope-preserve (JS comments in `UnifiedNavBar.tsx`, K-046 Sacred assertion in `K-046-example-upload.spec.ts:105`). Engineer reading the 2-column table would still ask "should I touch UnifiedNavBar comments since they look like 'just comments'?" — exactly the scope-expansion risk the table was supposed to head off. Had to re-classify mid-design into a 3-column scheme `(a) translate / (b) preserve-functional / (c) preserve-out-of-scope` with citation per row.

**Next time improvement:** when a ticket scopes "translate user-visible language X in surface Y" with explicit out-of-scope code-internal X, the Architect's enumeration table MUST use 3 classification columns from row 1 — `translate / preserve-functional / preserve-out-of-scope` — not 2. Codify into `~/.claude/agents/senior-architect.md` §All-Phase Coverage Gate as a hard-step row: "i18n / language-scope tickets: enumeration table 3-class column (translate / preserve-functional / preserve-out-of-scope) mandatory; 2-class scheme = design doc incomplete." This prevents the mid-design re-classification round-trip.

---

## 2026-04-26 — K-051 Phase 3b/3c design

**What went well:** Pre-Design Audit code-level dry-run caught two pointer errors before they became Engineer time-sinks: (a) PM brief said mock `/api/predict-stats`, but main.py exposes no such endpoint — resolved as SQ-01 with code citation, no PM BQ needed; (b) QA retro pointed at K-046 spec line 97-99 for the `setInputFiles` pattern, but that line targets the history-reference section, not the official-input multi-select that K-051 actually drives — swapped the citation to `ma99-chart.spec.ts:163-168` (canonical pattern) before delivery so Engineer never has to discover the mismatch live. Both errors caught only because §1.1 / §1.2 truth tables were filled in *before* the file-change list was drafted.

**What went wrong:** Initial pass treated the AC-051-08 fixture provenance docstring as a `# Source: ...` comment line in the CSV itself. Code-level dry-run on `parseOfficialCsvFile` (AppPage.tsx:48-66) showed the strict numeric-first-column gate would throw on any leading `# ` line — forcing a sibling `README.md` as the audit-trail container. Caught at design time, but only because §1.2 BOM and header-row truth tables were filled BEFORE the fixture-content section was drafted; if I had drafted the sections in the order PM listed them in the brief, the bug would have shipped to Engineer.

**Next time improvement:** when a design touches BOTH backend and frontend fixture format gates with a shared fixture (mirrored or symlinked), the fixture-format truth table goes BEFORE the file-change list, not after. Codify into this persona's Pre-Design Audit checklist as: "any cross-layer fixture shipping into ≥2 parsers — write parser-tolerance truth table first, then fixture content design". Append to `~/.claude/agents/senior-architect.md` §Pre-Design Dry-Run Proof Gate 1 a new row: "Cross-layer fixture parser-tolerance truth table — list each consumer parser × accept/reject for {BOM, header row, comment line, trailing newline, CRLF, empty}; any reject cell determines fixture format constraint. Skipping = blocker."
---

## 2026-04-25 — K-051 Daily DB backfill + Cloud Build rollup-musl fix (Architect bypassed)

**What went wrong:** Architect role was skipped end-to-end. Two PRs shipped (PR #19 data backfill, PR #20 Phase A.5 Dockerfile fix) with no design doc, no Pre-Design Audit, no truth table. The cost showed up in Phase A.5: the first Dockerfile fix attempt regenerated `package-lock.json` inside an Alpine container, which produced a working musl binary entry but dropped `@types/node` from a transitive direct dep down to optional peer — surfaced only when `tsc` failed in the second `docker build`. The second attempt switched base image to `node:20-bookworm-slim` (glibc) on the assumption that "musl base + macOS-generated lockfile" was the precise root cause; local `docker build --platform linux/amd64` immediately reproduced the same npm bug for `@rollup/rollup-linux-x64-gnu`, proving the root cause was lockfile-generation OS, not base libc. Three attempts cost ~15 minutes plus two Docker base-image pulls; a 3×2 truth table (lockfile-gen-OS ∈ {macOS, linux} × base-image-libc ∈ {musl, glibc}) drawn before attempt 1 would have predicted both failures and pointed at the surgical `--no-save` pin in one shot. Pre-Design Audit (the persona's mandatory §0) was implicitly skipped because "Phase A.5 fix-forward" felt urgent enough to bypass design — but the bypass made the fix-forward longer, not shorter.

**Next time improvement:** Phase A.5 fix-forward (deploy fail → patch) still requires a 5-minute pre-edit design note when the suspected root cause spans more than one variable axis. Format: a markdown truth table with one row per cell, predicted outcome per cell, and the proposed fix annotated to the cell it directly addresses. Codify into `~/.claude/agents/senior-architect.md` under §Pre-Design Audit a new sub-rule "§Phase A.5 truth table (build infra)": when the failure mode involves *system × system* interaction (lockfile × runtime × arch × cache), enumerate the matrix before the first edit. Skipping is acceptable for single-axis failures (e.g. wrong env var name) but not for multi-axis (libc × lockfile-OS × cache-state).

---

## 2026-04-24 — K-049 Public-surface plumbing (architect brief, all-phases design)

**做得好：** §1 Pre-Design Audit 對 PM handoff 提到的 4 個檔案全跑 `git show 1090e63:<path>`，立刻發現 PM brief 寫的 `backend/app/main.py` 路徑實際上在 `1090e63` 不存在 — 正確路徑是 `backend/main.py`。若沒跑 base-commit dry-run，設計文件 §6.2 request-flow 會引用錯路徑，Engineer 實作時才撞 fatal error。同時 §F 的 Bodoni usage grep 確認 `frontend/src` + `tailwind.config.js` 零 consumer，為 AC-049-BODONI-1 safe-to-remove 主張提供 empirical evidence，不是印象。§0 BQ-049-ARCH-01 主動抓出 PM handoff brief 把 sitemap 第 5 路由寫成 `/examples`（不存在）vs ticket AC-049-SITEMAP-1 寫 `/business-logic`（存在），依 `feedback_ticket_ac_pm_only.md` 不自改 AC，flag 回 PM 作 BQ，設計以 ticket AC 為 SSOT 繼續。§7.4 Firebase Hosting file-serving vs rewrite 優先順序採 empirical baseline（backed by Firebase docs' documented priority）+ Engineer post-deploy curl-probe guard，而非硬性加 rewrite exclusion — 把「可能多餘」的 config 收縮到 Known Gap + deployment-time verification，避免 K-021-style silent config bloat。

**沒做好：** §7.3 CSP policy string 寫成「draft — Engineer 實作 verbatim」但 script-src 清單是 best-guess（GA + googletagmanager 必須；但 `'unsafe-inline'` 對 Vite 產出的 inline bootstrap script 是否必要沒實測驗證）。真實做法應該是：產出 Phase 2a 第一版 build 後，檢查 `frontend/dist/index.html` 產出的 inline script / style tags，逐項決定 CSP directive，再把 policy 寫死。現在推給 Engineer 的 §16 risk 2 「deploy 後看 violation，tighten 再 redeploy」實際上是把 CSP 的 first-pass design work 外包給 deploy-loop — 與 §Boundary Pre-emption 要求的「設計階段補完 boundary」原則有 tension。第二版設計 iteration 應該在 Phase 2a commit 前先本地 `npm run build` + grep `dist/index.html` 的 inline script hash 需求，把 CSP 鎖到可通過 headless Chromium 的最小集。

**下次改善：** CSP 類 config 的設計文件不應該標 "draft, Engineer verbatim"；應在設計階段走 (1) `npm run build` → (2) `grep -oE 'on[a-z]+="' dist/index.html` + `grep -oE '<script[^>]*>' dist/index.html` 列出所有 inline handler / script → (3) 以這些 findings 撰寫最小 CSP policy，設計文件給 Engineer 的是「已驗過 headless Chromium zero-violation」的完成版。將此步驟追加進 persona `senior-architect.md` 的 Firebase Hosting / CSP 類 ticket pre-design checklist（位置：§Boundary Pre-emption 或新增 §Deploy Config Design Protocol 子節），避免下次同類 ticket 又把 first-pass CSP tuning 推給 deploy-loop。

---

## 2026-04-24 — K-046 Phase 2 UI restructure + CORS env fix

**做得好：** §3 handler-removal ruling 沒停在「dead-code 砍就對了」— 先跑 `grep -n "uploadError\|setUploadError" /tmp/AppPage-4c873b3.tsx` 確認 5 hit 全在 HISTORY-ONLY 範圍（L143/299/310/452/455），zero crossover with `handleOfficialFilesUpload`，才敢下 REMOVE；把這個 scope-critical 驗證寫進 §3.1 表格，reviewer/engineer 讀到就能自己 replay。§10.3 Pre-Design Audit 發現 `handleHistoryUpload` L309 `setHistoryInfo(data)` 是 post-upload refresh 路徑，REMOVE 後 only `useEffect` initial fetch 會設 `historyInfo` — 同 §10.3 note 段落明寫這個行為差異 + AC-046-PHASE2-HISTORY-INFO-RENDERS 只斷言 initial fetch path，K-048 再補 post-upload refresh，讓 Engineer/Reviewer 不會誤判 regression。§10.5 主動 flag 既有 `K-046-example-upload.spec.ts:81` `page.locator('label', { hasText: 'Upload History CSV' })` 為 stale anchor，給 Engineer 具體 T1/T2 updating + T3 removal 指令，避免 Phase 2b 才現場發現 test 紅。

**做不好：** §4 `parseOfficialCsvFile` export decision 初版誤列 Option B（extract to `utils/parseOfficialCsvFile.ts`）為 tied 推薦；回讀 AC-046-PHASE2-EXAMPLE-PARSE 原文「imported from `frontend/src/AppPage.tsx`」才發現 AC text 已 lock import path，Option B 需改 AC（Architect 不得改 AC），自動 disqualified。這個 constraint 應在「三選項列出」時就寫在頂部，不是 scoring 完才補。

**下次改善：** options 表在推薦前先列 "binding constraints from AC text / PM ruling" 一列，把 AC-locked 路徑顯性化，避免 tied scoring 後才剔除。已回寫單票 Retrospective 對應行。

---

## 2026-04-24 — K-046 Comment-out upload write path + example CSV download

**做得好：** Pre-Design Audit §1.3 畫 6-row × 11-column OLD vs NEW truth table（full-overlap / strictly-later / partial-overlap / empty / first-boot / 1D-filename）逐格 dry-run，Case E（first-boot mock fallback, N=0）直接點出 `existing[-1]['date']` 會 IndexError，於 §6 Phase 1 implementation order 明寫 `existing[-1]['date'] if existing else None` guard — 在設計階段把 boundary hole 補上，不留給 Engineer 撞。§6 Phase 2 step 6 placement 檢查時發現 `<label>` 包 `<input type="file">`，若把新 anchor 插到 `<label>` 裡面會讓 click 觸發 file picker 而非 navigation — 明寫「anchor must be sibling, not child, of `<label>`」硬 gate。Sacred cross-check 7-pattern grep sweep（token-selector 4 + DOM-adjacency 3）全跑，確認 0 collision with K-046 scope。§API 不變性 dual-axis（wire schema 0 diff + frontend observable per-case diff 表）齊備；ticket §Test Coverage Plan 宣告「最少 2 pytest + 3 Playwright」vs §9 delivered 6 pytest + 3 Playwright 對齊。

**做不好：** §5 Shared Component Inventory 最初差點直接寫「無」一字帶過；被 §§ consolidated-delivery-gate mental-check 拉回後才補上 `grep -rn 'Download example' frontend/src/` + `grep -rn 'text-\[10px\] text-gray-500'` 兩行 audit evidence。Inventory = none 不代表 audit = skip；即使結論是 none，證據必須在場。

**下次改善：** single-component-add ticket（scope 僅「新增一個 page-specific DOM element」）的 Shared Component Inventory 仍需執行實際 grep sweep 並把 0-hit pattern 列出；將此步驟納入 persona §Cross-Page Duplicate Audit 的觸發條件 — 不只「新組件 / 新 section / 新頁面」，也包含「新單一元素 JSX 加入現有 page」。已於此 retro 末尾 codify 到 persona 路徑（memory 規則：`feedback_shared_component_inventory_check.md` 已涵蓋，本次確認實戰觸發條件不僅限 component 級，元素級亦適用）。

---

## 2026-04-24 — K-045 Desktop layout consistency

**做得好：** Pre-Design Audit 階段完整執行 Gate 1 file-truth-table（15 rows with `git show ef3519d:<path>` logs）+ Gate 2 Cartesian product 18-row current-vs-target dry-run + Gate 3 §API 不變性 dual-axis（wire-level 0 diff + frontend observable delta table）；K-031 Sacred `#architecture.nextElementSibling === <footer>` 在 §2.1 naïve component tree draft（沿用 HomePage body+inner-flex-wrapper pattern）寫完後立刻以 DOM adjacency dry-run 自檢出 risk，改走 Option C（per-section self-contained container classes + margin-top rhythm）而非 body wrapper，保住 Sacred。BQ-045-02 Architect ruling 用 12-dim 決策矩陣而非印象給出 Option α（remove SectionContainer），ticket 明確標為 Architect-ruled 不上 PM。

**沒做好：** Ticket §4 AC-045-K031-ADJACENCY-PRESERVED 引用 `about.spec.ts:386-403` 但實際檔名是 `about-v2.spec.ts:387-404`（檔案不存在 + 行號都 off-by-1）。grep 確認後依 `feedback_ticket_ac_pm_only.md` 禁止自改 ticket AC，以 BQ-045-ARCH-01 flag 進 §10 等 PM 裁決；但第一稿 §2.1 component tree 寫到一半才意識到 K-031 adjacency 與 outer-wrapper pattern 衝突，算是「設計稿自己到寫 §2 時才撞到 Sacred」的 reactive 發現，不是 §0 階段主動辨識。如果 Pre-Design Audit §0.4 把所有 regression-class Sacred 列成 DOM-shape assertion 表（selector + expected ancestor chain），第一時間就會看出 outer wrapper 不可用，不會先寫 naïve draft 再回頭推倒。

**下次改善：** Pre-Design Audit §0 新增強制子項 **§0.4a DOM-shape Sacred Assertion Catalogue** — 逐條列出本 ticket regression-class Sacred 對應的 DOM structural assertion（selector + ancestor chain + sibling adjacency），在 §2 Component Tree 之前先建完目錄；§2 每一版草稿 Component Tree 必須對這份目錄做「每條 assertion 是否仍成立」的 truth-table 自驗，才能進入 §3。將此 codify 進 `senior-architect.md` §Pre-Design Dry-Run Proof 的 Gate 2 延伸條款。
---

## 2026-04-24 — K-044 README showcase rewrite 設計（PM scoped re-dispatch）

**做得好：** Challenge C3 feasibility pre-check 在 PM 的 scoped re-dispatch 這次又重跑一遍 — 用 `git stash` 保存 WIP、`git checkout 80e12d7 -- frontend/`、full `npm install`（no pre-existing node_modules，126 packages）、`nohup npm run dev`、`curl` 觀察 `<body class="bg-gray-950">` + Google Fonts `IBM+Plex+Mono` 雙訊號確認 pre-K-021 狀態、kill pid、`git restore --source=HEAD --staged --worktree frontend/` + `git stash pop` 完整還原。不是靠上一 session 的記憶或 design doc §1 的紀錄就默認通過 — PM 的 C3 gate 是硬 gate，每次召喚都要自己跑。Self-Diff Gate 也嚴格跑了 — `git diff --stat` 拿到權威 `32 insertions, 1 deletion = net +31 lines` 跟我拆解的 Patch 1 (+10) + Patch 2 (+19) + Changelog (+2) + frontmatter (0) = +31 ✓ 對齊，不是憑設計文件描述就當成完成。frontmatter `updated:` 也同 commit 往前推（2026-04-23 K-040 → 2026-04-24 K-044 + K-040 降為前置 context），不漏 sync rule。

**沒做好：** 第一版 migration plan 直覺是「5 個 block 全部搬進 architecture.md」，後來在 cross-check 時才發現 4/5 已經被 architecture.md 既有段落完整覆蓋（Tech Stack、Frontend Routing、API Endpoints、Data Flow call-chain、Consensus Stats SSOT），只有 Deployment Architecture 是真 gap。如果沒有跑 `grep -n '^## ' agent-context/architecture.md` 對 README section list 的 diff，設計文件會讓 Engineer 重複寫同樣的內容進 architecture.md，造成 K-034/K-039 lesson 最怕的 duplicate-ownership drift。這個 pass 1 miss 不是技術錯誤，是工序沒排對 — 應該「先 audit 再寫 plan」。

**下次改善：** docs-migration 類 ticket 的設計文件寫 migration plan 之前，必跑一次「目標 doc `grep -n '^## '` vs source doc section list」的 diff — 把重疊的部分先標 `already-covered` 再決定哪些是 gap 要 patch。codify 進 senior-architect.md 的 §Architecture Doc Sync Rule 附近：docs-migration ticket 強制要在設計文件 §N 出示 coverage-audit table，不能只寫「移到 X」。本 session 已在 K-044 設計文件 §3.1 + §10.7 用 8-row coverage-audit table 落地這個規範（雖然 memory/persona edit 超出 worktree 範圍、需等 meta-edit session 才能同步）。
---

## 2026-04-23 — K-040 Item 1 sitewide typography reset 設計

**做得好：** Designer memo 的 36-row per-site calibration table + QA-040 Early Consultation 的 6 個 Q 都已被 PM 落地進 AC，Route Impact Table 建立 5 routes × 多 component 時幾乎所有資料都有單一來源可引用，不用自己在 Pencil 或 Figma 再判斷；Pre-Design Audit 對 4 個 "pre-existing" shared component mono 斷言都用 `git show HEAD:<path>` 實證通過，沒有憑印象代入。

**沒做好：** Ticket §2 AC And-clause 8 的 grep pre-count "1" for `"Bodoni Moda"` string literal 在 §6 Pre-Design Audit 階段發現可能 under-count — `timelinePrimitives.ts:30` 的 `'Bodoni Moda, serif'` 會被 ticket 的 grep pattern 命中但 ticket 只寫 "1"。第一時間沒有直接寫 BQ 給 PM，而是在 §6 以「⚠ clarifying observation」形式記下，讓 Engineer impl 時 re-grep 對帳，等於把 PM 的判斷踢給 Engineer；這不符合「Architect surface ambiguity for PM ruling」的 Scope Question Pause Rule。

**下次改善：** 當發現 ticket AC hard-coded 數字與自己 grep 不一致（即使可能只是 counting 定義問題），立刻寫 §0 Scope Question 回 PM，不要用 "Engineer 到時會 re-grep" 自我合理化。將這條 codify 進 `senior-architect.md` §Scope Question Pause Rule 的觸發條件：「AC 硬編碼數字 ≠ 自驗 grep 數字」也屬於 scope inconsistency 必須 pause 的 case。

---

## 2026-04-23 — K-034 Phase 3 — /diary shared Footer adoption design doc

**做得好：**
- §1 Pre-Design Audit 用 `git show HEAD:<path>` + Read 組合驗 11 個 source file 當前狀態（DiaryPage / Footer / 3 spec files / 3 ticket files / 2 doc files / architecture.md），truth table 每列都對應到後續 §5 File Change List 的具體 L<n> 行號；符合 persona §Pre-Design Dry-Run Proof 硬 gate。§1.3 Pre-existing claims cited 3 條（Footer prop-less / DiaryPage root wrapper full-bleed / HomePage ancestor padding INHERITED）每條都附 `git show HEAD:<path>:L<n>` 引用，無 bare Read 依賴。
- §3.1 DiaryPage Footer placement 三選項對照表（A 根 div sibling / B main 內 / C per-branch）用 5 維度 scoring 全部壓倒性 A > B > C，Option A 明確對應 AC 原文 "last sibling under the page root"，沒有 post-hoc tiebreaker。§3.2 sitewide-footer.spec.ts 重構也跑 α vs β 對照，Option α 直接對應 AC 原文 "route loop"。
- §7.1 Known Gap BQ-034-P3-04（`shared-components.spec.ts` T4a `/app — no Footer` HEAD 不存在但 AC 引用）主動發現並 flag 給 PM，附三個 option 沒有自行代決 — 符合 persona §Scope Question Pause Rule + `feedback_ticket_ac_pm_only.md`。設計文件其他內容繼續 deliver 因 BQ-034-P3-04 非 blocker（不影響其他 6 AC 實作）。
- §13 §API 不變性 dual-axis：wire-level `git diff main -- backend/ frontend/src/types.ts frontend/src/types/diary.ts` = 0 diff，加 frontend observable 4-row class（full-set / subset / empty / boundary）全行為等價且 Footer 為 additive；符合 `feedback_architect_pre_design_audit_dry_run.md` K-013 雙軸硬 gate。
- architecture.md 3 處結構性 Edit（Frontend Routing `/diary` 列 / Footer 放置策略 `/diary` cell / Shared Components 邊界 Footer 列）+ Changelog prepend + frontmatter `updated:` 4 處同 commit；Self-Diff Verification `grep "Footer\|/diary"` 掃 23 hits 全部 classified（current-state 編輯一致、historical Changelog 保留、Directory Structure L180 歷史 comment 不改），符合 persona §Same-File Cross-Table Sweep + §Pre-Write Name-Reference Sweep。

**沒做好：**
- §7.1 Known Gap BQ-034-P3-04 雖正確 flag 給 PM，但理想上應該在 §0 Scope Questions 就提出 — persona §Scope Question Pause Rule 要求「發現 AC vs 程式碼矛盾即停」。本次在 §7.1 才 surface 的原因是 pre-design audit §1.1 只 grep 了現有 spec files 的結構位置，沒有 cross-check AC 引用的每一個 test id / describe name 是否都在對應 spec file HEAD 存在。結果是 design doc 已 deliver 但 BQ 待 PM 裁決；若 §0 就發現，可能可以在 same session 等 PM ruling 後直接修齊，省一 round trip。
- §10 Architect self-diff 聲稱 `shared-components-inventory.md` 無需 Edit 因「已於 ex-K-038 PM phase 預先編輯完成」— 這個斷言是基於單次 Read 驗證（第 27 行有 `/diary` + footnote、36 行 `/diary` bullet struck-through），但沒 `git show HEAD` 明確驗證該 Edit 已進入 HEAD 而非 WIP。實際已 verified（inventory.md 是 HEAD 檔，單 Read 即真相），但 persona §Pre-Design Audit 要求「對 pre-existing 斷言必 `git show HEAD:<path>:L<n>`」；這裡屬於窄邊界案例（inventory 非被引用為 pre-existing 行為，而是被斷言為「已預先編輯」），不在硬 gate 範圍但值得記錄。

**下次改善：**
- §0 Scope Questions / Pre-Design Audit 擴大範圍：當 ticket AC 引用具體 test id（T1 / T4 / T4a 等）、describe name、spec file 內的具體 LN 時，pre-design audit §1.1 truth table 必須每個引用都 `grep -n "<test-id>" <spec-file>` 驗存在，缺一即列 §0 Scope Question。此次若有這條 rule，BQ-034-P3-04（T4a 不存在）會在 §0 而非 §7.1 surface，節省一 round。Action：`senior-architect.md` §Pre-Design Dry-Run Proof 追加第 4 條 Gate「AC-referenced test-id verification: every test id / describe name cited in ticket AC must be grep-verified in its claimed spec file at HEAD; absent ones surface as §0 Scope Question, not §Boundary Pre-emption Known Gap」。

---

## 2026-04-23 — K-034 Phase 2 — /about full Pencil SSOT audit design doc

**做得好：**
- §1 Pencil SSOT Read Gate `PASS` 前先對 7 JSON + 9 PNG 全部 `ls -l` 驗檔案存在 + byte size，非依賴 Designer retro 口頭聲稱；Manifest `about-v2-manifest.md` 也讀取驗證。符合 persona §Pencil Artifact Preflight 硬 gate。
- §3 27 列 Drift Truth Table 對應 ticket §5 PM 裁決逐列抄入，schema（section | node-path | property | pencil-raw | pencil-normalized | code-raw | code-normalized | drift | resolution）與 BQ-034-P2-QA-02 PM ruling 一致；23 列 code-side 逐列連結到 §7 Step 編號 + AC 編號。
- §6.3 FileNoBar 為 new primitive vs CardShell 擴 prop 的選型跑了正式 scoring matrix（cohesion/coupling/blast-radius/reuse）Option B 8.5 > Option A 6.5；避免 Tiebreaker post-hoc 問題（K-021 案例）。cardPaddingSize prop 明示「跟隨 CardShell size 防止 silent drift」是主動把隱形 coupling 提前封掉。
- §10 architecture.md sync plan 先草擬出 Edit scope 再執行，Pre-Write name-reference sweep grep `DossierHeader|FileNoBar|K-034 Phase 2` 分類 hit 至 current-state vs historical，L19 / L671 K-022 歷史 Changelog 正確保留未誤改。

**沒做好：**
- Prompt summary 說「17 new AC」但 ticket §5.1 實際列出 19 個 `####` AC heading。Architect 查到後以 BQ-034-P2-ARCH-01 記入 §12 Risks 但繼續設計（因為 19 條全部已在 drift table / Step 中涵蓋，無 blocker 性）。但更規範的做法是：在 §0 Scope Questions 停下，請 PM 確認數字（17 vs 19 要不要改 ticket summary 以對齊 §5.1），符合 persona §AC Sync Gate「只有 PM 可以改 AC」的精神；本次以 Risk 記錄 + 繼續設計屬於邊界判斷，非違反但非最佳實踐。
- Pencil frame JSON 逐檔讀後對 Bodoni font-size 寫入 §3 時，幾個 MetricCard title 的 fontSize 是 22 vs 28 的「依卡分化」（m1/m3/m4 = 22；m2 = 28），§3 row D-2 以「Bodoni 22/28 italic」summary 形式記錄但沒把每卡 granular 值展開到 FileNoBar 或 MetricCard §2.1 sub-table；Engineer 實作時需回看 frame JSON 才能得到 per-card exact value。更好是把 per-m1..m4 的 Pencil-verbatim token 值列成 MetricCard 專屬 sub-table（類似 §6.2 FileNoBar 規格表），讓 Engineer 單讀設計文件即可實作無需回查 JSON。

**下次改善：**
- 設計文件寫到 multi-variant 同類型 card（m1/m3/m4 vs m2 差異、6 RoleCard、3 PillarCard、3 TicketAnatomyCard、3 ArchPillarBlock）時，若 Pencil 值 per-variant 不同，必須在 §6 或 §7 中附 per-variant token 值表；不能只以「參見 frame JSON」的模糊引用。Action：senior-architect.md §Visual Spec JSON Consumption Gate 補一條「per-variant values: when a component is rendered N times with different Pencil values, design doc must include an N-row token table with pencil-verbatim values; cannot defer to JSON lookup by Engineer」。
- AC 數量不一致（prompt summary vs ticket §5.1）的「continue 還是 pause」邊界判斷，下次遇到差異 ≥ 2 條（本次 19 vs 17 = 差 2）直接走 §0 Scope Questions 停下問 PM，不再自行 continue + Risk 記錄。Action：senior-architect.md §Scope Question Pause Rule 增加「ticket AC count 與 prompt / summary 差異 ≥ 2 即 pause」的明確數字門檻。

---

## 2026-04-23 — K-037（favicon wiring — architect-ruling only, no design doc）

**做得好：**
- PM pre-recommendation 充分（7 點 rationale、File Change Scope 已凍結、5 個技術問題明確分出「Architect 決定」而非混雜 PM 決定），Architect 端直接進 §Triage path 而非重推理論據；避免了 K-011 那次「no architecture needed 但 doc 已 drift」未先 grep 的歷史坑。
- §Triage grep 命中 2 行都是 `dist/index.html`（SPA fallback）與 Google Font preconnect，無一筆描述 favicon/manifest — 直接確認 K-037 是 net-add，單行 Changelog 是正確治療路徑，無需改動 Directory Structure 或 Frontend Routing 段。
- Q1 link tag 順序 / Q3 `display: browser` / Q4 no firebase headers / Q5 theme-color = `#F4EFE5` 五題全部給出 binding 具體值而非 "depends"，且每題附 rationale，符合 persona §Never Do「never leave boundary blank spots」。

**沒做好：**
- 本次 ruling 路徑本身很順，但 brief 的「capability disclosure」+「exempt from designer JSON+PNG gate」這類組織性決策是 PM 提前消化過的；如果未來遇到主 session 直接丟 ticket 沒 brief 的情境，Architect 需要自己判斷是否 exempt `feedback_designer_json_sync_hard_gate`，目前 persona 對「非頁面 iconographic artwork」這種 edge case 沒有明確條款，只有 K-037 此筆為案例。

**下次改善：**
- 在 `senior-architect.md` §Visual Spec JSON Consumption Gate 補一條「非頁面性 iconographic artwork（favicon / app icon / logo-as-image-file）exempt from `specs/*.json` 要求，但 ticket frontmatter 必須明示 `design-locked: pending — human side-by-side review` + 指向 Pencil source 檔案路徑」。此規則一旦落地，future 同類型 ticket 就不需要每次重新以「PM 提前消化」方式 ad-hoc 例外。**Action：** 本次 retro log 寫完後同步開一筆 Tech Debt / 待補 persona rule（K-037 close 時或下個 architect 會話由 PM 決定是否落地）。
- K-037 有 5 個 Q 全部 Architect 可 rule，但若其中一個 Q 需要 PM 再 arbitrate（例如 Q3 改 `standalone` 要擴 AC），persona §Scope Question Pause Rule 的格式（§0 Scope Questions）未針對「brief 格式」做例子。此次沒觸發，但下次類似情境 Architect 應把 Q 搬進 brief 的獨立 §Scope Questions 區塊而非在 §Architect Ruling 裡混寫。

---

## 2026-04-23 — K-034 Phase 1 — Design doc §8 Sacred cross-check coverage gap (Reviewer-surfaced)

**做得好：** BQ-034-P1-01 (/about GA Sacred vs Pencil) 主動 surface 作為 blocker — 實際代表 §8 Sacred cross-check 在 K-017/K-018/K-022 三個 Sacred 維度是完整的。

**沒做好：** §8 Sacred cross-check table 漏列兩類 Sacred：
1. **K-031 AC-031-LAYOUT-CONTINUITY + AC-031-SECTION-ABSENT** — §4.3 Option A 刪除 `<SectionContainer id="footer-cta">` wrapper 會連帶作廢 `about-v2.spec.ts` L373-382 的 `#architecture.nextElementSibling.id === 'footer-cta'` 斷言。這個 downstream DOM-id 依賴在 §8 table 9 列沒列出 K-031。Engineer 首次 Playwright run 才 FAIL，self-adjudicated 為 pure selector upgrade (Reviewer 驗證通過為合法 pure refactor)，但流程上應該由 Architect 早期 grep 出來列入 §8 Sacred table 作為 downstream impact，而非 Engineer 到 red 才發現。
2. **AC-018-PRIVACY-POLICY GA disclosure vs Pencil SSOT** — §8 最末列提到 AC-018-PRIVACY-POLICY "Passes as-is"，但未把 GA disclosure `<p>` 節點 not in Pencil frames (86psQ + 1BGtd `children.length = 1`) 列為 AC-vs-Pencil 結構衝突。Reviewer Pencil parity gate 首次實戰把它 surface 為 Critical #C1，強迫 PM 當場開 `design-exemptions.md` §2 REGULATORY category 收案。Architect 端若在設計時就列為 BQ-034-P1-02 可讓 PM 在放行 Engineer 前裁決而非 Review 階段才發現。

根因：senior-architect.md §Sacred cross-check 當前的篩選策略是「grep ticket ID 前綴 (K-017 / K-018 / K-022)」，但 Sacred 不限於「此 ticket 改的檔案原本被誰擁有」— 還包括「本 ticket 改動的 JSX 結構/DOM `id` 被誰在 E2E spec 斷言」這個反向依賴。K-031 AC-031 正是這種下游依賴類 Sacred，按 ticket ID 前綴 grep 找不到（K-031 的 spec 檔是 `about-v2.spec.ts`，與本 ticket 改動的 JSX wrapper id 是間接關係）。

**下次改善（Phase 1 close 時 Edit senior-architect.md persona）：**
1. **擴展 §Sacred cross-check 前置 grep 範圍**（原先已有 `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` 四項，擬於 K-034 Phase 1 close 加入 persona — 擴展兩項新增）：
   - `nextElementSibling.id\|previousElementSibling.id\|.closest('#.*')\|querySelector('#` — 任何 spec 對 JSX `id` 的跨節點 DOM-adjacency 斷言
   - `querySelectorAll('[id=` / `parentElement.id` / `#<id-regex>.nextElementSibling` 等變體
2. **Pencil-vs-Sacred AC 衝突矩陣必建** — 凡設計 doc `visual-delta: yes` 且 ticket 改動的組件有任何 Sacred AC 約束，§8 Sacred cross-check 表必多一欄「Pencil SSOT 對此 Sacred AC 所述節點 / 屬性有無對應 frame.children 節點」。任一列該欄 = "NO / PARTIAL" 即列 BQ-escalate-to-PM 而非自行 implicit 解決於 design doc NEW column。
3. 兩項改善將於 Phase 1 close 時同步 Edit 進 `~/.claude/agents/senior-architect.md` §Sacred cross-check，與 BQ-034-P1-01 §PM ruling 已 pre-ACCEPT 的原四項 grep 合為完整 persona addendum。

---

## 2026-04-23 — K-034 Phase 1 — Footer variant retirement design

**做得好：**
- Pencil Artifact Preflight landed before any design-doc writing — verified `frontend/design/specs/home-footer.json` + `about-footer.json` + PNGs exist at HEAD, satisfying the K-034 Phase 0 `feedback_architect_no_design_without_pencil.md` gate on its first real-use ticket.
- Caught GA Sacred cross-conflict as BQ-034-P1-01 rather than silent-retiring the `data-testid="cta-email-contact"` + `trackCtaClick('email-contact', ...)` path that K-017 marked Sacred; escalated to PM per `feedback_ticket_ac_pm_only` + `feedback_pm_ac_pen_conflict_escalate` instead of deciding in design doc.
- Design doc §3 Route Impact Table enumerated all 5 routes (`/`, `/about`, `/diary`, `/app`, `/business-logic`) with affected / must-be-isolated / unaffected markers, matching `feedback_global_style_route_impact_table` hard gate for the shared-component retirement scope.

**沒做好：**
- First-pass draft recommended Option B on GA handling silently (retire `trackCtaClick` because "Pencil footer spec has no tracking attribute") — reviewing `feedback_ticket_ac_pm_only` + `feedback_pm_ac_pen_conflict_escalate` on second pass forced reclassification into BQ-034-P1-01 for PM ruling. Root cause: Architect instinct on refactor tickets is "simplify by dropping non-Pencil attributes"; Sacred invariant cross-check happens late in the pass rather than as a first-line grep.
- No pre-existing persona rule required Architect to grep `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` against the files slated for retirement/replacement before recommending an option, so GA-side collisions only surfaced during §API 不變性證明 write-up after option scoring had already been drafted.

**下次改善：**
- Per PM ruling on BQ-034-P1-01 (§PM ruling in K-034 ticket): for refactor tickets touching `<a>` elements or CTA components, Architect first-pass must run a fixed grep sweep on `data-testid="cta-"` + `trackCtaClick(` + `target="_blank"` + `href="mailto:"` across `frontend/src/` + `frontend/e2e/`, list each hit with its Sacred-status (K-017 / K-024 / K-030 etc.), and include the sweep output as a new §Sacred Cross-Check row **before** drafting option-scoring matrix. Codify as persona addendum in `senior-architect.md` at Phase 1 close — GA-type collisions surface in first pass instead of second, matching the spirit of `feedback_pm_ac_sacred_cross_check` already in place for PM but not yet for Architect.

---

## 2026-04-23 — K-034 Phase 0 (BFP Round 2 for K-035 α-premise failure)

**What went wrong:**
- K-035 design doc (`docs/designs/K-035-shared-component-migration.md`) §0 BQ-035-01 scoring matrix declared "Pencil fidelity: α=10, β=10, γ=0" with narrative rationale "Option α preserves both frames 4CsvQ + 35VCj — both render their own designs". The "both render their own designs" predicate was **asserted from memory of prior /about CTA-block perception**, not verified by `batch_get` on the two frames before scoring. Post-K-035 main-session `batch_get` on frames `86psQ` (/about footer) + `1BGtd` (/home footer) returned byte-identical content: one text node `yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn` in Geist Mono 11px. Pencil SSOT has ONE footer design, not two; the α-premise was empirically false and the correct ruling was γ (sitewide unify, no variant).
- Root cause of miss: existing `feedback_architect_pre_design_audit_dry_run.md` hard gate (K-013 2026-04-21) covered (a) `git show <base>:<file>` code-level dry-run for "pre-existing" / "API 不變性" assertions and (b) backend-schema + frontend-observable dual-axis — but did **not** cover "Pencil frame **content parity** across frames cited in option-scoring matrices". Architect listed frame IDs `4CsvQ` / `35VCj` in design doc header and in §0 narrative, but the persona rule did not require retrieving each frame's text/children nodes to verify narrative claims about "what each frame renders". No gate required option-scoring "Pencil fidelity" scores to be backed by `batch_get` output + `get_screenshot` PNG **embedded as evidence block in the design doc itself**; narrative assertion was accepted as sufficient.
- Compounding: Q6a "design locked = PM sign-off on Designer visual deliverable" did not yet exist as a persona rule — Architect started scoring options before Designer delivered any cross-frame content-parity artifact, so there was no upstream artifact to read. The whole "design locked → Architect starts" sequencing gate was missing from persona flow.

**Next time improvement:**
- **Structural fix (Q7c, §3 of K-034 ticket) — hard persona rule:** Architect may not produce a design doc for any route/page whose design is not represented by a corresponding Pencil frame exported to `frontend/design/specs/*.json`. No Pencil frame present → Architect escalates to PM (pushes back to Designer first), does not proceed with logic-only / parallel / "design catches up" path. To be codified into `senior-architect.md` during K-034 Phase 0 as a new top-level mandatory section alongside existing Pencil Frame Completeness Check.
- **Pre-Design Pencil Content-Parity Dry-Run (upgrade of existing `feedback_architect_pre_design_audit_dry_run.md` from code-level to code + Pencil content-parity dry-run):** whenever the design doc scoring matrix or narrative cites ≥2 Pencil frames as distinct/equivalent, Architect must (1) run `batch_get` on each cited frame including full children/text subtree, (2) embed the retrieved JSON (or Designer-produced `frontend/design/specs/*.json`) verbatim into the design doc as evidence block, (3) produce a cell-by-cell content-parity truth table across frames (font family/size/weight, text string, layout direction, padding, gap, color), (4) only then score "Pencil fidelity" per option. Narrative claims of "both render their own designs" / "frame X preserves K-017 CTA" without embedded `batch_get` + truth-table evidence are invalid and block design-doc delivery.
- **Maps to upcoming memory file `feedback_architect_no_design_without_pencil.md`** (K-034 Phase 0 deliverable 6), which will codify both the Q7c "no Pencil = no design doc" hard stop and the content-parity evidence-block requirement as a single combined gate. Existing `feedback_architect_pre_design_audit_dry_run.md` will be cross-linked (extended scope, not replaced).
- Post-K-034 Phase 0, all future option-scoring matrices that cite Pencil fidelity must carry a new mandatory sub-section `### Pencil Content-Parity Evidence` with the `batch_get` output block + truth table; Reviewer Step 2 Pencil-parity sub-step (Reviewer-side memory file) will reject design docs missing this block.

---

## 2026-04-22 — K-035 Phase 3 design-doc second-pass (/business-logic scope clarification sync)

**做得好：**
- PM scope-clarification loop caught the missed cross-section refs before Engineer release — 設計文件整體一致性在 Engineer step 1 之前補齊，系統完整性守住，沒有讓 stale `/business-logic` AC-verified 字樣外溢到 spec 實作或 verification 表。

**沒做好：**
- First-pass design doc 對 `/business-logic` 做了 30+ 處 reference（§0 BQ 裁決、§5 Route Impact Table、§6 EDIT 清單、§7 spec 註解、§8 QA 視覺、§9 Step 3、§11 architecture.md mapping、§13 Pre-Design Audit、§15 AC↔Test cross-check），當 PM 後續裁定 `/business-logic` 為 technical-cleanup-only 時，main-session 第一輪 scope-update pass 漏了 4 處非顯眼 cross-section：
  1. §8.3 L473 `(4 cases)` — 測試數 literal
  2. §9 Step 7 L547 `new 4 cases pass` — Engineer gate 語言
  3. §6 EDIT #14 L667 Changelog 預寫文字內的 `4 cases：... /business-logic 斷言 ...` enumeration
  4. §15 AC ↔ Test Case Count Cross-Check 整段（L789 / L791 / L795 / L802–803 / L805 五個位置）列 `/business-logic` 為 AC-035-NO-DRIFT 子測試 + 宣告 `4 = 4 = 4`
- 根因：這些位置散佈於「預寫架構文件 Changelog」「Engineer gate 數字 literal」「AC ↔ test 數量硬 gate 表」三個 section，非 route-name grep 會直接命中的顯眼位置；scope-update 時靠 review `/business-logic` 關鍵字但漏了「數字 literal `4 cases` 本身也需要重算」這條獨立維度。Architect 本人 first-pass 已經為 `/business-logic` 寫了 §7.1 exclusion note 與 §8.4 visual placeholder — 但 §15 AC↔Test 硬 gate 表的 count math 沒同步重算，導致 §7.1 = 3 cases 與 §15 = 4 cases 的內部矛盾。

**下次改善：**
- 新增 Architect Post-Design Sweep 硬步驟：「當任一 spec row 或 AC cell 被標記為 `technical-cleanup-only` / `unaffected` / `must-be-isolated` 時，立即 grep 整個設計文件對該 route name 逐處出現審計，每處對照 route 狀態 cell 驗證語意一致性。」
  - 具體步驟：
    1. 設計文件第一輪完成後，對每個 non-standard-status route 執行 `grep -n "<route-name>" <design-doc>`
    2. 對每個 hit 分類：AC-verified / technical-cleanup-only / exclusion-note / audit-reference / table-row
    3. 任一 hit 分類與該 route 的權威 §5 Route Impact Table status cell 不一致 → 修正或加 exclusion 註釋
    4. 同時對任一 test case count literal（`N cases` / `N tests` / 算式如 `+N` / `= N`）跨 §7 / §8 / §9 / §15 cross-check：§7 權威數字、§15 AC↔Test hard gate、§8 Playwright gate、§9 Engineer step 均需一致
- 此改善為 candidate for codification；本輪採 surgical consistency pass 不動 `senior-architect.md` persona，留待 main session 或 retrospect skill 在 Phase 3 closed 後判定是否 codify（可能位置：Same-File Cross-Table Consistency Sweep 下新增 §Route-Status-Change Trigger 子條，或 AC ↔ Test Case Count Cross-Check 下新增 §Cross-Section Count Literal Sweep 子條）。

---

## 2026-04-22 — K-035 Phase 3 design — shared Footer migration + shared-component canonical registry

**做得好：**
- OQ-1 α/β/γ 變體選型以正式加權評分矩陣解（Pencil fidelity 0.25 / 行為等價契約 0.25 / drift resistance 0.20 / 維護成本 0.15 / 視覺變更 0.15），α 9.7 vs β 6.25 vs γ 5.3，差距 3.45 無需 tiebreaker；未事後加分也未回彈 PM，權重先於評分宣告符合 Pre-Verdict Tiebreaker Pre-listing Rule。
- §3 OLD-vs-NEW behavior-diff 表 17 cell 逐格 dry-run（DOM tag / container class / content / link href / GA tracking / `data-testid` × home/about 兩 variant），17 equivalent / 0 divergent，Pure-Refactor Behavior Diff 硬 gate 以 enumerate 而非 summarize 通過。
- §13 dual-axis API 不變性證明同時覆蓋 (a) wire-level schema diff（`git diff main -- frontend/public/diary.json` + types/ = 0 lines）與 (b) frontend observable behavior diff 4-row（homepage full / about full / business-logic full / /diary empty），閉掉 K-013 C-1 單軸漏洞。
- §5 Route Impact Table 涵蓋全 5 route（`/` affected / `/about` affected / `/business-logic` affected / `/diary` unaffected no-footer / `/app` must-be-isolated K-030 Sacred），每列附「此 ticket 是否觸」+ 「Engineer 視覺驗證步驟」，對齊 `feedback_global_style_route_impact_table.md`。
- Props interface required + 無 default 明示拒絕 silent drift（`variant: 'home' | 'about'`，三 import 點皆須顯式傳值），避免 Engineer 實作時為省事加 default 再讓未來新 route 預設拿錯 variant。
- `components/shared/` 目錄作為 sitewide page-level chrome canonical registry 明確命名（非 `common/`、非 `primitives/`），第一位住戶 Footer，同時開 TD-K035-01 追 UnifiedNavBar 後續遷入，而非本票擴張 scope；架構 narrative 清楚分離「本票做」與「後續票做」。
- architecture.md Self-Diff：Footer 放置策略表 3 列、Shared Components 邊界表 2 列（從 3 列合併）、Directory Structure 3 處（L160 FooterCtaSection pending deletion / L175 新 shared/ 區塊 / L455 /app 行 HomeFooterBar → Footer）、Changelog prepend — 5 處 Edit 全逐格對源，`grep HomeFooterBar|FooterCtaSection` 7 hit 分類（當前狀態 / Changelog 歷史）全部核對。

**沒做好：**
- §4 Pencil 節點 ID 引用（`4CsvQ` 首頁 footer / `35VCj` /about footer subtree）本應用 `mcp__pencil__batch_get` 驗證，但 Pencil MCP 在本 session 顯示 `No such tool available`，改以 K-021 設計文件 §Appendix + K-035 ticket §Evidence 既有節點引用為二手來源；若 K-035 前 Pencil 節點結構變化，二手來源會失準。Engineer Step 1 應於實作前加一步「Pencil MCP 可用後重跑 batch_get 覆驗 `4CsvQ` + `35VCj` DOM 結構是否仍對齊本設計文件」。
- 初期 Phase 3 re-engagement 花了較多 context 在重建 K-017 / K-021 / K-022 三 ticket 的 Footer 歷史狀態（三票累積的 Sacred clause + K-021 drift-preservation test + K-022 link style mandate），若之前 Architect retrospective log 有 cross-ticket 「Sacred clause 表」會省不少回讀；這是下游改善，不是本次交付 gap。

**下次改善：**
- **Pre-Write Name-Reference Sweep**（新行為規則，已同步 Edit `~/.claude/agents/senior-architect.md`）：任何 architecture.md Edit 涉及 "rename / delete / replace" 類操作（例：`HomeFooterBar` → `Footer`、`FooterCtaSection` → 消失），Edit 完畢在 Self-Diff Verification 前必跑 `grep -n "<old-name>\|<new-name>"` 於同檔案，列所有 hit 分類為「當前狀態（需同步 Edit）」vs「Changelog 歷史（不得 Edit）」vs「其他表格（需同步）」；若分類 "當前狀態" 有遺漏 hit → 補 Edit；"其他表格" 有遺漏 hit → 擴大 Edit 至覆蓋全部 → 才進 Self-Diff。本次 L455 `/app` 行原差點漏掉（只因最後順手掃才抓到）。
- **Sacred clause 退役需顯式登記**：K-021 `/about 維持 FooterCtaSection（K-017 鎖定）` 於 K-035 設計 retire，本設計文件 §2 有寫入 retired Sacred 表，但 retrospective log 同時記一次可讓未來任何 ticket grep "retired Sacred" 即查齊；下票起 Architect persona 加「Sacred 退役 Edit architecture.md Changelog 寫 retired：K-XYZ 某 clause（原鎖定 K-ABC）」為硬步驟。
- **Pencil MCP 不可用時 fallback SOP**：遇 `No such tool available` 時，以「最近一次讀過 Pencil 節點 ID 的 ticket + 該 ticket 設計文件引用」為二手來源，並於本次設計文件 §4 加紅字 "Pencil MCP 不可用於本 session，Pencil 節點引用為二手來源（最後一次覆驗：K-XXX on YYYY-MM-DD），Engineer Step 1 須覆跑 batch_get"；避免未顯式標記讓下游以為節點剛被驗過。

---

## 2026-04-22 — K-029 /about card body text paper palette migration

**做得好：** Pre-Design Audit 以 `git show main:<file>` 覆驗 ArchPillarBlock + TicketAnatomyCard 與 worktree 完全一致，確認 7 個 site 無遺漏；§13 Boundary Pre-emption 自查時抓到 `testingPyramid` 為 optional props，`arch-pillar-layer` 實際 DOM 數為 3（Pillar 3 內 Unit/Integration/E2E 三層），不是 9（三 Pillar × 三層）也不是 1，於設計文件明示避免 Engineer 誤寫 `toHaveCount`。
**沒做好：** 初稿 §6.2 僅列 `data-testid` injection 4 項，未在同表同時交代 Outcome / Learning label 選擇路徑（從 `ticket-anatomy-body` 往下 `locator('span', { hasText })`），檢查 §15 AC↔Test Case 前還沒補；AC 說 3 Outcome + 3 Learning 各獨立斷言，若未指定 selector Engineer 可能自訂 testid 違反 Architect mandate。交付前補 §6.2 Note 段落才完整。
**下次改善：** 未來 mandate testid 設計時，對同 AC 下所有需被斷言的元素（含 testid + 非 testid 選擇的 sub-element）一次列完選擇路徑，不要分兩階段寫。新增 "Assertion selector matrix: target-element × selector-path × toHaveCount" 為 §6 必備 sub-table。

---

<!-- 新條目從此處往上 append -->

## 2026-04-22 — K-024 /diary structure rework + diary.json flat schema 設計（all 4 Phases）

**做得好：**
- All-Phase coverage gate 硬守：設計一次涵蓋 Phase 1 (schema + zod + Vitest) / Phase 2 (useDiary reshape + useDiaryPagination hook) / Phase 3 (/diary v2 visual rework + DevDiarySection reshape) / Phase 4 (PM persona edit)，未留「之後再補 Phase 3」空白。§16 All-Phase Coverage Gate 表四列全 ✓，Engineer 接手有完整全圖而非只能看前兩 Phase。
- Pre-Design Dry-Run Proof：§0.3 對 `useDiary(limit)` 畫完整 3×3 truth table（limit=undefined / 0 / N × 資料 0/N 筆/N+ 筆），並引 `git show main:frontend/src/hooks/useDiary.ts` 驗 OLD 分支行為；避免 K-013 C-1 同類 pre-existing 誤判。
- Cross-Page Duplicate Audit 真做：§9 grep `rail|marker|timeline` 三 pattern，認出 DevDiarySection + DiaryEntryV2 + DiaryRail + DiaryMarker 四檔共 rail/marker 模式，抽 `timelinePrimitives.ts` 常數模組，明寫 RAIL / MARKER / ENTRY_TYPE 三 export，避免 homepage vs /diary 間 drift。
- BQ 守本分：`homepage-diary-entry` literal vs K-028 Sacred `diary-entry-wrapper` 衝突寫成 BQ-024-01 三選項 + Architect 建議 (a) rename-with-Sacred-update，明示「Phase 2 啟動前 blocked 等 PM 裁決」，不自行決定，不 Edit ticket AC。
- AC ↔ Test Case count Cross-Check：§7.3 mapping 表 8 row + 33 test 總數 + 宣告「Playwright new test total: 33」三數字一致，Engineer 交付時 `wc -l test(` = 33 可直接驗證。
- 1-entry rail boundary 捕捉：§4.3.1 認出 entries.length=1 時 rail `top:40 / bottom:40` 會 collapse（48px min-height 下），明定 `entries.length >= 2 && <DiaryRail />` 條件渲染，避免 orphan rail line。

**沒做好（根因 + 為何 design 階段差點沒抓到）：**
- §6.4 data-testid conflict 初稿誤推薦 (C) dual data-testid attribute，第二 pass 才意識到 HTML spec 禁止 duplicate attribute names。根因：AC literal 與 Sacred spec 衝突時，反射性想到「兩者並存」但沒先查 HTML 規格。Same-file cross-attribute check 應該是 §data-testid 段第一步。BQ-024-01 因此改寫兩次。
- Pencil MCP 在本票仍不穩，但不是 K-024 第一次用：本票已知 `.pen` = JSON 可 fallback，仍花時間確認 MCP 狀態。K-028 retrospective 已提過這點。應該早一步直接 JSON parse。
- 設計文件 24 + 8 + 3 = 35 檔異動規模偏大，一張票內含 4 Phase。雖 All-Phase Coverage Gate 要求全涵蓋，但 Phase 3 的 24 檔異動 + 2 spec + 8 fixtures + 刪除 3 檔，Engineer 實作 + Reviewer 審查壓力集中。Phase 1+2 / Phase 3 分 PR 是 §13 的緩解，但票本身應該當初 PM 拆更細（Phase 3 可能獨立一張票 K-024-B）。這是 PM 責任，但 Architect 在設計時可以主動 flag「建議拆票」而非只分 PR。

**下次改善：**
1. **HTML spec sanity check for testid conflicts (first pass, not second pass)**：任何 `data-testid` AC literal 與既有 Sacred 值衝突 → 先驗 HTML 規格是否允許 duplicate attribute（禁止）→ 直接跳過 dual-attribute 選項。此行為規則應加進 `~/.claude/agents/senior-architect.md` 作為 §Testid Conflict Resolution 子規則；若 K-025 同類重現再 codify，否則暫留 retrospective。
2. **Pencil MCP fallback 成為反射動作**：本 retrospective 本身不再提 MCP 狀態，直接 `.pen` JSON parse。此行為已於 K-028 retro 提過，仍違反 → 本條 codify 到 persona：Pencil MCP 連線失敗或 `batch_get` error → 立即 Python traversal JSON，不等使用者提醒。
3. **設計文件規模 > 1000 lines 或 4+ Phase → Architect 主動回報 PM 建議拆票**：不只分 PR，設計文件本身若超出臨界（行數 / Phase 數 / 檔案異動數）即為 ticket 過大訊號，應於 §0 Scope Questions 加一條「建議拆為 K-XXX-A + K-XXX-B」，讓 PM 在 Phase Gate 前決定。本條行為規則 candidate，K-025 觀察一輪再決定是否 codify persona。

**BQ-024-01 resolution:** PM ruled Option (b) 2026-04-22 — K-024 AC literal `homepage-diary-entry` renamed to `diary-entry-wrapper` (reuse K-028 Sacred). PM rationale: K-028 closed + deployed + live CDN bundle grep-verified contains `diary-entry-wrapper` → Sacred immutability is absolute; AC literal edit is PM-owned (`feedback_ticket_ac_pm_only`) and cheapest. Architect's initial (a) rename-Sacred recommendation was wrong primary — should have ordered (b) → (c) → (a) with (a) flagged "requires Sacred-break PM override". Lesson codified in `docs/designs/K-024-diary-structure.md` §20 "Next time improvement" item 1 (deployed Sacred + conflicting AC literal → primary rec is AC literal edit). Will promote to `~/.claude/agents/senior-architect.md` if pattern recurs in K-025+.

---

## 2026-04-22 — K-025 UnifiedNavBar hex→token + dual-rail spec upgrade

**做得好：** Pure-refactor 落實「behavior equivalent at rendered-color level, NOT at CSS-selector level」分層敘述（對齊 QA Early Consultation Q1 修正）：§5 Behavior-diff Statement 三個 bullet 分別處理 rendered-color / selector-name / props-logic 三層，避免 K-021 Q2 裁決當時錯誤敘述「compiled CSS 相同」重演。§7 Step 2 / Step 5 設計為 `npm run build` 前後 dist CSS declaration count diff gate，讓 QA Q1 的 dist grep 等價性從 AC 文字落地到 pipeline 可執行驗證（而非仰賴 Engineer 心算）。§3 AC ↔ Test Case Count cross-check 列明 5 AC `And` ≤ 5 新/改 tests，避免「AC 3 條 inactive 斷言 = 3 獨立 test」膨脹問題（retrospective 段有詳述這個一度想歪的地方）。

**沒做好：** 初稿曾把 `/` 3 inactive link 拆為 3 個獨立 test case，後才發現 ticket AC-025-NAVBAR-SPEC `And #3`「新增 `/` route desktop inactive 3 斷言」未要求 3 test。拆 3 test 會違反 persona 「test 數量對齊 AC 家族數不膨脹」原則；雖然設計階段抓到並改為 1 test 3 `expect`，但反映 Architect 在 pure-refactor 票缺乏「spec-file 舊結構掃描」作設計共用錨點。

**下次改善：** 未來 pure-refactor / spec-refactor 類 ticket（type=refactor 且 scope 含 *.spec.ts / *.test.ts 改寫），在寫 §3 E2E diff table 前，先拉出一節 "Source of Truth Scan"（放 §1.5 或 appendix），以 `grep -n` 格式列出 spec 所有相關 describe / test 標題 + 所要改的斷言行號 + 對應 AC `And` #編號，作為 §2（code 對照表）+ §3（spec 對照表）共用引用源；避免後續人肉 cross-check 不同 §之間對應關係時重工，也避免「拆太細 test 數量膨脹」這類對齊失誤。本條補進 senior-architect.md「Pre-Design Dry-Run Proof」同層，作為 refactor-type ticket 的補充 gate。

---

## 2026-04-22 — K-020 GA4 SPA Pageview E2E Test Hardening (design)

**What went well:** Built a 6-row "URL transition → `location.pathname` change → effect fires → beacon sent" truth table (§1 in design doc) before drafting any AC mapping. This table resolved 4 separate AC (SPA-NAV / NEG-QUERY / NEG-HASH / NEG-SAMEROUTE) from one source of behavior truth, prevented "Engineer decides" in negative-test design, and mapped 1:1 onto QA Challenge #7 (the blocking BQ the ticket was re-planned to close). AC ↔ test count cross-check (§4 in design doc) locked 9 = 9 = 9 before delivery — no silent drift between AC sum, test table row count, and declared total (K-030 I-2 class).

**What went wrong:** On the `dl` vs `dp` GA4 MP v2 payload key question, I was tempted to pin `dl` decisively in design from knowledge-cutoff (GA4 gtag.js always emits `dl`), but Pre-Design Dry-Run Proof gate requires `git show <base>:<file>` or equivalent verifiable citation for pre-existing behavioral claims. I have no browser/network execution capability as an Architect persona — AC literally asks "Architect dry-run confirm" which is un-executable. Had to compromise to a test-tolerant regex `[?&](dl|dp)=` + mandate Engineer Dry-Run Record DR-1..3 at implementation time. This works, but it reveals a systemic gap: AC-level expectations (e.g. "Architect dry-run determines value X") assume Architect has runtime tools that the persona actually lacks.

**Next time improvement:** Codify as a persona pattern "Dry-Run Deferral": when an AC asks Architect to determine a value that requires browser/network execution, the correct design output is (a) a test-tolerant assertion that accepts either plausible outcome + (b) an explicit Engineer Dry-Run Record block the Engineer must populate pre-freeze. This is NOT the same as "let Engineer decide" (which is forbidden) — the design still pins the contract; only the observable value identity is resolved at implementation. Will propose adding this as a named pattern under `## Pre-Design Dry-Run Proof` in senior-architect.md after K-020 closes (gates durable rule additions behind "pattern recurred ≥ 2 tickets" — K-020 is case 1, so log only this round, propose persona edit when case 2 appears).

---

## 2026-04-21 — K-030 post-code-review doc alignment（I-2 fix-now）

**做得好：** 先讀 ticket AC 確認 BG-COLOR 經 QA Early Consultation 已被 PM 拆為兩 Playwright cases（ticket L191 Option A ruling），再 cross-reference ticket §AC total 明列 "minimum 5 new Playwright test cases (NEW-TAB × 1 + NO-NAVBAR × 1 + NO-FOOTER × 1 + BG-COLOR × 2)"，確認 source of truth = 5 cases，不是 4，也不是 6。Hero CTA 追加部分採保守策略（總數先寫 5 + §6.3 addendum 占位），避免前瞻寫 6 造成設計文件與 main branch spec count 不一致。

**沒做好：** 設計文件 §6.2 撰寫時未與 AC 層 BG-COLOR 的「2 cases」要求對齊 — 當時只看到 AC title「/app page background matches ...」就心算成 1 case，未展開 ticket L191 PM ruling 的兩斷言結構（wrapper ≠ paper AND === gray-950；body === paper）直接拆兩 test case。結果 §6.2 表格實際已經在 T4 row 塞了 wrapper + body 兩個斷言（合併寫），計數卻仍標 4。這是典型「實作有做到但計數沒對齊」的 drift，Code Reviewer I-2 catch 後才暴露。

**下次改善：** Architect persona checklist 加一條硬步驟「design doc §6.x test count vs ticket AC count cross-check」：每次寫 §6 Playwright 新 spec 段時，回讀 ticket §AC total 聲明的 minimum test case 數字，逐 AC 對應 test ID 列 mapping 表，mapping 表列數必須等於 §6.x 表格行數 = 聲明的「測試總數」。任一不等 → 設計文件未完成不得交付 Engineer。本條補進 senior-architect.md「All-Phase Coverage Gate」段同層。

## 2026-04-21 — K-030 /app isolation 設計（new tab + 撤除 NavBar/Footer + bg 覆蓋）

**做得好：** PM flag 的 spec conflict 僅列 `sitewide-body-paper.spec.ts`，但 Architect 在 §6 File Change List 之前主動 `grep -rn "/app" frontend/e2e/` 全目錄掃描，發現兩處額外必連動 spec（`sitewide-footer.spec.ts` L47–51 + `sitewide-fonts.spec.ts` L55–73 兩個 `/app` footer 斷言會在 footer 撤除後失敗）。若只處理 PM flag 的一個 spec，Engineer 上線時會撞另兩個 fail。此提前掃描避開了分段修復的往返。Pre-verdict scoring 兩處（§2.1 bg 色、§2.6 spec strategy）皆於裁決前 locked 5 維 weights，後採分差 ≥ 1 的 Option，無 post-hoc 調權。架構文件同步後於同檔 cross-table sweep `grep -n "HomeFooterBar|UnifiedNavBar"` 發現 L118 TopBar 描述與 L415 NavBar 敘述仍有 pre-K-030 stale 字串，一併修正，避免 K-021 Round 3 同類跨表 drift 重現。

**沒做好：** 裁決 §2.1 bg 色時 Option A（pre-K-021 原設計 `bg-gray-950`）第一眼就很優，花了不少時間把 Option B/C/D 的 pros/cons 寫完整填表。對 Architect 而言 20 cell 打分提供了可追溯證據，但對 PM 讀性而言 §2.1 可更精簡——Option B/C/D 可合併為一列「淺色方案（white/off-white/paper-adjacent）」集中評分，減少重複維度。

**下次改善：** Pre-verdict matrix 若同類 Option 的分差預期 ≥ 3 分，合併為同一列而非逐一展開（例如本票 B/C/D 三個淺色方案在「對齊原設計意圖」維度同為 2–3 分，可合併為「淺色系方案」單列），打分表縮為 Option A vs Option 淺色系兩列即可。保留差異化維度分析用 prose 補充，不靠表格逐格。此改善於 persona 的 Pre-Verdict Tiebreaker 段補一條「同質 Option 合併規則」。
## 2026-04-21 — K-031 /about remove "Built by AI" showcase (S7)

**What went well:** Cross-repo grep for `BuiltByAIShowcaseSection|banner-showcase|The real banner is clickable` surfaced four distinct drift points in architecture.md (L13 Summary `8 sections`, L140 `S8 email`, L410 Frontend Routing row, plus L147 coincidence commentary) in a single audit pass. Ticket's pre-verified AC table (§Route / Component Existence Verification) aligned 1:1 with my grep evidence, meaning PM had already done the existence check — no duplicated work, no contradictions. No Scope Questions needed, delivery was pure mechanical removal + doc sync.

**What went wrong:** The `BuiltByAIShowcaseSection.tsx` file was never added to architecture.md Directory Structure block during K-017 Pass 3 when the file was first created. I inherited this 2-day-old drift silently, and only noticed after running the §8 Self-Diff grep. If K-031 had been an add-feature ticket instead of a removal ticket, the missing entry would have caused me to treat the file as "new" rather than "existing". Architect's own earlier ticket (K-017 Pass 3) skipped the sync — a self-audit gap.

**Next time improvement:** After any `/about` (or other page with a sub-component directory) ticket, execute `ls frontend/src/components/about/*.tsx | wc -l` and count the entries in architecture.md's about/ tree block — if mismatched, flag as "pre-existing drift" in design doc §Self-Diff and decide whether this ticket fixes it (cheap) or logs it as Known Gap. Codify this count-match check as an explicit bullet under `## Architecture Doc Structural Content Self-Diff` → `### Same-File Cross-Table Consistency Sweep` in senior-architect.md. Will propose persona edit if this pattern recurs in K-032+; for K-031 the fix is soft (noted in design doc §8.1), no persona edit this round.

## 2026-04-21 — K-028 Homepage Visual Fix (Section Spacing + DevDiarySection Flow Layout)

**What went well:** Pencil MCP was failing (`✗ Failed to connect`) but I immediately pivoted to direct JSON parse of `frontend/design/homepage-v2.pen` via a short Python traversal. Got the full layout tree for `4CsvQ > hpBody` including `gap: 72` (exact section spacing source of truth) and rail node `x=29, y=40, h=304` inside `diaryEntries` in one pass. No stall on the MCP failure. All three pre-verdict matrices (spacing wrapper / rail implementation / mobile gap value) declared dimensions before scoring and converged without post-hoc weight adjustments. Boundary pre-emption table enumerated 9 scenarios (including single-milestone edge case that could collapse the rail) before design handoff — no blank spots left for Engineer to decide.

**What went wrong:** Initial tool call batch did not include the Pencil MCP connectivity check, so I only noticed the MCP failure mid-read after trying to recall frame data. Lost ~30 seconds of reasoning on "should I retry MCP" before confirming the `.pen` file is plain JSON. The K-021 architecture.md gave enough hints that `.pen` is JSON-based but I did not internalize that as a fallback pattern.

**Next time improvement:** Add to `senior-architect.md` persona — "Pencil MCP Fallback: `.pen` files are plain JSON; if `claude mcp list` reports the pencil server failed or `batch_get` errors, read the file directly with Read / Python traversal. Do not block the session on MCP recovery." This is a behavioral rule (tool fallback strategy), so per the codify-retrospective rule it must also be Edited into the persona file as a hard step — will request PM to acknowledge this retrospective before I make the persona edit.

---

## 2026-04-21 — K-013 Bug Found Protocol（Architect W-1）Pre-Design Audit 未做 code-level dry-run

**做得好：**（無——本條目是反省過失，不列）

**沒做好（具體事件 + file:line + 根因）：**

1. **具體事件：** K-013 設計文件 `docs/designs/K-013-consensus-stats-ssot.md` §0.3 SQ-013-01 斷言「全集（`appliedSelection == all matches`）分支走 `appliedData.stats`，StatsPanel 的 ConsensusForecastChart 收到空陣列，**全集下不顯示 consensus 圖**」。此前提**錯誤**。Code Review depth 由 Reviewer 驗出 Critical C-1：K-013 Engineer 照 AC-013-APPPAGE 實作後，full-set 分支 consensus forecast chart 消失，因為 OLD code 原本會畫、K-013 把它拿掉了。

2. **OLD 實作真實行為（base commit `b0212bb`，`frontend/src/AppPage.tsx`）：**
   - L202–210 `projectedFutureBars` useMemo：`const activeMatches = appliedData.matches.filter(m => appliedSelection.has(m.id))` — 初次 predict 後 `setAppliedSelection(allIds)`（L363），所以 **full-set 下 `activeMatches` = 全部 matches，`projectedFutureBars` 會算出 ≥2 筆**。
   - L218–231 `displayStats` useMemo：
     ```
     if (!appliedData.stats) return null
     if (projectedFutureBars.length < 2) return appliedData.stats     // ← fallback (L220)
     const computed = computeDisplayStats(...)
     if (!computed) return appliedData.stats
     return {
       ...computed,
       consensusForecast1h: projectedFutureBars,                      // ← 無條件注入 (L224)
       consensusForecast1d: projectedFutureBars1D,                    // ← 無條件注入 (L225)
     }
     ```
   - 第三分支（L222–226）**沒有任何 full-set vs subset 判斷**，無論 `appliedSelection` 是否等於全集，都會用前端 `projectedFutureBars` 覆蓋 `consensusForecast1h/1d`。Consensus chart 在 OLD code 下 **full-set 與 subset 皆顯示**。
   - K-013 AC-013-APPPAGE 要 Engineer 在「全集分支直接回傳 `appliedData.stats`」，等於砍掉 L222–226 的注入路徑 → full-set 下 consensusForecast 退回後端的 `[]`（SQ-013-01 下半段我有正確描述後端 PredictStats 永遠 `[]`）→ 圖消失。此為 K-013 **引入的 regression**，不是 pre-existing。

3. **根本原因（為何 Pre-Design Audit 沒抓到）：**
   - Pre-Design Audit 在 §0.1 列 `frontend/src/AppPage.tsx L110-236 已讀`。我確實 Read 了那個 range，但**只讀結構**（看到 `if (projectedFutureBars.length < 2) return appliedData.stats` 這行，直覺「full-set 進這條 fallback」），**沒有做 code-level dry-run**：沒追 `projectedFutureBars` 的計算路徑 →沒發現 `appliedSelection` 在 predict 後會 `setAppliedSelection(allIds)`（L363）→ 沒推導 full-set 下 `projectedFutureBars.length >= 2` 實際成立 → 沒進第三分支 (L222–226) → 錯誤結論「全集走 fallback」。
   - 換言之：我把「讀到這個 file:line range」當成「驗證了這個 range 的行為」。實際上我只 pattern-match 了一條 if 陳述，沒對所有輸入組合（full-set 有 matches / full-set 無 matches / subset / empty）跑一次資料流。

4. **為何 §8 API 不變性證明通過但沒擋下：**
   - §8.1 Before/After diff 六列全是 **backend schema** 維度（`PredictRequest` / `PredictResponse` / `PredictStats` 欄位 / `compute_stats()` signature / 後端回傳值範圍 / `usePrediction.ts` camelCase 映射）。全部標 Diff：空。
   - §8.2 驗證方法只要求 `git diff main -- backend/models.py` = 0 lines — 只證明 **後端 wire-level schema 不變**，沒證明 **frontend `displayStats` 的 observable behavior 等價**。
   - 換言之：我寫「API Schema 不變性」時想的是 wire contract，但 K-013 AC-013-APPPAGE 改的是 **frontend 的 `displayStats` 計算分支**，這個 observable output（`consensusForecast1h/1d` 從「有前端 projected 值」變成「後端 `[]`」）完全沒在 §8 被驗。§8 的定義域狹隘，不涵蓋「前端 behavior equivalence」。

**下次改善（具體可執行，寫進 persona 硬步驟）：**

- **下次改善 A（Pre-Design Audit 檔案掃描後強制 dry-run）：** Pre-Design Audit 的 `§0.1 Files inspected` 表不得以「range 已讀」作為完結；每個列出的 range，凡涉及 **「pre-existing 行為」/「既存 bug」/「既存分支走哪條」** 等行為斷言，必須額外 attach 一張 **dry-run truth table**，列出所有相關狀態組合（e.g. full-set vs subset × matches empty vs ≥2 × viewTimeframe 1H vs 1D）× 每條分支輸出，並引用對應的 file:line。無 dry-run table 者，不得在設計文件寫「既存行為如 X」這種斷言。
- **下次改善 B（pre-existing 斷言強制 `git show <base>:<file>` + dry-run）：** 凡設計文件出現 `pre-existing` / `既存行為` / `K-013 之前如此` 字樣，**強制 `git show <base-commit>:<file>` 讀 OLD 實作 + 逐 branch dry-run**（不是逐檔 Read HEAD，那只證明「現在 HEAD 這樣」，不證明「base 也這樣」；本次 K-013 Reviewer 要求看 `b0212bb` 才能驗）。寫斷言時必須引用 `git show <commit>:<path> L<start>-<end>` 作為 source，不得憑 HEAD Read 替代。
- **下次改善 C（§API 不變性證明擴充為「Wire + Frontend Behavior 雙軸」）：** §API 不變性證明的定義域必須明示雙軸：(1) wire-level schema（`git diff main -- backend/models.py` = 0），(2) frontend observable behavior（對每個 `useMemo` / `useState` / event handler 等輸出通道，列 Before → After output diff table，全集 / subset / empty 三個情境各一列）。只做 (1) 不做 (2) 的設計文件 = 不變性證明不成立。AC 涉及 frontend 計算邏輯改寫時，此 §必須延伸到 frontend 分支 observable behavior，不得僅以 backend schema diff 作結。
- **下次改善 D（三項均 codify 進 `senior-architect.md` 硬規則區）：** A/B/C 三條同步 Edit 進 persona「Pre-Design Dry-Run Proof」段落（硬 gate，非 narrative），並在 `feedback_architect_pre_design_audit_dry_run.md` memory 條目留下觸發條件與 K-013 W-1 事件作為 Why。

---

## 2026-04-21 — K-013 Consensus / Stats SSOT 設計文件

**做得好：** §0 Pre-Design Audit 逐檔讀 `compute_stats` / `_projected_future_bars` / `computeDisplayStats` / `computeProjectedFutureBars` / `PredictStats` 五處實作，發現 pre-existing gap（`PredictStats.consensus_forecast_1h/1d` 後端永遠回 `[]`，全集下 StatsPanel 的 consensus 圖本來就沒畫），並列為 SQ-013-01 釘在 §0 讓 Engineer + Reviewer + PM 三方對齊，避免 Engineer 自行「順手修」擴大 scope 或 Reviewer 誤判為 K-013 引入的 regression。子決策 D1/D2/D3（util vs hook / generator script 入版 / import JSON）皆用 pre-verdict 打分表 ≥1 差距直接採，未事後補維度。architecture.md Edit 後對 `statsComputation` / `stats_contract_cases` / `computeStatsFromMatches` 三個關鍵字 grep 全檔 11 hits 逐一驗，並修正 §Consensus Stats Source of Truth 原本寫 `PredictStats` 回傳型別的過期簽名為 `StatsComputationResult`。

**沒做好：** 初稿把 Directory Structure 新增的 `statsComputation.ts` / `fixtures/` / `statsComputation.test.ts` 寫成「K-013；…」而非「pending K-013 Engineer Step N」標記——磁碟上這三個檔案此刻**都不存在**（Architect 尚未啟動 Engineer），違反 persona 規則「must ls or Glob to confirm disk state; if deletion/creation hasn't happened, use pending marker」。Self-Diff 補救時發現才改回 pending。根因：寫 Directory Structure 時直覺用「目標狀態」措辭，漏掉磁碟現況驗證這一步。

**下次改善：** 編輯 architecture.md Directory Structure block 前，**強制先跑 `ls` / `Glob`** 對照現在磁碟狀態，再決定每個條目用 "current state" 還是 "pending K-XXX Step N" 標記；把此步驟加進 Pre-Design Path Audit 的硬動作清單（K-023 已建立，本次擴充「磁碟-vs-目標 標記區分」這一小項）。

## 2026-04-21 — K-023 Homepage Structure Detail Alignment v2

**What went well:** Pencil design file analysis surfaced four critical contradictions (A-3 already implemented, A-4 has no corresponding element in design, A-5 hairline is already in correct position per design, C-4 bottom padding mismatch) before any code was written. All four were escalated as Scope Questions to PM rather than self-resolved, preventing Engineer from implementing changes that contradict the design. Pre-Design Path Audit caught `StepCard.tsx` and `TechTag.tsx` as ghost entries in architecture.md.

**What went wrong:** The ticket stated "Architect extracts text from design" for A-4, implying the content exists in the design. Architect read the ticket before checking the Pencil file structure, spending time on AC analysis before discovering the design has no second-line brick subtitle. The contradiction should have been surfaced in the first tool call sequence.

**Next time improvement:** When a ticket references "Architect extracts exact content from design file", open the design file first to verify that content exists before reading AC details. Design file extraction should be the first operation, not confirmation of what AC already claims exists. Add this as a pre-condition check in the design workflow: "design file verification before AC analysis" when ticket scope involves design content extraction.

## 2026-04-21 — K-022 /about 結構細節設計

**做得好：** 硬步驟 grep dark pattern 執行後，發現 `SectionLabel.tsx` 和 `SectionHeader.tsx` 目前 /about 根本未直接使用，避免 Engineer 改了一個 /about 不使用的組件；Pencil batch_get 取到 Redaction bar 高度（10px）/ Role Card 高度（320px）/ grid gap（14px）/ OWNS label 字級（10px）等精確數值，設計文件規格可直接照抄而非估算；發現 AC vs 設計稿兩處不一致（BQ-022-01 CASE FILE vs Nº 04、BQ-022-02 LAYER vs FILE Nº），列 Blocking Questions 交 PM 裁決，不自行選邊。Self-Diff 執行：13 列 vs 13 列 ✓。

**沒做好：** Ticket §A-12 明列 `components/shared/` 路徑，實際 codebase 無此目錄（primitives 在 `primitives/`，SectionHeader/SectionLabel/CtaButton 在 `common/`）。設計文件修正了實際路徑，但未在 §0 顯著標注「ticket 路徑筆誤，以設計文件為準」，Engineer 先看 ticket 後看文件可能仍困惑。根因：Architect 遇到 ticket 與 codebase 路徑不符時，只補正設計文件，未在入口處明確告警 ticket 筆誤。

**下次改善：** ticket 的具體路徑或組件名與 codebase 實際不符時，設計文件 **§0 設計前提** 段必須加一條「Ticket 路徑勘誤」列表，對比 ticket 路徑 vs 實際路徑，防止 Engineer 混淆。此規則補充進 senior-architect.md 硬步驟「Pre-Design Path Audit」段。

## 2026-04-21 — K-027 手機版 /diary milestone 重疊修復

**做得好：** 設計開始前先 `ls` 驗證 `primitives/` 目錄，發現 architecture.md 聲稱 K-017 Pass 2 已將 `MilestoneSection.tsx` / `DiaryEntry.tsx` 刪除並替換為 `MilestoneAccordion.tsx`，但磁碟完全不存在 `MilestoneAccordion.tsx`。主動確認後以實際 codebase 為設計基準，並在設計文件 §1.1 明確標記此 drift，避免 Engineer 找不存在的組件。同時觸發 architecture.md 多處 drift 修正（diary/ 子樹 + DevDiarySection + Summary 段），一次清理。

**沒做好：** `architecture.md` 的 K-017 Pass 2 drift（diary/ 組件被描述為刪除但實際保留）在 K-017 / K-021 任務結束時均未被稽核，累積至 K-027 才被發現。根因：K-017 Pass 3 廢棄了 P4/P7 primitive 方案，設計文件有更新，但 `architecture.md` 的 `Directory Structure` 段只更新了部分（primitives/ 目錄說明），未同步回退「diary/ 刪除 MilestoneSection.tsx / DiaryEntry.tsx」的描述。Architect 在 K-017 Pass 3 結束時的 doc sync 只做了 Summary 段的文字修正，未對 Directory Structure 做 `ls` 驗證。

**下次改善：** Edit architecture.md `Directory Structure` 記錄「組件刪除」時，必須在同一個 Edit 操作前先 `ls` 或 `Glob` 確認磁碟狀態，不得以「下一步 Engineer 會刪」為由先標記刪除；若刪除尚未完成，改用「待刪除（K-XXX 步驟 N）」標記而非直接移除條目。此規則補充進 `senior-architect.md` Architecture Doc 同步規則段。

## 2026-04-20 — K-021 W-R3-01 architecture.md Shared Components 表跨表 drift（Round 3 第二層反省）

**沒做好：**
1. **具體事件：** Round 2 已把 `### Footer 放置策略` 表（L463-469）從 `/diary = HomeFooterBar`、`/app = 無 footer` 修成正確的 `/diary = 無 footer`、`/app = HomeFooterBar`，但同檔下方 `### Shared Components 邊界` 表（L476）獨立記錄了同一組件的「用於」欄位，當時寫成 `/` `/diary` `/business-logic`（同一個錯誤的三路由組合），**Round 2 修 Footer 放置表時完全沒掃過這一列**。Reviewer Round 3 重審才抓到此跨表不一致，開 W-R3-01 blocker。源頭錯誤與 Round 2 撞同一根因（AppPage footer 放置短期記憶覆蓋 source of truth），但此票的教訓在於「修復的範圍」。
2. **防呆為何失效：** Round 2 反省加的 Self-Diff Verification hard step 明定 Edit 後逐格比對 source of truth，**但只覆蓋「我這次 Edit 的段落」**。同一組件在同一檔案被多表記錄時，Self-Diff 只看當次異動 diff，讀不到其他表是否一致，規則無法跨表傳遞。本質上 Self-Diff 是縱向驗證（Edit 前 vs Edit 後），缺少橫向驗證（同檔其他段落是否一致）。
3. **結構性根因：** architecture.md 採「多面向表格表達同一組件」結構（Footer 放置策略表 + Shared Components 邊界表 + directory structure tree，三處各自列 HomeFooterBar），任一表更新必須掃另外兩表。persona 硬步驟缺「Same-File Cross-Table Consistency Sweep」——Edit 涉及某組件/某路由/某 endpoint 時，grep 全檔該識別符，凡出現之處逐一驗證一致。

**下次改善：**
1. **persona 補第三道硬步驟 `Same-File Cross-Table Consistency Sweep`**（已於 W-R3-01 任務內容裡模擬執行一次，需把步驟正式寫進 `~/.claude/agents/senior-architect.md`）：凡 Edit architecture.md（或任何 source-of-truth 文件）涉及具名識別符（組件名 / route path / endpoint / field），Edit 完必須 grep 全檔該識別符，列出所有出現位置，逐一對照實際實作與其他 source of truth，全綠才算收工。本次已示範輸出 ✓ block 格式。
2. **結構層面：** 後續新寫 architecture.md 段落時，避免同一組件在多表重複記錄。若無法避免（資訊維度不同，如放置策略 vs 共用邊界），必須在文件頂部或該段落 header 明示「此組件亦記錄於 L476」，降低跨表 drift 發生率。此為 TD，登 PM dashboard 由 PM 裁決。
3. **規則傳遞方向：** Self-Diff（縱向）+ Cross-Table Sweep（橫向）= 二維覆蓋。只有縱向時，跨表 drift 的唯一防線是 Reviewer——不可接受，Architect 必須自閉環。

---

## 2026-04-20 — K-021 W-5 architecture.md Footer 表 drift

**沒做好：**
1. **具體事件：** K-021 設計任務結束前 Edit `agent-context/architecture.md` 新增 `## Design System (K-021)` 段時，`### Footer 放置策略` 表格的 `/diary` 與 `/app` 兩列值整組顛倒（寫成 `/diary = HomeFooterBar`、`/app = 無 footer`），且段落 rationale 句寫「per-page 才能保留 AppPage 無 footer 的工作區 UX」沿用錯誤假設。實際 source of truth：design doc §7.5 裁決表與 ticket AC-021-FOOTER 明寫 `/app = <HomeFooterBar />` + `/diary` 由 K-024 決定；我手上 Edit 時**沒有逐格對照**設計文件 §7.5，而是憑短期記憶（紅隊自檢討論過 AppPage footer 放置複雜度）直接下筆，把「AppPage 特殊處理」誤寫成「AppPage 無 footer」。
2. **防呆為何失效：** persona 已有 `## Architecture Doc 同步規則` 硬步驟要求「結構/API/跨層決策/新增 shared components 必 Edit architecture.md + Changelog + updated」，memory `feedback_architect_must_update_arch_doc.md` 也強化此規則。**但該規則只規範「要不要 Edit」，不規範「Edit 完要自我 diff」。** 我的 Edit 執行本身符合規則（有改、有 Changelog、有 updated），卻沒一個步驟強制我把新寫的表格對照 source of truth 逐格檢查。規則覆蓋「寫」未覆蓋「寫對」。
3. **結構性根因：** persona 落地缺 post-Edit cross-check 節拍——Edit architecture.md 表格 / 清單 / endpoint schema 等「結構化內容」時，只要 source of truth（design doc / ticket AC / codebase grep）存在，Edit 後必須逐行比對，任一格不一致回頭改，無差異才算完成。此前三張票（K-017 Pass 3 step 清單殘留、K-018 BuiltByAIBanner 不存在、K-009/K-011 drift）都與「寫 / 寫對」同一類缺口，反省也都被記錄，但沒轉成硬步驟。

**下次改善：**
1. **新增 persona 硬步驟（`~/.claude/agents/senior-architect.md` `## Architecture Doc 同步規則` 段末追加）：** Edit architecture.md 任一「結構化內容」（表格、清單、endpoint schema、組件 props 表）後，必須讀對應 source of truth（design doc 裁決段 / ticket AC / `ls` 或 `grep` codebase），**逐行/逐格 diff**，記錄「X 列 vs Y 列 — 逐格匹配 ✓」於任務交付 log；任一格不一致，回頭改，無差異才算完成任務。未完成此 diff 不得宣告任務結束。
2. 新 memory 檔 `feedback_architect_arch_doc_self_diff.md` 紀錄此規則與觸發事件，Ingest 下次 session 能自動提醒。

---

## 2026-04-20 — K-021 全站設計系統基建

**做得好：** 字型載入方式採 5-dim Pre-Verdict matrix + red-team 3 輪後選 Option A（Google Fonts CDN），把既有 index.html 已載入 fonts 的事實納入 decision 避免 over-engineering；Footer 放置以 Option A vs B score 9.33 vs 5.33 拉開落差裁決，AppPage `h-screen overflow-hidden` 與 Layout slot 衝突 red-team 有抓到；FooterCtaSection 的 dark-theme 殘留（text-white / border-white/10）被識別為 TD-K021-05 blocker，避免 Engineer 視覺驗收失敗。
**沒做好：**
1. Scope 發現 `/login` 在 codebase + .pen 均不存在，卻仍在設計文件 §0 Q1 下「假設 A 繼續」而非暫停回報 PM，違反 persona「不做需求決策」；實質上是 borderline 裁定 AC 範圍。
2. Body CSS 入口 Option A (index.css @layer) 7.5 vs Option C (per-page) 8.0，score 較低卻以「token 精神」tiebreaker 後選 A，tiebreaker 維度未事先列入 scoring matrix，屬於事後補維度自圓其說。
3. Ticket AC 寫 `text-brick` (#B43A2C) 但實作 + K-017 visual-report 驗證用的是 #9C4A3B (brick-dark)，Q2 本應在 PM 未裁決前不做推薦，仍寫「推薦 B 保留實作」，同屬 borderline 代 PM 裁決。
**下次改善：**
1. **Scope Question Pause Rule**（加入 persona 硬步驟）：Architect 發現 ticket AC vs codebase/設計稿有不一致時，必須立即停止設計、在 Q&A 段列出矛盾、回報 PM，不得以「假設 X 繼續」自走；PM 未覆前設計文件不得宣告完成。
2. **Pre-Verdict Tiebreaker Pre-listing Rule**（加入 persona 硬步驟）：Pre-Verdict scoring matrix 必須在**列出選項同步列出所有評分維度**（含 tiebreaker），選項分出後不得新增維度；分差 < 1 時 tiebreaker 只能用既有維度加權，否則視為「未決」回報 PM。
3. Ticket vs 實作色票落差須在設計文件 §0 以「PM 待裁決」標記列示，不附推薦意見，避免 Architect 代 PM 定色。

**沒做好：** Q8 回覆「HomePage 全站加 FooterCtaSection」時未核對 Pencil 設計稿，設計稿實際上是純文字 hpFooterBar（一個 text node，文案 `"yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"`，Geist Mono 11px #6B5F4E，無獨立連結），與 FooterCtaSection（三個獨立外連：email/GitHub/LinkedIn + ExternalLink + P3 primitive）完全不同設計理念。錯誤裁決會讓 Engineer 在 HomePage 底部實作錯誤組件。
**下次改善：** Q&A 回覆涉及「新增組件到哪些頁面」時，必須先 batch_get 對應 Pencil frame 確認實際設計規格，不憑 AC 文字推論；特別是「全站共用」決策需要確認設計稿中每個頁面的底部是否都是同一個組件設計，而非只看 AC 描述文字

## 2026-04-19 — K-017 Homepage v2 漏項

**沒做好：** Pass 3 Pencil 核對時只關注 /about 依賴項，未告警 Homepage v2 Dossier（frame `4CsvQ`）包含完整新版面（hpHero、hpLogic 均有全新文案與視覺結構），未納入 K-017 設計範圍。導致 §2.3 只寫「HeroSection 既有，不動 / ProjectLogicSection 既有，不動」，Engineer 若照舊文件實作會遺漏 v2 設計更新。

**下次改善：** Pencil 核對時對每個 frame 逐一聲明「此 frame 的所有改動是否都在當前 ticket scope 內」，有不在 scope 的改動立即告警 PM；特別是 `v2 Dossier` 命名的 frame 必須視為「有新設計規格」而非「參考用」，逐子節點確認是否有對應的實作規格。

## 2026-04-19 — K-018 GA4 Tracking 設計

**做得好：** 設計開始前同時驗證了 `BuiltByAIBanner.tsx` 的實際存在性（`ls` 確認），發現 architecture.md 記載與磁碟現況不符，在設計文件中明確標注「Engineer 需新建此組件」，避免 Engineer 按舊文件假設檔案已存在而跳過建立步驟。`ExternalLink` primitive 的修改決策（Option A vs B）也做了明確取捨論述，不讓 Engineer 自行猜測。

**沒做好：** `BuiltByAIBanner.tsx` 不存在這件事，如果更早（設計伊始）就 `ls` 驗證，就不需要中途回頭確認；目前仍是「讀 architecture.md → 覺得怪 → 才去 ls」的被動流程，等同 K-017 反省的「real-path walkthrough 做太晚」同類問題在 K-018 再現。

**下次改善：** 每次設計開始，§5「檔案異動清單」的「新建」項目若在 architecture.md 已有記載，必須先 `ls` 或 `Glob` 驗證該檔案是否真的存在，不等「覺得哪裡怪」才查。把這條加入 senior-architect 的前置 checklist。

## 2026-04-19 — K-017 Pass 3 Engineer Q&A

**沒做好：** Phase C4 文字殘留 Pass 2 舊版本（「刪除 MilestoneSection.tsx / DiaryEntry.tsx，被 P4/P7 取代」），而 Pass 3 已廢棄 P4/P7 並明確保留這兩個組件；Engineer 若照 C4 執行會誤刪。根因：每次 Pass 更新後未系統性掃描「Phase 步驟說明」段落，確認步驟不再引用已刪除的組件。

**下次改善：** 每次 Pass 更新（刪除 primitive、廢棄組件、改架構決策）後，強制掃描 `## 6. 實作順序` 全段，把所有 Phase A–E 的步驟說明與當前 §2.0、§5 清單交叉比對——任何 Phase 步驟引用的組件名若已在清單標 DELETED/保留，必須同步修正步驟說明。此掃描寫入本 retrospective log 作為下次可直接執行的 checklist。

## 2026-04-19 — K-017 Pass 3

**做得好：**（無——Pass 3 是修正 Pass 2 盲抽錯誤，無主動設計亮點可聲稱）

**沒做好：** P5/P6 盲抽決策在 Pencil 核對前無法確認是否共用，導致 Pass 2 產出需要 Pass 3 修正；根本原因是「commit message 暗示共用」被當作抽 primitive 的充分條件，但實際兩頁的 timeline 連設計思路都不同（Homepage 用 absolute rectangle rail + absolute marker；Diary 用 flexbox left-border stroke，無獨立 rail 也無 marker），commit message 相似不等於 DOM pattern 相似

**下次改善：** 有條件性 primitive 時，直接問 Designer「所有使用這個 pattern 的頁面的 DOM sketch」，不靠 commit message 推論；structural similarity 才是抽 primitive 的必要條件，語義/視覺相似不夠

## 2026-04-19 — K-017 /about portfolio enhancement 設計（Pass 2 — cross-page component audit）

**做得好：**
- Primitive 範圍有紀律：Q3/Q4 使用者選 A（抽 primitive）時同時下硬 scope（「只給 K-017 新組件用」），本輪完整執行，§2.0 + §2.0.3 明寫「HomePage 既有 section 不 migrate」「既有 common/ 不搬」，避免 scope 蔓延
- Q8 條件性 primitive 標註到位：Pencil MCP 連線失敗時沒硬猜也沒放棄，明確標 P5/P6 為「條件性 primitive」，把決策推遲到 Engineer A0.1 並硬性要求「核對後同步更新本文件 §2.0.1」，不留空心規劃

**沒做好：**
- Pass 1 沒做 cross-page duplicate audit，Pass 2 才盤點出 10 個 D1–D10 pattern。根因：Pass 1 設計時只對 PRD 指定的 `/about` 重寫做組件拆分，未主動問「這些新 section / card 有沒有跟其他頁重複的 pattern」。duplicate audit 本該是 Architect 決定「抽 primitive」前的標配步驟，但個人 workflow 一直默認「該 ticket scope 內的組件才是設計對象」。此省略直接造成使用者要求 Pass 2 重審
- §5 檔案異動清單 Pass 1 漏抽 primitive 相關新增/刪除（P1–P7、useDiary、MilestoneAccordion 取代 MilestoneSection/DiaryPreviewEntry 等），Engineer 若只照 Pass 1 清單實作會寫出 duplicate code，需 Pass 2 整段重寫
- Pass 2 Edit §2.1 AboutPage 組件樹時一次 Edit 把 `## 2. 組件樹拆分` 大標題連同 `### 2.1` 一起誤刪，後補回；根因：未完整驗證 `old_string` 包含全部預期保留內容，就直接替換

**下次改善：**
- **新 persona 硬步驟（codify 進 `~/.claude/agents/senior-architect.md`）：** Architect 每次交付設計文件前必做 cross-page duplicate audit — 對本票 scope 內每個新建組件 / 新加 section，grep 既有 `frontend/src/components/**` + `frontend/src/pages/**` 尋找語意 / 結構類似檔，條列 duplicate / near-duplicate 並決策「抽 primitive」「保持各自 inline」「合併既有為單一 component」。此 audit 輸出必併入設計文件 `## X 共用 Primitive & Reuse 規劃` 段，不得省略
- Edit 大型設計文件時，對「替換含標題行」的 old_string 必完整驗證保留範圍；替換前先 Grep 目標 section 邊界，確認 old_string 不吞到下個 section 標題

**Persona codify 狀態：**（強制條款 — 若改善屬行為規則必同步 Edit persona）
- 上條「cross-page duplicate audit」屬 Architect 行為規則，需同步 Edit `~/.claude/agents/senior-architect.md`。本次反省寫完後執行 Edit；若無法 Edit persona 則此反省無效（依 persona `feedback_retrospective_codify_behavior`）

---

## 2026-04-19 — K-017 /about portfolio enhancement 設計

**做得好：**
- Drift 檢查真做到：讀 `AboutPage.tsx` / `HomePage.tsx` / `about/*` 全部 14 個組件檔 + `architecture.md` Directory Structure 子樹 + `main.tsx` 路由，再開始寫設計；因此 §5 檔案異動清單直接標出「舊 12 組件刪、RoleCard interface 需改、新增 11 組件」，Engineer 實作時不用再逆向推
- 明確 defer 決策：§4.4 curated retrospective「挑哪 2–3 條」不替 PM 決定，只給挑選原則 + 引用格式，符合 senior-architect.md「不做需求決策」
- 主動補陷阱：§7.8 Firebase SPA fallback 會吞 `.md`，設計時發現後在 §4.3 + §5 + §7 三處同步標註 + 建議 `frontend/public/docs/` copy 方案

**沒做好：**
- Firebase `.md` SPA fallback 的陷阱是寫到 §4.3 才回想起的，不是設計伊始就 mapping。根因：AC-017-PROTOCOLS 只要求「文件存在 + inline link 導向該檔」，AC 未強制「recruiter 點 link 實際能打開」，我對 recruiter 端到端使用路徑的 mental walkthrough 做得太晚；**senior-architect 職責應在「AC 覆蓋完畢」之後多一步「real-world path walkthrough」**，否則 Engineer 實作到 deploy 階段才撞牆
- 未先 grep `frontend/e2e/pages.spec.ts` 對舊 AboutPage 文字（"What Is This Project?" / "AI COLLABORATION" / "HUMAN-AI"）的斷言依賴。§5 只寫「Engineer 需 grep 掃一次」，而不是自己先掃給清單——等於把該由設計階段攔截的脆弱點推給 Engineer，違反「設計要具體到工程師可直接照著做」

**下次改善：**
1. 設計文件送出前必做「end-to-end real-path walkthrough」：對每條 `/about` 上的 link（內部 SPA link / 內部 `.md` link / external GitHub / external LinkedIn / `mailto:`）逐一問「production deploy 後 click 能到對的地方嗎」。此 walkthrough 輸出列進本 retrospective log 下次可直接抄 checklist
2. 大幅重組既有頁面的 ticket（刪 12 / 改 4 / 新增 19 規模）在 §5 檔案異動清單之前，Architect 自己先 grep 一次既有 E2E spec / Vitest 對舊文字 / 舊組件名的依賴，把結果寫進清單作為 Engineer 必要前置動作。不能只列「Engineer 須 grep」就放掉
3. Firebase Hosting 特性（SPA fallback / rewrite / public dir 位置）列入本專案 Architect 必讀 reference 清單。下次涉及新增公開可訪問非 HTML 資源時（`.md` / `.txt` / `.json`）第一步先 check Hosting 行為

---

## 2026-04-18 — K-008 W2/S3 修復後反省

**做得好：**
- 修 W2 時先讀 `playwright.config.ts` 最終實作再動 architecture.md，確保文字對應的是 final state（2 project 拆分）而非 Bug Found Protocol 反省當下的預想，避免再次留下 stale
- 修 S3 時交叉對照 `visual-report.ts::renderHtml` 中 `successes` / `failures` / `authRequired` 三變數的實際字串模板，不自編格式

**沒做好：**（無 surprise — drift 已同步實作；本次修復屬於反省後的機械式回寫，沒有新判斷事件值得記）

**下次改善：**
- Architect doc 同步規則的「Engineer 完工後自動 ping Architect 回寫」 hook 仍待落地（本次依賴 Reviewer 標 W2 才被動 re-engage）。下張票若再出現 Engineer 偏離原設計的情況，我會在 ticket §Architecture 末尾加一個「Post-impl sync checklist」讓 Engineer / PM 有明確 trigger 把我叫回

---

## 2026-04-18 — K-008 W2/S3 Bug Found Protocol 反省

**沒做好：**

- **W2 根因（設計覆蓋面 + 事後同步雙重缺口）：**
  - 設計階段只列出「default glob 吃 → 加 `testIgnore`」「default glob 不吃 → 沿用」兩種分支（ticket §6.2），**漏掉第三分支「default 不吃但 CLI 指檔也被擋」**。根因：我把 Playwright `testMatch` 當成「只影響 default discover」的過濾器，沒去查 CLI file argument 是否也會套同一 glob；這屬於 Architect 沒把「配置行為邊界」查完整就假設分支窮舉，本質上是「沒實測就下窮舉結論」的錯誤（跟上一則 retrospective「把 testMatch 實測轉嫁給 Engineer」是**同一個壞習慣的延續**——上次只是沒驗，這次是沒驗又「憑模型想像」把分支列滿）。
  - Engineer 實作時決策 `per-project testMatch`（正確偏離原設計）後，**Architect 沒被召喚回來把 architecture.md §QA Artifacts line 425 的 stale 敘述改掉**。根因：Architect doc 同步規則（senior-architect.md §Architecture Doc 同步規則）規定「每張 ticket 結束前同步」，但 K-008 的 ticket 流程是「Architect 設計 → Engineer 實作 → Reviewer 發現 drift → PM 裁決才修」，Architect 在設計階段交付後等於「退場」，沒有任何 hook 把我 re-engage 回 doc sync；直到 Reviewer W2 標出來才被動回場。這是**流程缺「Engineer 完工後自動 ping Architect 回寫」的 sync 機制**，不是單純「忘記更新」。

- **S3 根因（與 W2 同根的 minor sibling）：**
  - §3 HTML 設計 `Pages: 4 captured, {failures} failed` 被 Engineer 擴充為 `Pages: {successes} captured, {failures} failed, {authRequired} auth-required (not captured)`。Engineer 的擴充是正解（把 auth-required 計入單獨類別、硬編 `4` 改成 `{successes}` 避免未來新增頁面要手改），但 Architect 設計時**沒把「auth-required 不算 captured」這件事反映進狀態計數模型**——§3 固定寫 `4 captured`，意味著設計時把 `/business-logic` placeholder 也當成 captured，但 placeholder 根本沒截圖，語意矛盾。
  - 這跟 W2 是**同一類缺陷**：Architect 輸出 spec 時沒把「狀態 × 計數」的邊界列全（W2 是 testMatch × CLI 的邊界，S3 是 success/failure/auth-required × captured 的邊界），用「大致正確」的摘要通過設計 review，等 Engineer 實作時邊界暴露才被修掉。同樣也缺 sync 機制把修正回寫 architecture.md §3。

**下次改善：**

1. **設計階段「配置/狀態邊界」必須列完整 truth table，不靠窮舉想像。** Architect 輸出任何「X 情況 → Y 行為」分支時，用 table 形式寫出所有 X 組合（例：`testMatch × run mode {default, --list, file-arg, --project}` = 4 × 4 = 16 格），至少跑一次 dry-run 確認每格；不是「我想到的兩種分支」。狀態計數同理（success/failure/auth-required × captured/not-captured 要畫矩陣，不用一句 `4 captured` 帶過）。
2. **Ticket 流程加「Engineer 完工 → Architect doc sync ping」hook。** 在 K-Line CLAUDE.md 的 ticket close checklist 加一項：「Engineer 標記實作完成時，若實作決策偏離 Architect §N 原設計（per-project testMatch、HTML counter 擴充等），PM 必須 re-summon Architect 做 doc sync，不等 Reviewer 發現 drift」。把 W2/S3 這類「被動等 Reviewer 發現」的 drift 前移到 Engineer 交付時就處理。
3. **Bug Found Protocol 觸發時，Architect 反省**必須**對上 retrospective 的前一則做自我檢查。** 本次 W2 根因「沒實測就下結論」跟 2026-04-18 K-008 設計那則的「把 testMatch 實測轉嫁 Engineer」是同一個壞習慣的復發——上次標了「下次實測」卻沒落實就進 K-008 設計。新規：每次 append 新 retrospective 前先讀上一則的「下次改善」，明確標註本次是否有重複違反（重複違反要升級行動，例如加 git pre-commit hook 或 PM 審核項）。

## 2026-04-18 — K-008（Visual Report Script 設計）

**做得好：** Triage Drift Check 先跑過再做決策 — grep 到 `docs/reports/` 已在 architecture.md line 50「預留但未落地」，於是把本次設計明確升格為「新增 QA Artifacts 段 + Directory Structure 補 visual-report.ts」而非靜默補檔；也順手把 `ma99-chart.spec.ts` / `navbar.spec.ts` 原本漏列進 Directory Structure 的問題一併修掉。

**沒做好：** Playwright `testMatch` default glob 是否會誤吃 `visual-report.ts`（非 `.spec.ts` 命名）— 我沒當場執行 `npx playwright test --list` 驗證，而是把它丟給 Engineer 實作時驗證。根因：Architect 本次沒安裝 frontend deps 的 shell，實測成本高於「讓 Engineer 實測一次並寫進 Retrospective」；但這實質上把設計決策外包給實作階段，不夠「把事情想清楚」。

**下次改善：**
1. 涉及 test runner glob / config 行為的設計決策，Architect 應該在本地跑一次 `npx playwright test --list` 或等效的 dry-run 指令確認，不轉嫁給 Engineer。
2. 若確實無法實測（缺 deps / 缺環境），在 ticket Architecture section 明確標出「此項為 Engineer 實測決策點」並列出判斷條件與對應 action（本次 §6.2 已這樣做），不留模糊。
3. 新增 `docs/reports/` 這類「文件先預留、實作後才落地」的目錄，預留時就該在 architecture.md Changelog 記「預留待 K-XXX 落地」，避免日後 drift 檢查時要逆向判斷「這是預留還是遺漏」。

