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

