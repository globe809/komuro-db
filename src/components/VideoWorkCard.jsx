import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'

const formatColors = {
  DVD: 'badge-blue',
  'Blu-ray': 'badge-purple',
  VHS: 'badge-amber',
  LD: 'badge-green',
}

export default function VideoWorkCard({ work }) {
  const { id, title, artistName, year, month, day, format, imageUrl } = work

  return (
    <Link to={`/video-works/${id}`} className="card group block">
      {/* 封面圖片 */}
      <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-950 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video size={40} className="text-gray-600" />
          </div>
        )}
        {format && (
          <div className="absolute top-2 right-2">
            <span className={`badge ${formatColors[format] || 'badge-gray'}`}>
              {format}
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
