import { useEffect, useState } from 'react'
import { useParams, Link , useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Video, ArrowLeft, Edit } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import LoadingSpinner from '../components/LoadingSpinner'

const formatBadgeColor = {
  DVD: 'badge-blue',
  'Blu-ray': 'badge-purple',
  VHS: 'badge-amber',
  LD: 'badge-green',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-20 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  )
}

export default function VideoWorkDetail() {
  const location = useLocation()
  const backTo = location.state?.fromList?.startsWith('/video-works?') || location.state?.fromList === '/video-works' ? location.state.fromList : '/video-works'
  const { id } = useParams()
  const [work, setWork] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'videoWorks', id)).then((snap) => {
      if (snap.exists()) setWork({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!work)
    return (
      <div className="text-center py-20 text-gray-400">
        <p>找不到此影像作品</p>
        <Link to={backTo} className="text-gray-400 text-sm mt-2 inline-block">
          回到影像作品列表
        </Link>
      </div>
    )

  const contents = work.contents || []

  // Backward-compat: support both formats (array) and format (string)
  const formats = Array.isArray(work.formats)
    ? work.formats
    : work.format
    ? [work.format]
    : []

  // Group contents by discNo if multiple discs exist
  const hasDiscs = contents.some(c => c.discNo && c.discNo > 1)
  const discGroups = contents.reduce((acc, item) => {
    const disc = item.discNo || 1
    if (!acc[disc]) acc[disc] = []
    acc[disc].push(item)
    return acc
  }, {})
  const discNums = Object.keys(discGroups).map(Number).sort((a, b) => a - b)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to={backTo} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-gray-400">影像作品</span>
        <Link to="/admin/video-works" state={{ editId: id }}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
          <Edit size={13} />編輯
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* 封面（毛玻璃背景隨封面顏色變化） */}
        <div className="relative flex items-center justify-center p-8 overflow-hidden">
          {work.imageUrl ? (
            <>
              <div className="absolute inset-0"
                style={{ backgroundImage: `url(${work.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(50px) saturate(1.6)', transform: 'scale(1.2)' }} />
              <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} />
              <img src={work.imageUrl} alt={work.title}
                className="relative w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl" />
            </>
          ) : (
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-gray-100 rounded-xl">
              <Video size={80} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* 基本資訊 */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{work.title}</h1>
            {/* Format badges */}
            {formats.length > 0 && (
              <div className="flex gap-1 flex-wrap shrink-0">
                {formats.map(f => (
                  <span key={f} className={`badge ${formatBadgeColor[f] || 'badge-gray'}`}>{f}</span>
                ))}
              </div>
            )}
          </div>
          <p className="text-gray-400 mb-5">{work.artistName}</p>

          <InfoRow label="發行日期" value={formatReleaseDate(work.year, work.month, work.day)} />
        </div>

        {/* 內容列表 */}
        {contents.length > 0 && (
          <div className="border-t border-gray-100">
            <h2 className="px-6 py-4 font-semibold text-gray-600 text-sm">
              收錄內容（{contents.length} 項）
            </h2>

            {hasDiscs ? (
              discNums.map(disc => (
                <div key={disc}>
                  <div className="px-6 py-2 bg-white/50 border-y border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                      Disc {disc}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {discGroups[disc].map((item, i) => (
                      <div key={i} className="px-6 py-2.5 flex gap-4">
                        <span className="text-gray-400 text-sm font-mono w-6 shrink-0 text-right">{i + 1}</span>
                        <span className="text-sm text-gray-900">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="divide-y divide-gray-100">
                {contents.map((item, i) => (
                  <div key={i} className="px-6 py-2.5 flex gap-4">
                    <span className="text-gray-400 text-sm font-mono w-6 shrink-0 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-900">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Credit */}
        {work.notes && (
          <div className="border-t border-gray-100 px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">Credit</h2>
            <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{work.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
