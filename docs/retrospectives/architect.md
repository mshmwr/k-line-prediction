# Architect Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 senior-architect agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Ticket ID 或 Phase 名稱>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（根因 + 為何設計/review 時沒抓到）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 與單票 `docs/tickets/K-XXX.md` 的 `## Retrospective` 段落 Architect 反省並存，不互相取代
- 啟用日：2026-04-18（K-008 起）

---

<!-- 新條目從此處往上 append -->

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

