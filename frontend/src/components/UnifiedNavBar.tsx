import { Link, useLocation } from 'react-router-dom'
import { HomeIcon } from 'lucide-react'

/**
 * UnifiedNavBar — AC-021-NAVBAR
 *
 * 項目順序（對齊設計稿 homepage-v2.pen）：
 *   ⌂ (Home icon, 左側) / App / Diary / Prediction (hidden) / About
 *
 * `Prediction` 對應 /business-logic 路由，K-021 sprint 先隱藏
 * （hidden: true 經 filter 過濾後完全不渲染至 DOM，非 CSS 隱藏）。
 *
 * Active state：沿用 K-017 視覺驗收通過的 brick-dark (#9C4A3B) —
 * brick (#B43A2C) 保留給 K-023 Hero magenta，brick-dark 為 hover/
 * active variant。aria-current="page" 提供 screen-reader + 測試穩定性。
 */
const TEXT_LINKS: Array<{ label: string; path: string; hidden?: boolean }> = [
  { label: 'App', path: '/app' },
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
      return `${sizeClass} font-mono text-[#9C4A3B] transition-colors`
    }
    return `${sizeClass} font-mono text-[#1A1814]/60 hover:text-[#1A1814] transition-colors`
  }

  const visibleLinks = TEXT_LINKS.filter(link => !link.hidden)

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-[#F4EFE5] border-b border-[#1A1814] h-[56px] md:h-[72px] px-6 md:px-[120px]">
      {/* Left: Home icon */}
      <Link
        to="/"
        aria-label="Home"
        aria-current={pathname === '/' ? 'page' : undefined}
      >
        <HomeIcon size={16} className="text-[#1A1814] hover:text-[#9C4A3B] transition-colors" />
      </Link>

      {/* Right: Nav links (desktop) */}
      <div
        data-testid="navbar-desktop"
        className="hidden md:flex items-center gap-8"
      >
        {visibleLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            aria-current={pathname === link.path ? 'page' : undefined}
            className={navLinkClass(link.path)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right: Nav links (mobile) */}
      <div
        data-testid="navbar-mobile"
        className="flex md:hidden items-center gap-5"
      >
        {visibleLinks.map(link => (
          <Link
            key={link.path}
            to={link.path}
            aria-current={pathname === link.path ? 'page' : undefined}
            className={navLinkClass(link.path, true)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
