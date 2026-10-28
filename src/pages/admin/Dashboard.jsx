import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Users, PlusCircle } from 'lucide-react'
import { useCollection } from '../../hooks/useFirestore'

function StatBox({ icon: Icon, label, count, to, addTo }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <Icon size={22} className="text-gray-400" strokeWidth={1.5} />
        <Link
          to={addTo}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-900 transition-colors"
        >
          <PlusCircle size={14} />
          新增
        </Link>
      </div>
      <div className="text-3xl text-gray-900 mb-1" style={{ fontWeight: 400 }}>{count}</div>
      <Link to={to} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
        {label} →
      </Link>
    </div>
  )
}

export default function Dashboard() {
  const { data: singles } = useCollection('singles')
  const { data: albums } = useCollection('albums')
  const { data: videoWorks } = useCollection('videoWorks')
  const { data: artists } = useCollection('artists', 'name')

  return (
    <div>
      <h1 className="text-2xl text-gray-900 mb-6" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>後台總覽</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox icon={Music} label="單曲" count={singles.length} to="/admin/singles" addTo="/admin/singles" />
        <StatBox icon={Disc3} label="專輯" count={albums.length} to="/admin/albums" addTo="/admin/albums" />
        <StatBox icon={Video} label="影像作品" count={videoWorks.length} to="/admin/video-works" addTo="/admin/video-works" />
        <StatBox icon={Users} label="藝人" count={artists.length} to="/admin/artists" addTo="/admin/artists" />
      </div>

      {/* 快速入口 */}
      <div className="card p-5">
        <h2 className="text-sm text-gray-500 mb-4" style={{ fontWeight: 400, letterSpacing: '0.05em' }}>快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/admin/singles" className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <PlusCircle size={16} /> 新增單曲
          </Link>
          <Link to="/admin/albums" className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <PlusCircle size={16} /> 新增專輯
          </Link>
          <Link to="/admin/video-works" className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <PlusCircle size={16} /> 新增影像作品
          </Link>
        </div>
      </div>
    </div>
  )
}
