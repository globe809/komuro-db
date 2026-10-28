import { Link, NavLink } from 'react-router-dom'
import { Music, Disc3, Video, Users, Mic2, BarChart2, PenLine } from 'lucide-react'

const navLinks = [
  { to: '/artists', label: 'Artists', icon: Users },
  { to: '/singles', label: 'Singles', icon: Music },
  { to: '/albums', label: 'Albums', icon: Disc3 },
  { to: '/video-works', label: 'Video', icon: Video },
  { to: '/provided-songs', label: 'Songs', icon: Mic2 },
  { to: '/composition', label: 'Works', icon: PenLine },
  { to: '/stats', label: 'Charts', icon: BarChart2 },
]

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(250,250,249,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', letterSpacing: '0.2em', color: '#111' }}>
              TK WORKS
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                    isActive
                      ? 'control-selected'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
                style={{ letterSpacing: '0.05em', fontWeight: 400 }}
              >
                {label}
              </NavLink>
            ))}
          </nav>

        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden pb-2 gap-1 overflow-x-auto scrollbar-hide">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'control-selected'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
              style={{ letterSpacing: '0.05em', fontWeight: 400 }}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  )
}
