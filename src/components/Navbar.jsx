import { Link, NavLink } from 'react-router-dom'
import { Music, Disc3, Video, Settings } from 'lucide-react'

const navLinks = [
  { to: '/singles', label: '單曲', icon: Music },
  { to: '/albums', label: '專輯', icon: Disc3 },
  { to: '/video-works', label: '影像作品', icon: Video },
]

export default function Navbar() {
  return (
    <header className="bg-blue-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
              <Disc3 size={18} className="text-blue-950" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">小室哲哉</div>
              <div className="text-xs text-blue-300">作品資料庫</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-400 text-blue-950'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Admin link */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <Settings size={14} />
            後台管理
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden pb-2 gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-400 text-blue-950'
                    : 'text-blue-100 hover:bg-blue-800'
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  )
}
