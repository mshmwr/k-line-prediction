# K-002 UI 優化設計規格

**Date:** 2026-04-17
**Author:** Designer Agent
**Scope:** Icon library、Loading 動畫、排版間距優化

---

## Icon Library

### 選型決策：Lucide React `lucide-react@^0.469`

**選 Lucide React，不選 Heroicons 的理由：**

1. **Bundle size** — Lucide 每個 icon 獨立 named export，tree-shaking 只帶入用到的 icon；Heroicons `@heroicons/react` v2 雖然也支援 named import，但整體套件體積較大
2. **Finance/Chart icon 豐富度** — Lucide 提供 `TrendingUp`、`TrendingDown`、`BarChart2`、`LineChart`、`Activity`、`CandlestickChart` 等 finance 相關 icon；Heroicons 幾乎無對應選項
3. **Dark theme 視覺風格** — Lucide 採用 1.5px 細線條設計，與現有 `font-mono tracking-widest` 的高科技感一致；Heroicons 線條較粗，風格偏向一般 SaaS，與 K-Line 暗色金融主題不搭
4. **Tailwind 整合** — 兩者都能直接套 Tailwind class，無差異

**安裝指令（Engineer 參考）：**
```
npm install lucide-react
```

---

## Icon 對應表

### UnifiedNavBar

| 位置 | 目前實作 | 替換 icon | Lucide export name | 尺寸建議 |
|------|----------|-----------|-------------------|---------|
| Home link（desktop + mobile） | `⌂`（Unicode） | House icon | `Home` | `w-4 h-4`（desktop）、`w-5 h-5`（mobile） |
| App link | 純文字 `App` | 無需 icon，維持文字 | — | — |
| About link | 純文字 `About` | 無需 icon，維持文字 | — | — |
| Diary link | 純文字 `Diary` | 無需 icon，維持文字 | — | — |
| Logic link（常態，含登入後） | `Logic 🔒`（emoji）→ `"Logic" + Lock icon` | Lock icon **固定顯示**（不因登入狀態消失）；**文字在左，icon 在右** | `Lock` | `w-3 h-3 inline ml-1` |

> **設計約束（使用者需求，2026-04-18）：** Logic 連結的 Lock icon 是既有設計元素，必須恆常顯示，不隨 auth 狀態切換。設計師不得將其改為「僅未登入時顯示」。

**設計說明：**
- NavBar 文字連結刻意簡潔，不需每個連結都加 icon
- 只有 home（語意明確的圖示概念）和 lock（功能狀態指示）替換，其餘維持文字
- Home icon 的 active state 沿用現有 `text-white`，inactive 沿用 `text-gray-400`
- Lock icon 位於 "Logic" 文字**右側**（text → icon 順序）

**Desktop Home link 實作參考（Tailwind class only，不寫 React）：**
```
<Home className="w-4 h-4" />
```
替換現有 `⌂` 文字節點。aria-label 從 `"⌂"` 改為 `"Home"`。

**Mobile Home link：**
```
<Home className="w-5 h-5" />
```
移除現有 `text-[18px]` size class，改由 icon 自帶尺寸控制。

**Logic link（固定樣式，不分登入狀態）：**
```
Logic <Lock className="w-3 h-3 inline ml-1 align-middle" />
```
文字在左，icon 在右；`ml-1` 作為文字與 icon 間距。

### PredictButton

| 狀態 | 目前實作 | 替換方案 |
|------|----------|---------|
| Active（可點擊） | `▶ Start Prediction`（Unicode） | `<Play className="w-4 h-4 inline mr-1.5" /> Start Prediction` |
| Loading | `Predicting...`（純文字） | 保持純文字，或加 `<Loader2 className="w-4 h-4 inline mr-1.5 animate-spin" />` |
| Disabled | 無 icon | 不需要 icon |

**設計說明：**
- `Play` icon（實心三角）比 Unicode `▶` 在高 DPI 螢幕上更清晰、對齊更好
- Loading state 可加 `Loader2`（迴轉圓弧）強化 feedback，但此為可選（Engineer 依 AC 決定）

### HomePage Section Headers

HomePage 共有三個 section，透過 `SectionHeader` 組件渲染。目前 `label` 是全大寫文字，不帶 icon。

**AC-002-ICON 要求「SectionHeader 各 section 使用語意相符 icon」。**

| Section | Label | 建議前置 icon | Lucide export |
|---------|-------|-------------|--------------|
| HeroSection | `K-LINE PATTERN MATCHING ENGINE` | HeroSection 用 inline SectionLabel，不過 SectionHeader 組件，此 label 本身視覺夠強，不加 icon | — |
| ProjectLogicSection | `HOW IT WORKS` | `Cpu` | `Cpu` |
| DevDiarySection | 推測為 `DEV DIARY` 或類似 | `BookOpen` | `BookOpen` |

**SectionHeader icon 加法（props 擴充建議）：**
Engineer 需在 `SectionHeader` 組件 props 新增可選 `icon?: React.ReactNode`，在 `SectionLabel` 左側渲染：
```
[icon] [LABEL TEXT]
```
icon 尺寸：`w-3.5 h-3.5 inline mr-1.5 align-middle`，顏色繼承 label 的 `text-{color}-400`。

**HeroSection inline label：**
HeroSection 第 6–8 行直接 inline 了 SectionLabel 樣式，未使用組件。此處可加 icon 或維持現狀（視 AC 嚴格程度而定，現有視覺效果尚可）。若加，使用 `<Activity className="w-3.5 h-3.5 inline mr-1.5" />`。

### AppPage Section Headers

AppPage 使用的是簡易 `h3 text-sm text-gray-400 uppercase tracking-wider` — 此為 app 功能區塊 header，不是 landing page section header，風格刻意更低調。

**不建議加 icon**：AppPage 是密集操作介面，加 icon 會增加視覺雜訊，且 AC-002-ICON 的 SectionHeader 要求針對 `SectionHeader` 組件，AppPage 的 h3 不在範圍內。

---

## Loading 動畫規格

### 選型決策：Orbital Dots（三個點繞圓心旋轉）

**選擇理由：**
- 現有 `border-spin`（單環旋轉）已佔用了「旋轉」這個視覺語義；替換而非疊加，需要明顯差異化
- Orbital dots 有「系統思考中、正在運算」的語意聯想，適合 Prediction 等待場景
- Pure CSS + Tailwind 可實現，不需要額外 JS animation library
- Dark theme 下，3 個小點在深色背景上清晰可見，比骨架屏（需要知道版面結構）更適合通用 loading

**Skeleton shimmer 不選的理由：** 需要事先知道內容版面結構，LoadingSpinner 是通用組件，不適合綁定特定版面。

**Wave bars 不選的理由：** 偏向 audio/media 語意，在金融圖表 app 語境下容易造成誤解。

**Pulse ring 不選的理由：** 視覺衝擊太強，適合 hero/CTA 而非 loading indicator。

### Orbital Dots 完整 Tailwind 實作方案

**動畫原理：** 三個點放在同一圓心，各自有 0 / 120deg / 240deg 的 animation-delay，用 `animate-bounce` 改為 custom keyframe 做垂直位移，並以 `rotate` + `translateX` 達到繞軌道效果。

**方案 A：CSS custom keyframe（推薦，視覺最佳）**

需在 `tailwind.config.js` 的 `extend.animation` + `extend.keyframes` 新增：

```js
// tailwind.config.js
extend: {
  animation: {
    'orbit': 'orbit 1.2s linear infinite',
  },
  keyframes: {
    orbit: {
      '0%':   { transform: 'rotate(0deg) translateX(10px) rotate(0deg)',   opacity: '1' },
      '50%':  { opacity: '0.4' },
      '100%': { transform: 'rotate(360deg) translateX(10px) rotate(-360deg)', opacity: '1' },
    },
  },
},
```

**LoadingSpinner 組件 Tailwind class 方案：**

容器：`relative w-8 h-8`（md size）、`w-5 h-5`（sm）、`w-12 h-12`（lg）

三個點各自：
```
absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-purple-500
-translate-x-1/2 -translate-y-1/2 animate-orbit
```

- 點 1（0deg delay）：`[animation-delay:0ms]`
- 點 2（120deg offset）：`[animation-delay:400ms]`
- 點 3（240deg offset）：`[animation-delay:800ms]`

三個點的初始 rotate offset 用 inline style 或 arbitrary value：
- 點 1：`[--orbit-start:0deg]`
- 點 2：`[--orbit-start:120deg]`
- 點 3：`[--orbit-start:240deg]`

若不想修改 tailwind.config，使用方案 B。

---

**方案 B：純 Tailwind animate-ping 簡化版（次選，實作最簡）**

用 `animate-ping` 三個同心圓脈衝，各自延遲：
```
容器：relative flex items-center justify-center w-8 h-8

點 1：absolute w-2 h-2 rounded-full bg-purple-500 animate-ping [animation-delay:0ms]
點 2：absolute w-2 h-2 rounded-full bg-purple-400 animate-ping [animation-delay:200ms] opacity-75
點 3：absolute w-2 h-2 rounded-full bg-purple-300 animate-ping [animation-delay:400ms] opacity-50
```

**缺點：** ping 是向外擴散，三點重疊在同中心，效果偏向 pulse ring，不是真正 orbital。視覺質感比方案 A 差，但實作零配置。

---

**Engineer 建議選方案 A**，因為方案 B 與 AC 所說的「更有質感」距離較遠。

### Loading 結束平滑過渡

現有 LoadingSpinner 直接 unmount（無淡出）。建議 wrapper 加：
```
transition-opacity duration-300 ease-out
```
由呼叫方控制 `opacity-0` → unmount，延遲 300ms。LoadingSpinner 本身不需改，由使用端處理。

---

## 排版規格

### 問題清單與修改建議

#### 1. Section 間距不一致

**現況：**
- `HeroSection`：`py-24`（96px 上下）
- `ProjectLogicSection`：`py-16`（64px 上下）
- `DevDiarySection`：需確認，但透過 SectionHeader `mb-10` 控制

**問題：** HeroSection 是 landing 主視覺，大間距合理；但 ProjectLogicSection 和 DevDiarySection 應統一。

**建議修改：**
```
ProjectLogicSection：py-16（保持）
DevDiarySection：py-16（統一）
```
HeroSection `py-24` 維持，作為視覺重心有意義的差異。

#### 2. HeroSection inline 複製了 SectionLabel 樣式

**現況（HeroSection.tsx line 6–8）：**
```
<span className="inline-block text-xs font-mono tracking-widest uppercase border border-purple-400 text-purple-400 px-2 py-0.5 mb-6">
  K-LINE PATTERN MATCHING ENGINE
</span>
```

這是 SectionLabel 的完整複製，加上額外的 `mb-6`。

**問題：** 與 SectionLabel 組件重複，未來維護點分散。

**建議：** 替換為 `<SectionLabel text="K-LINE PATTERN MATCHING ENGINE" color="purple" />` + 外層 `div className="mb-6"`。但此為 DRY 重構，非視覺問題，優先級低。

#### 3. Typography Scale

**現況：**
- `HeroSection` h1：`text-4xl md:text-5xl`（36px → 48px）
- `SectionHeader` h2：`text-3xl`（30px）
- AppPage h3：`text-sm`（14px）
- `SectionLabel`（p 等）：`text-xs`（12px）

**評估：** h1 → h2 差距（48 → 30px，18px 差）視覺區分充足。AppPage 的 h3 是 app 操作介面，刻意使用小字，不屬於同一 typography scale 問題。

**問題：** `SectionHeader` 的 `description` 是 `text-gray-400`（無設定 text-size，繼承 parent），但 `HeroSection` 的 description `<p>` 是 `text-sm`。

**建議修改（SectionHeader.tsx）：**
```
<p className="mt-3 text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
```
補上 `text-sm leading-relaxed`，確保 description 在所有使用點一致。

#### 4. 行動版安全邊距不一致

**現況：**
- NavBar mobile：`px-4`（16px）
- HeroSection：`px-6`（24px）
- ProjectLogicSection：`px-6`（24px）

**問題：** NavBar `px-4` 與 section `px-6` 不一致，造成視覺左邊界錯位。

**建議：** 兩者統一為 `px-4`（16px），mobile 16px 邊距對手機螢幕更安全：
- `HeroSection`：`px-4 md:px-6`
- `ProjectLogicSection`：`px-4 md:px-6`

#### 5. SectionHeader 缺少行動版 typography 調整

**現況：**
- `SectionHeader` h2：`text-3xl`（固定 30px，無 responsive）
- `HeroSection` h1 有 `md:text-5xl` responsive

**建議修改（SectionHeader.tsx）：**
```
<h2 className="mt-4 text-2xl md:text-3xl font-mono font-bold text-white">
```
手機版縮為 `text-2xl`（24px），避免 30px 在窄螢幕上過大或換行。

---

## 修改優先級總覽（供 Engineer 參考）

| 項目 | 優先級 | 說明 |
|------|--------|------|
| Icon library 安裝 + NavBar home/lock icon 替換 | P0 | AC-002-ICON 核心 |
| PredictButton Play icon 替換 | P0 | AC-002-ICON 核心 |
| LoadingSpinner orbital dots 替換（方案 A） | P0 | AC-002-LOADING 核心 |
| SectionHeader icon prop 新增 + HOW IT WORKS / DEV DIARY 加 icon | P1 | AC-002-ICON |
| 行動版 px 統一（section px-4） | P1 | AC-002-LAYOUT |
| SectionHeader description 補 text-sm leading-relaxed | P1 | AC-002-LAYOUT |
| SectionHeader h2 加 responsive（text-2xl md:text-3xl） | P1 | AC-002-LAYOUT |
| LoadingSpinner 結束 fade-out transition | P2 | AC-002-LOADING 加分項 |
| HeroSection inline label → SectionLabel 組件 | P3 | DRY，非視覺問題 |
