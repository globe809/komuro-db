import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getVideoTypeLabel } from '../utils/constants'

const formatColors = {
  DVD: 'badge-blue',
  'Blu-ray': 'badge-purple',
  VHS: 'badge-amber',
  LD: 'badge-green',
}

const typeColors = {
  concert: 'bg-rose-600',
  mv: 'bg-blue-700',
  documentary: 'bg-teal-700',
  box: 'bg-amber-600',
}

export default function VideoWorkCard({ work }) {
  const { id, title, artistName, year, month, day, imageUrl, videoType } = work
  // Backward-compat: support both formats[] array and legacy format string
  const formats = Array.isArray(work.formats) ? work.formats : work.format ? [work.format] : []

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
        {/* 類型標籤（左上角） */}
        {videoType && (
          <div className="absolute top-2 left-2">
            <span className={`text-xs text-white font-semibold px-2 py-0.5 rounded-full ${typeColors[videoType] || 'bg-gray-600'}`}>
              {getVideoTypeLabel(videoType)}
            </span>
          </div>
        )}
        {/* 格式標籤（右上角） */}
        {formats.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {formats.map(f => (
              <span key={f} className={`badge ${formatColors[f] || 'badge-gray'}`}>{f}</span>
            ))}
          </div>
        )}
      </div>

      {/* 資訊 */}
      <div className="p-3">
        <h3 className="font-semibold text-[#1d1d1f] text-sm leading-snug group-hover:text-blue-800 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-[#6e6e73] mt-1">{artistName}</p>
        <p className="text-xs text-[#6e6e73]/70 mt-0.5">
          {formatReleaseDate(year, month, day)}
        </p>
      </div>
    </Link>
  )
}
