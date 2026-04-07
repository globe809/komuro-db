import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Users, PlusCircle } from 'lucide-react'
import { useCollection } from '../../hooks/useFirestore'

function StatBox({ icon: Icon, label, count, to, addTo, color }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <Link
          to={addTo}
          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
        >
          <PlusCircle size={14} />
          新增
        </Link>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{count}</div>
      <Link to={to} className="text-sm text-gray-500 hover:text-blue-700">
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">後台總覽</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox
          icon={Music}
          label="單曲"
          count={singles.length}
          to="/admin/singles"
          addTo="/admin/singles"
          color="bg-blue-800"
        />
        <StatBox
          icon={Disc3}
          label="專輯"
          count={albums.length}
          to="/admin/albums"
          addTo="/admin/albums"
          color="bg-indigo-700"
        />
        <StatBox
          icon={Video}
          label="影像作品"
          count={videoWorks.length}
          to="/admin/video-works"
          addTo="/admin/video-works"
          color="bg-gray-700"
        />
        <StatBox
          icon={Users}
          label="藝人"
          count={artists.length}
          to="/admin/artists"
          addTo="/admin/artists"
          color="bg-teal-700"
        />
      </div>

      {/* 快速入口 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/admin/singles"
            className="flex items-center gap-2 p-3 rounded-lg border border-blue-100 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <PlusCircle size={16} />
            新增單曲
          </Link>
          <Link
            to="/admin/albums"
            className="flex items-center gap-2 p-3 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-800 text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            <PlusCircle size={16} />
            新增專輯
          </Link>
          <Link
            to="/admin/video-works"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <PlusCircle size={16} />
            新增影像作品
          </Link>
        </div>
      </div>
    </div>
  )
}
