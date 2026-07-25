import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Disc3, ArrowLeft, Edit, Youtube, Music } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getAlbumTypeLabel } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const typeColors = {
  studio: 'badge-blue',
  remix: 'badge-purple',
  best: 'badge-amber',
  project: 'badge-green',
  soundtrack: 'badge-teal',
  live: 'badge-orange',
  instrumental: 'badge-indigo',
  box: 'badge-red',
  other: 'badge-gray',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-white/8 last:border-0">
      <span className="text-sm text-zinc-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-zinc-100 font-medium">{value}</span>
    </div>
  )
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default function AlbumDetail() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedMv, setExpandedMv] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'albums', id)).then((snap) => {
      if (snap.exists()) setAlbum({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!album)
    return (
      <div className="text-center py-20 text-zinc-500">
        <p>找不到此專輯</p>
        <Link to="/albums" className="text-blue-400 text-sm mt-2 inline-block">回到專輯列表</Link>
      </div>
    )

  const tracks = album.tracks || []

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
        <Link to="/albums" className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-zinc-500">專輯</span>
        <Link to="/admin/albums" state={{ editId: id }}
          className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-400">
          <Edit size={13} />編輯
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* 封面 */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-950 flex items-center justify-center p-8">
          {album.imageUrl ? (
            <img src={album.imageUrl} alt={album.title}
              className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl" />
          ) : (
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
              <Disc3 size={80} className="text-indigo-400" />
            </div>
          )}
        </div>

        {/* 基本資訊 */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-white leading-snug">{album.title}</h1>
            {album.albumType && (
              <span className={`badge shrink-0 ${typeColors[album.albumType] || 'badge-gray'}`}>
                {getAlbumTypeLabel(album.albumType)}
              </span>
            )}
          </div>
          <p className="text-zinc-500 mb-5">{album.artistName}</p>

          <InfoRow label="發行日期" value={formatReleaseDate(album.year, album.month, album.day)} />
          <InfoRow label="製作人" value={album.producer} />
          <InfoRow label="執行製作人" value={album.executiveProducer} />
          <InfoRow label="Oricon 最高位" value={album.oriconPeak ? `第 ${album.oriconPeak} 位` : null} />
          <InfoRow label="銷量紀錄" value={album.salesRecord != null && album.salesRecord !== '' ? `${album.salesRecord} 萬枚` : null} />
        </div>

        {/* 曲目列表 */}
        {tracks.length > 0 && (
          <div className="border-t border-white/8">
            <h2 className="px-6 py-4 font-semibold text-zinc-300 text-sm">
              曲目列表（{tracks.length} 首）
            </h2>

            {discNumbers.map(disc => (
              <div key={disc}>
                {hasMultipleDiscs && (
                  <div className="px-6 py-2 bg-indigo-50 border-y border-indigo-100">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Disc3 size={12} /> Disc {disc}
                    </span>
                  </div>
                )}
                <div className="divide-y divide-white/5">
                  {discs[disc].map((track, i) => {
                    const embedUrl = getYoutubeEmbedUrl(track.youtubeUrl)
                    const isOpen = expandedMv === `${disc}-${i}`
                    return (
                      <div key={i}>
                        <div className="px-6 py-3 flex gap-4 hover:bg-zinc-900/50">
                          <span className="text-zinc-500 text-sm font-mono w-6 shrink-0 text-right mt-1">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-zinc-100">{track.title}</span>
                              {track.youtubeUrl && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedMv(isOpen ? null : `${disc}-${i}`)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-400 rounded-full text-xs font-medium hover:bg-red-200 transition-colors"
                                >
                                  <Youtube size={11} /> MV
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5 flex flex-wrap gap-x-3">
                              {track.lyrics && <span>作詞：{track.lyrics}</span>}
                              {track.composition && <span>作曲：{track.composition}</span>}
                              {track.arrangement && <span>編曲：{track.arrangement}</span>}
                            </div>
                          </div>
                        </div>
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

        {/* Credit */}
        {album.notes && (
          <div className="border-t border-white/8 px-6 py-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Credit</h2>
            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{album.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
