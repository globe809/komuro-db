import { Link, NavLink } from 'react-router-dom'
import { Music, Disc3, Video, Settings, Users, Mic2, BarChart2, PenLine } from 'lucide-react'

const navLinks = [
  { to: '/artists', label: '藝人', icon: Users },
  { to: '/singles', label: '單曲', icon: Music },
  { to: '/albums', label: '專輯', icon: Disc3 },
  { to: '/video-works', label: '影像作品', icon: Video },
  { to: '/provided-songs', label: '提供樂曲', icon: Mic2 },
  { to: '/composition', label: '作曲總覽', icon: PenLine },
  { to: '/stats', label: '銷量統計', icon: BarChart2 },
]

export default function Navbar() {
  return (
    <header
      className="text-white shadow-lg sticky top-0 z-40"
      style={{
        background: 'rgba(20, 20, 30, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
              <Disc3 size={18} className="text-gray-900" />
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="text-sm font-bold tracking-wide text-white">小室哲哉</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>作品資料庫</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Admin link */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 shrink-0"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' }}
          >
            <Settings size={14} />
            後台管理
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden pb-2 gap-1 overflow-x-auto scrollbar-hide">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={12} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  )
}
