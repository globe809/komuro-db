import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Music, ArrowLeft, Edit } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getSingleTypeLabel } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

export default function SingleDetail() {
  const { id } = useParams()
  const [single, setSingle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'singles', id)).then((snap) => {
      if (snap.exists()) setSingle({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!single)
    return (
      <div className="text-center py-20 text-gray-400">
        <p>找不到此單曲</p>
        <Link to="/singles" className="text-blue-600 text-sm mt-2 inline-block">
          回到單曲列表
        </Link>
      </div>
    )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/singles"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-gray-400">單曲</span>
        <Link
          to={`/admin/singles`}
          state={{ editId: id }}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-blue-700"
        >
          <Edit size={13} />
          編輯
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* 封面 */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center p-8">
          {single.imageUrl ? (
            <img
              src={single.imageUrl}
              alt={single.title}
              className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl"
            />
          ) : (
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
              <Music size={80} className="text-blue-700" />
            </div>
          )}
        </div>

        {/* 基本資訊 */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{single.title}</h1>
            {single.type && (
              <span className={`badge shrink-0 ${single.type === 'digital' ? 'badge-green' : 'badge-blue'}`}>
                {getSingleTypeLabel(single.type)}
              </span>
            )}
          </div>
          <p className="text-gray-500 mb-5">{single.artistName}</p>

          <div>
            <InfoRow label="發行日期" value={formatReleaseDate(single.year, single.month, single.day)} />
            <InfoRow label="作詞" value={single.lyrics} />
            <InfoRow label="作曲" value={single.composition} />
            <InfoRow label="編曲" value={single.arrangement} />
            {single.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed">
                {single.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
