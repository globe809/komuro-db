import { Link } from 'react-router-dom'
import { Disc3 } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getAlbumTypeLabel } from '../utils/constants'

const typeColors = {
  studio: 'badge-blue',
  remix: 'badge-purple',
  best: 'badge-amber',
  project: 'badge-green',
  box: 'badge-red',
  other: 'badge-gray',
}

export default function AlbumCard({ album }) {
  const { id, title, artistName, year, month, day, albumType, imageUrl } = album

  return (
    <Link to={`/albums/${id}`} className="card group block">
      {/* 封面圖片 */}
      <div className="aspect-square bg-gradient-to-br from-indigo-900 to-purple-950 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc3 size={40} className="text-indigo-700" />
          </div>
        )}
        {/* 類型標籤 */}
        {albumType && (
          <div className="absolute top-2 right-2">
            <span className={`badge ${typeColors[albumType] || 'badge-gray'}`}>
              {getAlbumTypeLabel(albumType)}
            </span>
          </div>
        )}
      </div>

      {/* 資訊 */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-blue-800 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{artistName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatReleaseDate(year, month, day)}
        </p>
      </div>
    </Link>
  )
}
