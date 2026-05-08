# K-002 Component Spec — UnifiedNavBar + LoadingSpinner + PredictButton

**Ticket:** K-002
**Status:** Design Complete
**Updated:** 2026-04-18

---

## 1. UnifiedNavBar

Single React component; uses CSS (Tailwind responsive breakpoint) to handle desktop / mobile layouts.

### 1.1 Desktop Layout (>= md breakpoint)

| Property | Spec |
|------|------|
| Container class | `flex items-center justify-between px-[120px] h-[72px] bg-[#0D0D0D] border-b border-[#1F1F1F]` |
| Left slot | HomeIcon (Lucide `HomeIcon`, 16×16, stroke `#F5F5F5`) |
| Right slot | `flex items-center gap-8` — App / About / Diary (text) + Logic (text + LockIcon) |
| Font | `font-mono text-[13px] font-normal` |
| Text color (default) | `text-zinc-500` (`#71717A`) |
| Logic link color | `text-purple-500` (`#A855F7`) |
| LockIcon position | Right of "Logic" text, `gap-1.5` (6px) |

**Home link:**
```tsx
<Link to="/">
  <HomeIcon size={16} className="text-neutral-100 hover:text-white transition-colors" />
</Link>
```

**Logic link:**
```tsx
<Link to="/logic" className="flex items-center gap-1.5 text-purple-500 hover:text-purple-400 transition-colors">
  <span className="font-mono text-[13px]">Logic</span>
  <LockIcon size={16} />
</Link>
```

---

### 1.2 Mobile Layout (< md breakpoint)

| Property | Spec |
|------|------|
| Container class | `flex items-center justify-between px-6 h-[56px] bg-[#0D0D0D] border-b border-[#1F1F1F]` |
| Left slot | HomeIcon (Lucide `HomeIcon`, 16×16, stroke `#F5F5F5`) |
| Right slot | `flex items-center gap-5` — App / About / Diary / Logic + LockIcon |
| Text link | Same as desktop, `text-zinc-500 font-mono text-[13px]` |
| Logic link | Same as desktop, `text-purple-500` + LockIcon on right |

**Mobile / Desktop shared component skeleton:**
```tsx
<nav className="flex items-center justify-between bg-[#0D0D0D] border-b border-[#1F1F1F]
                h-[56px] md:h-[72px] px-6 md:px-[120px]">
  {/* Left: Home icon */}
  <Link to="/">
    <HomeIcon size={16} className="text-neutral-100" />
  </Link>
  {/* Right: Nav links */}
  <div className="flex items-center gap-5 md:gap-8">
    <NavLink to="/app">App</NavLink>
    <NavLink to="/about">About</NavLink>
    <NavLink to="/diary">Diary</NavLink>
    <Link to="/logic" className="flex items-center gap-1.5 text-purple-500">
      <span>Logic</span>
      <LockIcon size={16} />
    </Link>
  </div>
</nav>
```

**NavLink helper (text link):**
```tsx
// text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-[13px]
```

---

### 1.3 Icon Tokens

| Icon | Lucide Component | Size | Color Token |
|------|-----------------|------|------------|
| Home | `HomeIcon` | 16×16 | `text-neutral-100` (`#F5F5F5`) |
| Lock | `LockIcon` | 16×16 | `text-purple-500` (`#A855F7`) |

---

## 2. LoadingSpinner — Orbital Dots

| Property | Spec |
|------|------|
| Container class | `flex flex-col items-center justify-center gap-3 w-[400px] h-[120px] bg-[#0D1117] rounded-lg` |
| Dots row | `flex items-center gap-3` |
| Dot size | `w-2.5 h-2.5` (10×10px) |
| Dot color | `bg-purple-500` (`#A855F7`) |
| Animation | `animate-pulse` scale 0→1→0; each of 3 dots gets delay |
| Delay setup | dot1: `delay-0`, dot2: `[animation-delay:120ms]`, dot3: `[animation-delay:240ms]` |
| Label text | `"Running prediction..."` |
| Label class | `text-zinc-500 font-mono text-[12px]` |

**JSX skeleton:**
```tsx
<div className="flex flex-col items-center justify-center gap-3 rounded-lg
                bg-[#0D1117] px-8 py-6">
  <div className="flex items-center gap-3">
    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse [animation-delay:120ms]" />
    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse [animation-delay:240ms]" />
  </div>
  <p className="text-zinc-500 font-mono text-[12px]">Running prediction...</p>
</div>
```

---

## 3. PredictButton

| Property | Spec |
|------|------|
| Container class | `flex items-center justify-center gap-2 w-[320px] h-[40px] bg-violet-700 rounded` |
| Hover state | `hover:bg-violet-600 transition-colors` |
| Icon | `PlayIcon` (Lucide), size 16×16, `text-white` |
| Icon position | Left of text, `gap-2` (8px) |
| Button text | `"Start Prediction"` |
| Text class | `text-white font-mono text-[13px] font-bold` |
| Color token | `bg-violet-700` (`#7C3AED`) |

**JSX skeleton:**
```tsx
<button
  className="flex items-center justify-center gap-2 w-[320px] h-[40px]
             bg-violet-700 hover:bg-violet-600 rounded transition-colors
             font-mono text-[13px] font-bold text-white"
  onClick={onStartPrediction}
  disabled={isLoading}
>
  <PlayIcon size={16} />
  Start Prediction
</button>
```

---

## 4. Color Token Summary

| Token name | Hex | Tailwind class | Use |
|-----------|-----|---------------|------|
| Background dark | `#0D0D0D` | `bg-[#0D0D0D]` | NavBar background |
| Background darker | `#0D1117` | `bg-[#0D1117]` | Spinner background |
| Border subtle | `#1F1F1F` | `border-[#1F1F1F]` | NavBar bottom border |
| Text primary | `#F5F5F5` | `text-neutral-100` | Home icon stroke |
| Text secondary | `#71717A` | `text-zinc-500` | Nav links, spinner label |
| Purple accent | `#A855F7` | `text-purple-500` / `bg-purple-500` | Logic link, Lock icon, dots |
| Purple button | `#7C3AED` | `bg-violet-700` | PredictButton background |
| White | `#FFFFFF` | `text-white` | Button text, Play icon |

---

## 5. Behavior Notes

| Component | Behavior |
|------|------|
| HomeIcon | Click → `navigate("/")` |
| App / About / Diary | Text link → corresponding route; active state may add `text-white` |
| Logic + LockIcon | Always shown (regardless of auth state); click → `navigate("/logic")` |
| PredictButton | When `disabled`, shows `opacity-50 cursor-not-allowed`; while loading, replaced by LoadingSpinner |
| LoadingSpinner | Shown after PredictButton click and before API response |

---

## 6. Design File Mapping

| Component | .pen frame ID |
|------|-------------|
| NavBar Desktop | `k002_navbar_desktop` |
| NavBar Mobile | `k002_navbar_mobile` |
| LoadingSpinner | `k002_loading_spinner` |
| PredictButton | `k002_predict_button` |
