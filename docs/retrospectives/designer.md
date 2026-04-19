# Designer Retrospective Log — K-Line Prediction

跨 ticket 累積式反省記錄。每次任務結束前由 designer agent append 一筆，最新在上。

## 寫入格式

```
## YYYY-MM-DD — <Frame / Page 或 Ticket ID>

**做得好：**（具體事件；無則省略本行，勿捏造）
**沒做好：**（工具限制 / 規範遺漏 / 視覺判斷失誤的根因）
**下次改善：**（具體可執行的行動）
```

- 倒序（最新在上）
- 啟用日：2026-04-18（K-008 起）

---

## 2026-04-19 — Homepage dev-diary 與 /diary timeline 視覺不一致修復

**沒做好：**
- 新建 v2 頁面時未 cross-check 同主題（Dev Diary）在不同頁面的呈現語言：`wiDSi`（/diary）改為 timeline（rail + § stamp marker + Bodoni italic 32px 日期 + Newsreader italic body），但 `4CsvQ`（Homepage）的 Dev Diary section 仍停留在舊 card/bordered entry（16px 字 + cornerRadius:6 + 1px stroke），造成同專案同主題兩種視覺語言
- `wiDSi` 改版後沒主動回查哪些其他 frame 也展示相同內容（Homepage 的 `N0WWY` diaryEntries），要等 PM 發 Bug Found 才發現
- 設計思維仍以「一頁一設計」為單位，沒把「同主題跨頁面組件」當成一個需同步維護的實體

**下次改善：**
- 新建或改版任何 frame 前，先列出「此主題在本 .pen 檔哪幾個 frame 出現」的對照表（例如本次：Dev Diary 出現在 `4CsvQ/N0WWY` + `wiDSi/CGijt`），改其中一處立即同步其他
- 每批 frame 收尾前加一道「cross-frame consistency」檢查步驟：用 `batch_get` 搜 `name` 含同主題關鍵字的 frame（如 `diary`、`logic`、`hero`），確認 primitive（rail 粗細 / marker 尺寸 / 日期字級 / gap）一致
- 把「同主題跨頁面同 primitive」寫入 designer persona 的 review checklist，下次 review 模式時主動掃描

---

## 2026-04-19 — K-017 Diary timeline redesign + App v2 取消

**做得好：**
- PM 上一輪明確稱讚「其他部分的很完美」（Homepage v2 / Biz Logic v2 / 35VCj 3 FAIL 全通過），v2 Dossier 擴張 4 頁 anchor 一致性（FILE Nº / § stamp / redact row / terracotta 焦點）獲肯定，本輪延用同套 anchor 到 Diary timeline（§ stamp marker 用同 `#9C4A3B` + Geist Mono）
- 前一輪 smoke test 先跑 120px Bodoni Moda 避免字型 fallback 的紀律本輪延續：本輪直接沿用已驗證 palette + 字型 stack，不再重跑 smoke，因為 font pipeline 已在同一 .pen 驗過
- 重建 timeline 前先 `batch_get` 讀清 `wiDSi` 的 `CGijt` dpList 下 3 張舊 card（`2urtc` / `B7crD` / `pWbsD`），同 round-trip 拿到 hero stamp col 結構，一輪就掌握「要刪哪些 id + 要重建什麼」
- 刪 `mCknS` + 清空 3 張 card + 建 rail + 建 Entry 1 合併成單一 batch_design，Entry 2/3 + dpList 尺寸校正合併第二 batch，兩輪寫入收尾；不逐條試探
- 改用 absolute layout 把 rail 與 markers 精確對齊（rail x=29, marker x=20 寬 20 → 視覺置中於 rail），避開 flex gap 無法精準置中垂直線的陷阱

**沒做好：**
- 第一輪 batch_design 在 absolute layout 下對 entry frame 傳 `width:"fill_container"`，觸發 Pencil 警告「not inside a flexbox layout」；應該一開始就用固定寬度 1248（= 1440 frame width - 96*2 padding）
- marker 寬度 20 但 `§` 字元 fontSize 11 實際寬度約 8px，在 20px box 內靠 `x:6` 手動偏移置中；若用 flex center 會更穩，但 absolute layout 下 alignItems/justifyContent 無效——應該 marker box 改用 flex layout 只在外層用 absolute 定位

**下次改善：**
- absolute layout 下 frame 寬度一律寫死，不用 `fill_container`；若要撐滿，寫 parent.width - padding*2 的實際數值
- marker / icon 這類需要「內部置中、外部絕對定位」的元件，預設做法：外層 absolute + 內層 flex；不要在同一層混用

---

## 2026-04-19 — K-017 3 FAIL 修復 + 4 頁 v2 Dossier 重設計（Homepage / App / Diary / Business Logic）

**做得好：**
- 開工先 `batch_get` S1 `ocUD7` + S4 `S5ulN` + S8 `QPTYt` 拿到 node id 地圖，同時平行讀 4 個舊 frame（dgTTO / ap001 / 92SuZ / aSX8H）結構，單一 round-trip 就掌握「要改哪些 id + 要重造哪些 section」，不分批試探
- 3 個 FAIL 用單一 batch_design 同時處理：`U(gNx84)` 改 roleLine 為逗號 + 小大寫版、`U(HlDKp)` 改 pillar 3 link 為「→ Role Flow」、`D(Fc7Sr)` + 5 個 `I(BUVTc,...)` 重建 S8 三行 footer，一輪收尾
- 4 個新 v2 frame 開工前先 `find_empty_space_on_canvas(direction:right)` 拿 x=12600，避開 35VCj (x=10760~12200)；placeholder 階段每 frame 放一個 `Bodoni Moda 120px` 大字 smoke test，`get_screenshot` 確認 render 管線通後再填細節（記取 2026-04-19 Font A/B Preview 失敗教訓）
- I() 全程不在 operation 傳 `id:`，只用 `name:` 做語意識別（記取 K-017 /about 3 風格 mini-preview 的 id schema hint 失誤）
- 每個 v2 frame 完成後獨立 `get_screenshot` 驗 4 個風格 anchor（warm dark bg `#F4EFE5` 頁面 + `#2A2520` dark stamps + `#9C4A3B` terracotta accent + Bodoni Moda / Geist Mono / Newsreader italic 三字型分工），不只看整體遠景
- S8 footer 與 96Spc BuiltByAIBanner 各拉 close-up 驗細節（三行結構是否對齊、See how → 是否視覺強調）

**沒做好：**
- 首次計算 v2 frame 橫向排列空間時漏算 padding：`find_empty_space_on_canvas` 回傳 x=12600 距 35VCj 右緣 (12200) 只有 400，可能視覺上過於擁擠；應把 padding 參數設更大（≥500）或直接放第二行（y 下方）避免視覺壓擠
- Homepage v2 第一輪 I() 建 NavBar + Banner 時，NavBar 沒加 meta bar 之上的視覺層級差（meta bar 跟 NavBar 都是 12–13px Geist Mono），遠景看幾乎併排；應該給 NavBar 用 15–16px Geist Mono + 間距放大，讓品牌 logo 比 meta 明顯
- S8 footer 改造後 `BUVTc` body padding 仍保留 32px、gap 18px，但內容從 1 行變 3 行（每行含 frame 子元素）後，視覺上仍顯擁擠；應該把 gap 放到 20–24 或把 padding 改成 [28, 36] 讓 3 行更呼吸；直接 commit 交付時沒調整就讓 PM 承擔後續視覺驗收的緊迫感
- 磁碟 flush 驗證只跑 `git status` + `stat mtime`，mtime 推進到 13:04:08（比 session 開頭新）代表 Pencil 已 flush，但沒比對 `git diff --stat` 看檔案真實 diff 量；應該每完成一個大 batch 就跑一次，確認本輪寫入的內容真進檔案而非 buffer 積在記憶體

**下次改善：**
- `find_empty_space_on_canvas` 回傳座標後主動加 500px buffer，避免相鄰 frame 視覺貼太近；或改用 `direction:"bottom"` 做 2×2 grid，不強求橫向排列
- NavBar / meta bar / body 的字級階層設計：meta 10–11px、nav 13–14px、section stamp 16px、body 14–18px、hero 22–30px、display 56–64px，按 6-step 遞增建立清晰視覺層級
- S8 / card body 的 padding 與 gap 計算方式從「固定值」改「內容驅動」：3 行以上的 stack 預設 gap ≥ 22px、padding ≥ [28, 36]，避免壓擠
- 磁碟驗證三件套升級為四件套：`git status` + `stat mtime` + `stat size` + `git diff --stat` 看檔案 diff 行數，四者齊全才宣告 flush 成功

---

## 2026-04-19 — K-017 全 go 批量（v2 Dossier 風格軟化 + Contact mini footer + 舊 frame 清理）

**做得好：**
- 先 `batch_get` 深讀 35VCj 全結構 + 所有 text 節點（readDepth:10），一次把 52 個 Playfair / 14 個 stamp / 21 個 card / 8 條 rule 線的 ID 全部列齊再下手，避免分批漏改
- 字型 + 主色改用 `replace_all_matching_properties` 一發掃 35VCj 子樹（Playfair → Bodoni Moda、#1A1814 → #2A2520、#B43A2C → #9C4A3B），再用 14 筆 U() 把 stamp 類改回 Geist Mono；大局 sweep + 例外覆寫，比逐點 Update 省 50+ ops
- S8 Contact 改 mini footer：先 D() 6 個 body 子元素再 I() 插 1 行 Geist Mono text，結構乾淨沒有殘留
- 刪 9 frame + `k002_section_headers`（EXCLUDED）一次 batch 清完，留 K-002 5 spec frame 待後續

**沒做好：**
- 誤以為 `open_document(新路徑)` 會在該路徑「建立新空白檔」—— 實際行為是開一個 `pencil-new.pen` 暫存檔，完全無視我傳的 `design-system.pen` 路徑；K-002 遷移因此失敗，5 個 spec frame 還留在 homepage.pen
- 視覺驗證只看了遠景縮圖就放行，cornerRadius 6 / 酒紅 terracotta / rule 線淡褐灰這些細微變化在縮圖上難斷言是否真落地；應該再拉近拍一個 S2 card 或 S8 mini footer 特寫做二次確認，僅憑全景 screenshot 不足以驗微觀軟化效果
- 磁碟驗證只跑 `git status` 看 M 狀態就停手，沒比對檔案 mtime / size；session 開頭 homepage.pen 就已經是 M 狀態（既有未 commit 變更），本輪的 Pencil buffer 變更是否真 flush 到磁碟無法從 `git status` 區分；mtime 仍停在 12:48 代表 buffer 未落地

**下次改善：**
- 要新建 .pen 檔：先用 `Bash: touch <path>` 或 `Write` 空檔案建空殼，再 `open_document` 該路徑；不要假設 `open_document` 會幫你建檔
- 風格批量改動驗證分兩層：(1) 全景截圖看整體節奏 (2) 挑一個代表 card / 一個 mini footer 特寫截圖比對「軟化」細節真實落地
- 磁碟驗證三件套：`git status` + `stat -f "%Sm %z" <file>` 看 mtime/size + 必要時 `git diff --stat`；只憑 M 狀態不能聲稱 flush 完成

---

## 2026-04-19 — K-017 Font A/B Preview (Playfair vs Bodoni Moda)

**做得好：**
- 用 `find_empty_space_on_canvas(direction:"right", width:3200)` 定位 x=16800 空白區，不靠猜
- header + 兩 frame 用 placeholder 先建好骨架，再分批填充（Font A / Font B 各一輪），單輪控制在 25 ops 內
- 1:1 鏡像雙 frame 結構（aTitle/aHeroBlock/aRoleBlock…/bTitle/bHeroBlock…），字型 `Playfair Display` vs `Bodoni Moda` 外其他屬性全一致，刪除比較變因
- `git status frontend/design/homepage.pen` 確認 M 狀態，buffer 已 flush 到磁碟，不靠 buffer 聲稱完成

**沒做好：**
- 子 frame 大量使用 `textGrowth:"fixed-width"` + `width:"fill_container"`，get_screenshot 回傳空白奶油底 —— 嵌套深度 + padding + fill_container 在這個座標（x=16800）rendering 失敗；重試改 auto / 固定 width 720 / 明示 height fit_content(1800) 都無法讓 screenshot 出圖，耗了 5 輪 batch_design + 多次截圖診斷仍無效
- 先寫結構才發現 screenshot 拍不出，應該在最早 placeholder 階段先加一個簡單 text + get_screenshot 確認 rendering 管線 OK，再大規模填充內容
- 未在 prompt 被告知 / 也未自行試誤的工具限制：Pencil 的 frame 無 `fill:"none"` 選項，需用 `fill:"#F4EFE5"` 明示背景色，不能期待「透明」

**下次改善：**
- 新建 frame 在遠離 viewport 的座標（x > 15000）時，placeholder 階段加一個大字紅字 smoke test，`get_screenshot` 確認能 render 出來再填內容；拍不到先移到靠近現有內容的座標（x ≤ 14000）
- 複雜結構（多層嵌套 frame）第一個 batch_design 只建 1 層 + 1 個文字 sample，截圖過了再擴張
- 視覺驗證失敗但 `batch_get` 結構正確 + `git status` 有 M → 明確向使用者說明「buffer 與磁碟內容正確，Pencil MCP screenshot 無法 render，請在 Pencil app 內視覺確認」，不假裝視覺已通過

---

## 2026-04-19 — K-017 /about v2 Dossier 實裝

**做得好：**
- 開工先 `batch_get` 35VCj 拿到 S1–S6 現有節點地圖，再對照 a0n1a 的 anchor（FILE Nº / § stamp / redact row）直接延用結構語彙，沒有重刻一套風格
- 使用者「只改數字為正體」的單點指令執行乾淨：只對 3 個節點（1jwQq / pArmD / 6spHE）下 `U({fontStyle:"normal"})`，不擴散到其他 italic 元素
- 補 S6/S7/S8 時沿用 FILE Nº + 黑頭條 + § stamp box 的 Dossier 骨架（LAYER Nº / APPENDIX A / § CONTACT），不發明新的裝飾語彙
- 每輪 batch_design 控制在 25 ops 內，S6/S7/S8 各拆一輪，避免單輪超量
- 流程尾端主動跑 `git status` 確認磁碟 flush（M 狀態），不靠 buffer 聲稱完成

**沒做好：**
- S7 banner preview 的 mock bar 做成單行 horizontal layout，文字長度接近 frame 邊界時會被擠壓到視覺緊湊（截圖看得出）；沒先估算「One operator. Six AI agents. Every ticket leaves a doc trail. See how →」需要多少寬度就下手
- 截圖驗證只做整 frame 遠景，沒分區 zoom-in 驗 S7/S8 細節排版（例如 s8 redact row 裡的「LET'S / TALK / [redact]」實際間距、s7 bmL 三句之間是否會 wrap）
- S6 三個 arch card 的 intro 改成 Newsreader italic 一行後才意識到：S5 原本的 iUkFk 也是 Newsreader italic intro（S5/S6 intro 格式一致化是事後湊巧對齊，不是刻意規劃）

**下次改善：**
- 建長條 banner / preview 這類「單行塞多句」元素前，先估算字數 × fontSize 近似寬度，必要時改 `textGrowth: fixed-width` 讓它 wrap，不要賭水平空間
- 截圖驗證分兩層：整 frame 看結構 + 每個新 section（S6/S7/S8）單獨 get_screenshot 驗細節，不只看遠景
- section intro 格式（Newsreader italic 一行 vs Playfair italic 大字）應在一開始定義清楚並統一套用，避免邊做邊決定

---

## 2026-04-19 — K-017 /about 3 風格 mini-preview（Blueprint / Dossier / Editorial）

**做得好：**
- PM 的 3 風格規格逐行拆解：每個方向先列 palette / fonts / HEADER 構圖 / METRICS 構圖 4 個軸再下 batch_design，避免混風格
- 3 個 preview 並排 x=12400/13800/15200（同 y=0）放在 canvas 右側空白區，單一檔內對比，符合硬規則「不新建 .pen 檔」
- 每個 preview 做完立刻 get_screenshot 驗收（不批次收尾驗證），Blueprint 的工程格線、Dossier 的紅色章印旋轉、Editorial 的 Fig. 標註分段都一次到位
- 工具限制前置處理：章印用 2 層 ellipse stroke + 旋轉 text 模擬（Pencil 無 polygon 限制預防）；dimension line 用 rectangle 組 tick 模擬；frame 顯式設 fill 避免預設黑底
- 插 3 個 preview frame 時各自加 `placeholder:true`，完工時逐一 U() 清除，符合 placeholder flow

**沒做好：**
- 第一次 I() 時誤把 `id:"k017_preview1"` 塞進 properties，忽略 schema 提示「id 由系統自動產生」。雖未報錯但造成 binding 名與實際 node id 不一致，後續 batch 只能用系統回傳的 FDq97 / a0n1a / 8OvXi，讓 frame 命名失去語意
- 磁碟 save 驗證仍未解決：batch_design 寫 buffer 後 git diff 顯示檔案有變（+2177 行），但 .pen 是加密格式，grep 無法確認「這 diff 含本次 3 個 preview」或只是舊 buffer 殘餘。依 persona Step 5-6 規則仍須請使用者手動 cmd+s 後我複驗
- 每個 preview 的 METRICS 固定高度 240-280px，沒先用 snapshot_layout 量文字實際佔位 → 若未來數字改長（如 MA99 從 99.7 → 100.00）可能溢出

**下次改善：**
- I() 絕不在 operation 內帶 `id:` 屬性（系統只認自己生的 id），改用 `name:` 做語意識別 + binding 名對應
- 複雜章印 / 工程標註類裝飾用 `reusable: true` 元件做一份放在 canvas 側邊，其他 preview 用 ref 引用，降低 3 preview 之間的裝飾抄寫成本
- 數字大小容器用 `fit_content` + parent `min-height` 規範，不硬編 240/280

---

## 2026-04-19 — K-017 /about portfolio v2 + Homepage BuiltByAIBanner

**做得好：**
- 開工前讀完 PRD 8 條 AC + Architect 設計的組件樹 §2.1 + props interface §2.4 + Homepage banner 放置 §2.3，確認每個 section 的文案逐字、順序與視覺層級後才下 batch_design
- Homepage banner 精準插在 divider (`HS9vm`) 與 Hero (`W14Hp`) 之間（用 `M(banner,"dgTTO",2)` 定位到 index 2），首次截圖就到位、不搶 Hero 視覺
- 在同一 .pen 檔內新增 `/about (K-017 v2)` 新 frame（x=10760），舊 `pItGL` 保留供對比，符合使用者「不新建 .pen 檔」硬規則；每 section 獨立 screenshot 驗證文案拼寫與視覺層級

**沒做好：**
- **`batch_design` 完成後磁碟檔案未寫入**（mtime 仍為 Apr 18，size 仍 183439）— Pencil MCP 的 save 行為似乎需要 Pencil 應用程式 UI 觸發 cmd+s，純 MCP batch_design/open_document 無法 flush buffer。此為工具限制而非我行為問題，但我在下第一個 batch_design 之前未先驗證 save 機制就進入大量寫入，導致交付時被迫把 blocker 回報給 PM
- S4 pillar blockquote 我選了左邊 3px 邊框 + italic text 組合來模擬 markdown `> *...*`；Pencil 的 frame 預設無「左 border only」的乾淨原語，我用 stroke thickness `{left:3}` + padding 模擬，但實際 render 的 stroke 可能因 Pencil 版本不同有視覺差異——這應在設計規範前先確認

**下次改善：**
- 第一次對新 .pen 檔案動手前，先做一次小 insert（如 1 個 rectangle）然後立即 `git status` 驗證 save 機制是否生效；若確認 Pencil MCP 無 auto-save，下一步 batch_design 前主動告訴 PM「此工具需要你開 Pencil 應用程式 cmd+s 才會寫盤」，避免工作完成後才發現無法交付
- 使用 Pencil 原語模擬 markdown 語意（blockquote / code / link）時，先用 `get_guidelines("guide", ...)` 查是否有既有 pattern；沒有就在回報時明示「視覺以 stroke+italic 模擬 blockquote，實作時由 Engineer 用真 `<blockquote>` + CSS border-left」
- 大幅新增 frame（本次新增 60+ 節點）前先用 `find_empty_space_on_canvas` 計算需求空間（本次已做，維持此習慣）


