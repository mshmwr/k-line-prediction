import { Link, useLocation } from 'react-router-dom'
import { HomeIcon, LockIcon } from 'lucide-react'

const TEXT_LINKS = [
  { label: 'App', path: '/app' },
  { label: 'About', path: '/about' },
  { label: 'Diary', path: '/diary' },
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

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-transparent border-b border-[#1A1814] h-[56px] md:h-[72px] px-6 md:px-[120px]">
      {/* Left: Home icon */}
      <Link to="/" aria-label="Home">
        <HomeIcon size={16} className="text-[#1A1814] hover:text-[#9C4A3B] transition-colors" />
      </Link>

      {/* Right: Nav links */}
      <div
        data-testid="navbar-desktop"
        className="hidden md:flex items-center gap-8"
      >
        {TEXT_LINKS.map(link => (
          <Link key={link.path} to={link.path} className={navLinkClass(link.path)}>
            {link.label}
          </Link>
        ))}
        <Link
          to="/business-logic"
          className="flex items-center gap-1.5 text-purple-500 hover:text-purple-400 transition-colors font-mono text-[13px]"
        >
          <span>Logic</span>
          <LockIcon size={16} />
        </Link>
      </div>

      <div
        data-testid="navbar-mobile"
        className="flex md:hidden items-center gap-5"
      >
        {TEXT_LINKS.map(link => (
          <Link key={link.path} to={link.path} className={navLinkClass(link.path, true)}>
            {link.label}
          </Link>
        ))}
        <Link
          to="/business-logic"
          className="flex items-center gap-1.5 text-purple-500 hover:text-purple-400 transition-colors font-mono text-[11px]"
        >
          <span>Logic</span>
          <LockIcon size={16} />
        </Link>
      </div>
    </nav>
  )
}
