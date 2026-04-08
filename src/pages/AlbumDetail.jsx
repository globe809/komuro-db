import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Disc3, ArrowLeft, Edit, Music } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getAlbumTypeLabel } from '../utils/constants'
import LoadingSpinner from '../components/LoadingSpinner'

const typeColors = {
  studio: 'badge-blue',
  remix: 'badge-purple',
  best: 'badge-amber',
  project: 'badge-green',
  box: 'badge-red',
  other: 'badge-gray',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-20 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

export default function AlbumDetail() {
  const { id } = useParams()
  const [album, setAlbum] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'albums', id)).then((snap) => {
      if (snap.exists()) setAlbum({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!album)
    return (
      <div className="text-center py-20 text-gray-400">
        <p>找不到此專輯</p>
        <Link to="/albums" className="text-blue-600 text-sm mt-2 inline-block">
          回到專輯列表
        </Link>
      </div>
    )

  const tracks = album.tracks || []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/albums" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-sm text-gray-400">專輯</span>
        <Link
          to="/admin/albums"
          state={{ editId: id }}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-blue-700"
        >
          <Edit size={13} />
          編輯
        </Link>
      </div>

      <div className="card overflow-hidden">
        {/* 封面 */}
        <div className="bg-gradient-to-br from-indigo-900 to-purple-950 flex items-center justify-center p-8">
          {album.imageUrl ? (
            <img
              src={album.imageUrl}
              alt={album.title}
              className="w-48 h-48 sm:w-64 sm:h-64 object-cover rounded-xl shadow-2xl"
            />
          ) : (
            <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
              <Disc3 size={80} className="text-indigo-700" />
            </div>
          )}
        </div>

        {/* 基本資訊 */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{album.title}</h1>
            {album.albumType && (
              <span className={`badge shrink-0 ${typeColors[album.albumType] || 'badge-gray'}`}>
                {getAlbumTypeLabel(album.albumType)}
              </span>
            )}
          </div>
          <p className="text-gray-500 mb-5">{album.artistName}</p>

          <InfoRow label="發行日期" value={formatReleaseDate(album.year, album.month, album.day)} />
          <InfoRow label="製作人" value={album.producer} />
          {album.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed">
              {album.notes}
            </div>
          )}
        </div>

        {/* 曲目列表 */}
        {tracks.length > 0 && (
          <div className="border-t border-gray-100">
            <h2 className="px-6 py-4 font-semibold text-gray-700 text-sm">
              曲目列表（{tracks.length} 首）
            </h2>
            <div className="divide-y divide-gray-50">
              {tracks.map((track, i) => (
                <div key={i} className="px-6 py-3 flex gap-4 hover:bg-gray-50">
                  <span className="text-gray-400 text-sm font-mono w-6 shrink-0 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{track.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3">
                      {track.lyrics && <span>作詞：{track.lyrics}</span>}
                      {track.composition && <span>作曲：{track.composition}</span>}
                      {track.arrangement && <span>編曲：{track.arrangement}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
