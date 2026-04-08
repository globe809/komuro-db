import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Music, Disc3, Video, Users, ArrowLeft, Upload } from 'lucide-react'

const sideLinks = [
  { to: '/admin', label: '總覽', icon: LayoutDashboard, end: true },
  { to: '/admin/artists', label: '藝人管理', icon: Users },
  { to: '/admin/singles', label: '單曲管理', icon: Music },
  { to: '/admin/albums', label: '專輯管理', icon: Disc3 },
  { to: '/admin/video-works', label: '影像作品', icon: Video },
  { to: '/admin/import', label: '資料匯入', icon: Upload },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 側邊欄 */}
      <aside className="w-56 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-blue-900">
          <div className="text-sm font-bold">後台管理</div>
          <div className="text-xs text-blue-400 mt-0.5">小室哲哉作品資料庫</div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sideLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-400 text-blue-950 font-semibold'
                    : 'text-blue-200 hover:bg-blue-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-900">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-400 hover:text-white hover:bg-blue-800 transition-colors"
          >
            <ArrowLeft size={14} />
            回到前台
          </Link>
        </div>
      </aside>

      {/* 主內容 */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
