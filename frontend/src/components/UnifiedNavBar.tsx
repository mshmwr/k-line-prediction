import { Link, useLocation } from 'react-router-dom'
import { HomeIcon } from 'lucide-react'

/**
 * UnifiedNavBar — AC-021-NAVBAR / K-030
 *
 * 項目順序（對齊設計稿 homepage-v2.pen）：
 *   ⌂ (Home icon, 左側) / App / Diary / Prediction (hidden) / About
 *
 * `Prediction` 對應 /business-logic 路由，K-021 sprint 先隱藏
 * （hidden: true 經 filter 過濾後完全不渲染至 DOM，非 CSS 隱藏）。
 *
 * `App` 標 `external: true`（K-030）：改用原生 `<a target="_blank"
 *  rel="noopener noreferrer">`，點擊時於新 tab 開啟 /app。其他 link 保持 SPA `<Link>`。
 * NavBar 本身於 K-030 起不再渲染於 /app（AppPage 已移除使用），故 App link 永遠
 * 處於 inactive 視覺狀態（pathname ≠ '/app'），不帶 `aria-current`。
 *
 * Active state：沿用 K-017 視覺驗收通過的 brick-dark (#9C4A3B) —
 * brick (#B43A2C) 保留給 K-023 Hero magenta，brick-dark 為 hover/
 * active variant。aria-current="page" 提供 screen-reader + 測試穩定性。
 */
const TEXT_LINKS: Array<{ label: string; path: string; hidden?: boolean; external?: boolean }> = [
  { label: 'App', path: '/app', external: true },
  { label: 'Diary', path: '/diary' },
  { label: 'Prediction', path: '/business-logic', hidden: true },
  { label: 'About', path: '/about' },
]

export default function UnifiedNavBar() {
  const { pathname } = useLocation()

  function navLinkClass(path: string, mobile = false): string {
    const isActive = pathname === path
    const sizeClass = mobile ? 'text-[11px]' : 'text-[13px]'
    if (isActive) {
      return `${sizeClass} font-mono text-brick-dark transition-colors`
    }
    return `${sizeClass} font-mono text-ink/60 hover:text-ink transition-colors`
  }

  const visibleLinks = TEXT_LINKS.filter(link => !link.hidden)

  function renderLink(
    link: { label: string; path: string; external?: boolean },
    mobile: boolean,
  ) {
    // External (new-tab) link — native <a> required because <Link> ignores `target`.
    if (link.external) {
      return (
        <a
          key={link.path}
          href={link.path}
          target="_blank"
          rel="noopener noreferrer"
          className={navLinkClass(link.path, mobile)}
        >
          {link.label}
        </a>
      )
    }
    // Default SPA link (react-router-dom)
    return (
      <Link
        key={link.path}
        to={link.path}
        aria-current={pathname === link.path ? 'page' : undefined}
        className={navLinkClass(link.path, mobile)}
      >
        {link.label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-paper border-b border-ink h-[56px] md:h-[72px] px-6 md:px-[120px]">
      {/* Left: Home icon */}
      <Link
        to="/"
        aria-label="Home"
        aria-current={pathname === '/' ? 'page' : undefined}
      >
        <HomeIcon size={16} className="text-ink hover:text-brick-dark transition-colors" />
      </Link>

      {/* Right: Nav links (desktop) */}
      <div
        data-testid="navbar-desktop"
        className="hidden md:flex items-center gap-8"
      >
        {visibleLinks.map(link => renderLink(link, false))}
      </div>

      {/* Right: Nav links (mobile) */}
      <div
        data-testid="navbar-mobile"
        className="flex md:hidden items-center gap-5"
      >
        {visibleLinks.map(link => renderLink(link, true))}
      </div>
    </nav>
  )
}
