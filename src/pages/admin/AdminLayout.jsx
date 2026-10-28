import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Music, Disc3, Video, Users, ArrowLeft, Upload, Mic2, Settings, LogOut, Lock, ListChecks } from 'lucide-react'
import { useAuth, ADMIN_EMAIL } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/LoadingSpinner'

const sideLinks = [
  { to: '/admin', label: '總覽', icon: LayoutDashboard, end: true },
  { to: '/admin/artists', label: '藝人管理', icon: Users },
  { to: '/admin/singles', label: '單曲管理', icon: Music },
  { to: '/admin/albums', label: '專輯管理', icon: Disc3 },
  { to: '/admin/video-works', label: '影像作品', icon: Video },
  { to: '/admin/provided-songs', label: '提供樂曲', icon: Mic2 },
  { to: '/admin/collection', label: '收藏／缺片', icon: Disc3 },
  { to: '/admin/data-quality', label: '資料檢查', icon: ListChecks },
  { to: '/admin/import', label: '資料匯入', icon: Upload },
  { to: '/admin/site-config', label: '網站設定', icon: Settings },
]

/* 登入 / 權限畫面 */
function Gate({ children }) {
  const { user, loading, isAdmin, signIn, signOut, error } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafaf9' }}><LoadingSpinner /></div>
  }

  // 未登入
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fafaf9' }}>
        <div className="card p-8 w-full max-w-sm text-center">
          <div className="font-brand text-xl tracking-widest text-gray-900 mb-1" style={{ letterSpacing: '0.2em' }}>TK WORKS</div>
          <div className="text-xs text-gray-400 mb-8" style={{ letterSpacing: '0.05em' }}>Admin</div>
          <Lock size={28} className="text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm text-gray-500 mb-6">此區域需要管理員登入</p>
          <button onClick={signIn} className="btn-primary w-full justify-center flex items-center gap-2">
            使用 Google 登入
          </button>
          {error && (
            <p className="mt-4 text-xs text-red-500 break-all">
              {error === 'auth/unauthorized-domain'
                ? '此網域未授權。請到 Firebase Console → Authentication → Settings → Authorized domains 加入 tk56.web.app'
                : `登入失敗：${error}`}
            </p>
          )}
          <Link to="/" className="inline-block mt-5 text-xs text-gray-400 hover:text-gray-900 transition-colors">回到前台</Link>
        </div>
      </div>
    )
  }

  // 已登入但非管理員帳號
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#fafaf9' }}>
        <div className="card p-8 w-full max-w-sm text-center">
          <Lock size={28} className="text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-sm text-gray-900 mb-1">沒有管理權限</p>
          <p className="text-xs text-gray-400 mb-6 break-all">目前登入：{user.email}<br />僅限 {ADMIN_EMAIL}</p>
          <button onClick={signOut} className="btn-secondary w-full justify-center flex items-center gap-2">
            <LogOut size={15} /> 登出
          </button>
          <Link to="/" className="inline-block mt-5 text-xs text-gray-400 hover:text-gray-900 transition-colors">回到前台</Link>
        </div>
      </div>
    )
  }

  return children
}

export default function AdminLayout() {
  const { user, signOut } = useAuth()

  return (
    <Gate>
      <div className="min-h-screen flex" style={{ background: '#fafaf9' }}>
        {/* 側邊欄 */}
        <aside className="w-56 bg-white flex flex-col shrink-0" style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.07)' }}>
          <div className="px-5 py-5 border-b border-gray-100">
            <Link to="/" className="font-brand text-base tracking-widest text-gray-900" style={{ letterSpacing: '0.2em' }}>TK WORKS</Link>
            <div className="text-xs text-gray-400 mt-1" style={{ letterSpacing: '0.05em' }}>Admin</div>
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
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-gray-100 space-y-1">
            <div className="px-3 pb-1 text-[11px] text-gray-400 truncate" title={user?.email}>{user?.email}</div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={14} /> 登出
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={14} /> 回到前台
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
    </Gate>
  )
}
