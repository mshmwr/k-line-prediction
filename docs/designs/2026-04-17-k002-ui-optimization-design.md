# K-002 UI Optimization Design Spec

**Date:** 2026-04-17
**Author:** Designer Agent
**Scope:** Icon library, loading animation, layout spacing optimization

---

## Icon Library

### Selection: Lucide React `lucide-react@^0.469`

**Why Lucide React over Heroicons:**

1. **Bundle size** — Lucide ships each icon as a standalone named export; tree-shaking pulls only used icons. Heroicons `@heroicons/react` v2 also supports named import but overall package size is larger.
2. **Finance/chart icon coverage** — Lucide provides finance-relevant icons like `TrendingUp`, `TrendingDown`, `BarChart2`, `LineChart`, `Activity`, `CandlestickChart`; Heroicons has almost no equivalents.
3. **Dark theme visual style** — Lucide uses 1.5px thin-line design, consistent with existing `font-mono tracking-widest` high-tech feel; Heroicons strokes are thicker, leaning generic SaaS, mismatched with K-Line dark finance theme.
4. **Tailwind integration** — both apply Tailwind classes directly; no difference.

**Install command (Engineer reference):**
```
npm install lucide-react
```

---

## Icon Mapping Table

### UnifiedNavBar

| Location | Current | Replacement icon | Lucide export name | Recommended size |
|------|----------|-----------|-------------------|---------|
| Home link (desktop + mobile) | `⌂` (Unicode) | House icon | `Home` | `w-4 h-4` (desktop), `w-5 h-5` (mobile) |
| App link | Plain text `App` | No icon needed; keep text | — | — |
| About link | Plain text `About` | No icon needed; keep text | — | — |
| Diary link | Plain text `Diary` | No icon needed; keep text | — | — |
| Logic link (always shown, including post-login) | `Logic 🔒` (emoji) → `"Logic" + Lock icon` | Lock icon **always shown** (does not toggle with auth state); **text on left, icon on right** | `Lock` | `w-3 h-3 inline ml-1` |

> **Design constraint (user requirement, 2026-04-18):** Logic link's Lock icon is an existing design element and must remain always shown, not toggle with auth state. Designer must not change to "show only when logged out".

**Design notes:**
- NavBar text links are intentionally minimal; not every link needs an icon
- Only home (clear iconographic concept) and lock (functional state indicator) get replaced; the rest stay text
- Home icon active state reuses existing `text-white`; inactive uses `text-gray-400`
- Lock icon sits on the **right** of "Logic" text (text → icon order)

**Desktop Home link reference (Tailwind class only, no React):**
```
<Home className="w-4 h-4" />
```
Replaces existing `⌂` text node. aria-label changes from `"⌂"` to `"Home"`.

**Mobile Home link:**
```
<Home className="w-5 h-5" />
```
Remove existing `text-[18px]` size class; size controlled by icon itself.

**Logic link (fixed style, regardless of auth state):**
```
Logic <Lock className="w-3 h-3 inline ml-1 align-middle" />
```
Text left, icon right; `ml-1` is text-icon gap.

### PredictButton

| State | Current | Replacement |
|------|----------|---------|
| Active (clickable) | `▶ Start Prediction` (Unicode) | `<Play className="w-4 h-4 inline mr-1.5" /> Start Prediction` |
| Loading | `Predicting...` (plain text) | Keep plain text, or add `<Loader2 className="w-4 h-4 inline mr-1.5 animate-spin" />` |
| Disabled | No icon | No icon needed |

**Design notes:**
- `Play` icon (solid triangle) is sharper and aligns better than Unicode `▶` on high-DPI screens
- Loading state may add `Loader2` (rotating arc) to reinforce feedback; optional (Engineer decides per AC)

### HomePage Section Headers

HomePage has three sections rendered via `SectionHeader` component. Currently `label` is all-caps text without icon.

**AC-002-ICON requires "SectionHeader uses semantically appropriate icon for each section".**

| Section | Label | Suggested leading icon | Lucide export |
|---------|-------|-------------|--------------|
| HeroSection | `K-LINE PATTERN MATCHING ENGINE` | HeroSection uses inline SectionLabel (not via SectionHeader); label is visually strong on its own; no icon | — |
| ProjectLogicSection | `HOW IT WORKS` | `Cpu` | `Cpu` |
| DevDiarySection | Likely `DEV DIARY` or similar | `BookOpen` | `BookOpen` |

**SectionHeader icon addition (props extension suggestion):**
Engineer adds optional `icon?: React.ReactNode` prop to `SectionHeader`, rendering left of `SectionLabel`:
```
[icon] [LABEL TEXT]
```
Icon size: `w-3.5 h-3.5 inline mr-1.5 align-middle`; color inherits label's `text-{color}-400`.

**HeroSection inline label:**
HeroSection lines 6–8 inline the SectionLabel style without using the component. May add icon here or keep as is (depends on AC strictness; current visual is acceptable). If added, use `<Activity className="w-3.5 h-3.5 inline mr-1.5" />`.

### AppPage Section Headers

AppPage uses simple `h3 text-sm text-gray-400 uppercase tracking-wider` — these are app function block headers, not landing page section headers; intentionally lower-key style.

**Do not add icons:** AppPage is a dense operation interface; icons would add visual noise, and AC-002-ICON's SectionHeader requirement targets the `SectionHeader` component; AppPage's h3 is out of scope.

---

## Loading Animation Spec

### Choice: Orbital Dots (three dots orbiting a center)

**Why:**
- Existing `border-spin` (single ring rotation) already occupies the "spin" visual semantic; replacement (not stack) needs clear differentiation
- Orbital dots semantically suggest "system thinking, computing", fit Prediction wait scenarios
- Pure CSS + Tailwind achievable; no extra JS animation library
- Under dark theme, 3 small dots remain visible against dark background; better suited as universal loading than skeleton (which requires knowing layout structure)

**Skeleton shimmer rejected:** requires knowing content layout; LoadingSpinner is generic, not tied to specific layouts.

**Wave bars rejected:** lean toward audio/media semantics; misleading in finance chart app context.

**Pulse ring rejected:** visual punch too strong; suits hero/CTA, not loading indicator.

### Orbital Dots Full Tailwind Implementation

**Animation principle:** three dots share a center; each has 0 / 120deg / 240deg `animation-delay`; use `animate-bounce` replaced with custom keyframe for vertical displacement, plus `rotate` + `translateX` for orbit effect.

**Option A: CSS custom keyframe (recommended; best visual)**

Add to `tailwind.config.js`'s `extend.animation` + `extend.keyframes`:

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

**LoadingSpinner Tailwind class scheme:**

Container: `relative w-8 h-8` (md size), `w-5 h-5` (sm), `w-12 h-12` (lg)

Each dot:
```
absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-purple-500
-translate-x-1/2 -translate-y-1/2 animate-orbit
```

- Dot 1 (0deg delay): `[animation-delay:0ms]`
- Dot 2 (120deg offset): `[animation-delay:400ms]`
- Dot 3 (240deg offset): `[animation-delay:800ms]`

The three dots' initial rotate offset uses inline style or arbitrary value:
- Dot 1: `[--orbit-start:0deg]`
- Dot 2: `[--orbit-start:120deg]`
- Dot 3: `[--orbit-start:240deg]`

If you don't want to modify tailwind.config, use Option B.

---

**Option B: Pure Tailwind animate-ping simplified version (fallback; simplest implementation)**

Use `animate-ping` for three concentric pulses with delays:
```
Container: relative flex items-center justify-center w-8 h-8

Dot 1: absolute w-2 h-2 rounded-full bg-purple-500 animate-ping [animation-delay:0ms]
Dot 2: absolute w-2 h-2 rounded-full bg-purple-400 animate-ping [animation-delay:200ms] opacity-75
Dot 3: absolute w-2 h-2 rounded-full bg-purple-300 animate-ping [animation-delay:400ms] opacity-50
```

**Drawback:** `ping` expands outward; three dots overlapping at the same center yield a pulse-ring effect, not true orbital. Visually less refined than Option A but zero config.

---

**Engineer should pick Option A**, because Option B is further from AC's "more refined" intent.

### Smooth Transition on Loading End

Current LoadingSpinner unmounts directly (no fade). Suggest wrapper add:
```
transition-opacity duration-300 ease-out
```
Caller controls `opacity-0` → unmount with 300ms delay. LoadingSpinner itself unchanged; caller handles.

---

## Layout Spec

### Issue List + Modification Suggestions

#### 1. Inconsistent Section Spacing

**Current:**
- `HeroSection`: `py-24` (96px top/bottom)
- `ProjectLogicSection`: `py-16` (64px top/bottom)
- `DevDiarySection`: needs verification; controlled via SectionHeader `mb-10`

**Issue:** HeroSection is landing key visual, large padding reasonable; but ProjectLogicSection and DevDiarySection should be unified.

**Recommendation:**
```
ProjectLogicSection: py-16 (keep)
DevDiarySection: py-16 (unify)
```
HeroSection `py-24` retained as meaningful visual emphasis.

#### 2. HeroSection Inlines SectionLabel Style

**Current (HeroSection.tsx line 6–8):**
```
<span className="inline-block text-xs font-mono tracking-widest uppercase border border-purple-400 text-purple-400 px-2 py-0.5 mb-6">
  K-LINE PATTERN MATCHING ENGINE
</span>
```

This is a full duplicate of SectionLabel plus extra `mb-6`.

**Issue:** Duplicates SectionLabel component; future maintenance scattered.

**Recommendation:** Replace with `<SectionLabel text="K-LINE PATTERN MATCHING ENGINE" color="purple" />` + outer `div className="mb-6"`. This is DRY refactor, not visual issue; low priority.

#### 3. Typography Scale

**Current:**
- `HeroSection` h1: `text-4xl md:text-5xl` (36px → 48px)
- `SectionHeader` h2: `text-3xl` (30px)
- AppPage h3: `text-sm` (14px)
- `SectionLabel` (p, etc.): `text-xs` (12px)

**Assessment:** h1 → h2 difference (48 → 30px, 18px gap) is sufficient visual distinction. AppPage h3 is app-operation UI, intentionally small; not in same typography scale problem.

**Issue:** `SectionHeader`'s `description` is `text-gray-400` (no text-size, inherits parent), but `HeroSection`'s description `<p>` is `text-sm`.

**Recommendation (SectionHeader.tsx):**
```
<p className="mt-3 text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
```
Add `text-sm leading-relaxed` to ensure description consistency across all usages.

#### 4. Inconsistent Mobile Safe Margins

**Current:**
- NavBar mobile: `px-4` (16px)
- HeroSection: `px-6` (24px)
- ProjectLogicSection: `px-6` (24px)

**Issue:** NavBar `px-4` vs section `px-6` causes visual left-edge misalignment.

**Recommendation:** Unify both to `px-4` (16px); 16px on mobile is safer for phone screens:
- `HeroSection`: `px-4 md:px-6`
- `ProjectLogicSection`: `px-4 md:px-6`

#### 5. SectionHeader Lacks Mobile Typography Adjustment

**Current:**
- `SectionHeader` h2: `text-3xl` (fixed 30px, no responsive)
- `HeroSection` h1 has `md:text-5xl` responsive

**Recommendation (SectionHeader.tsx):**
```
<h2 className="mt-4 text-2xl md:text-3xl font-mono font-bold text-white">
```
Mobile shrinks to `text-2xl` (24px) to avoid 30px feeling oversized or wrapping on narrow screens.

---

## Modification Priority Overview (Engineer reference)

| Item | Priority | Description |
|------|--------|------|
| Icon library install + NavBar home/lock icon replacement | P0 | AC-002-ICON core |
| PredictButton Play icon replacement | P0 | AC-002-ICON core |
| LoadingSpinner orbital dots replacement (Option A) | P0 | AC-002-LOADING core |
| SectionHeader icon prop addition + HOW IT WORKS / DEV DIARY icons | P1 | AC-002-ICON |
| Mobile px unification (section px-4) | P1 | AC-002-LAYOUT |
| SectionHeader description add text-sm leading-relaxed | P1 | AC-002-LAYOUT |
| SectionHeader h2 add responsive (text-2xl md:text-3xl) | P1 | AC-002-LAYOUT |
| LoadingSpinner end fade-out transition | P2 | AC-002-LOADING bonus |
| HeroSection inline label → SectionLabel component | P3 | DRY, non-visual |
