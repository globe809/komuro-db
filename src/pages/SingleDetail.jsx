import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Music, ArrowLeft, Edit, Youtube, ExternalLink } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getSingleTypeLabel } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

// Convert YouTube URL to embed URL
function getYoutubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function SingleDetail() {
  const { id } = useParams()
  const [single, setSingle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedMv, setExpandedMv] = useState(null)

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
        <Link to="/singles" className="text-blue-600 text-sm mt-2 inline-block">回到單曲列表</Link>
      </div>
    )

  const tracks = single.tracks || []

  // Group tracks by discNo
  const discs = tracks.reduce((acc, track) => {
    const disc = track.discNo || 1
    if (!acc[disc]) acc[disc] = []
    acc[disc].push(track)
    return acc
  }, {})
  const discNumbers = Object.keys(discs).map(Number).sort((a, b) => a - b)
  const hasMultipleDiscs = discNumbers.length > 1

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/singles" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-gray-400">單曲</span>
        <Link to="/admin/singles" className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-blue-700">
          <Edit size={13} />編輯
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* 封面 */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center p-8">
          {single.imageUrl ? (
            <img src={single.imageUrl} alt={single.title}
              className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl" />
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

          <InfoRow label="發行日期" value={formatReleaseDate(single.year, single.month, single.day)} />
          <InfoRow label="製作人" value={single.producer} />
          <InfoRow label="Tie Up" value={single.tieUp} />
          <InfoRow label="Oricon 最高位" value={single.oriconPeak ? `第 ${single.oriconPeak} 位` : null} />

          {single.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed">
              {single.notes}
            </div>
          )}
        </div>

        {/* 曲目列表 */}
        {tracks.length > 0 && (
          <div className="border-t border-gray-100">
            <h2 className="px-6 py-4 font-semibold text-gray-700 text-sm">
              收錄曲目（{tracks.length} 首）
            </h2>

            {discNumbers.map(disc => (
              <div key={disc}>
                {hasMultipleDiscs && (
                  <div className="px-6 py-2 bg-blue-50 border-y border-blue-100">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Music size={12} /> Disc {disc}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-gray-50">
                  {discs[disc].map((track, i) => {
                    const embedUrl = getYoutubeEmbedUrl(track.youtubeUrl)
                    const isOpen = expandedMv === `${disc}-${i}`
                    return (
                      <div key={i}>
                        <div className="px-6 py-3 flex gap-4 hover:bg-gray-50">
                          <span className="text-gray-400 text-sm font-mono w-6 shrink-0 text-right mt-0.5">{i + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">{track.title}</span>
                              {track.youtubeUrl && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedMv(isOpen ? null : `${disc}-${i}`)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="YouTube MV"
                                >
                                  <Youtube size={14} />
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                              {track.lyrics && <span>作詞：{track.lyrics}</span>}
                              {track.composition && <span>作曲：{track.composition}</span>}
                              {track.arrangement && <span>編曲：{track.arrangement}</span>}
                            </div>
                          </div>
                        </div>
                        {/* 展開 YouTube 播放器 */}
                        {isOpen && embedUrl && (
                          <div className="px-6 pb-4">
                            <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                              <iframe
                                className="absolute inset-0 w-full h-full"
                                src={embedUrl}
                                title={`${track.title} MV`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
