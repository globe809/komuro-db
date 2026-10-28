import { Link, useLocation } from 'react-router-dom'
import { Video } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getVideoTypeLabel } from '../utils/constants'
import CoverArt from './CoverArt'
import { track } from '../utils/analytics'

export default function VideoWorkCard({ work }) {
  const location = useLocation()
  const { id, title, artistName, year, month, day, imageUrl, videoType } = work
  const formats = Array.isArray(work.formats) ? work.formats : work.format ? [work.format] : []

  return (
    <Link
      state={{ fromList: location.pathname + location.search }}
      to={`/video-works/${id}`}
      className="group block"
      onClick={() => track('select_content', { content_type: 'video', item_id: id, content_title: title, artist: artistName })}
    >
      <div className="relative">
        <CoverArt src={imageUrl} alt={title} icon={Video} iconSize={36} />
        {videoType && (
          <span className="absolute top-2 left-2 z-10 tag-overlay">
            {getVideoTypeLabel(videoType)}
          </span>
        )}
        {formats.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
            {formats.map(f => (
              <span key={f} className="tag-overlay">{f}</span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="text-gray-900 text-sm leading-snug group-hover:text-gray-500 line-clamp-2 transition-colors" style={{ fontWeight: 400 }}>
          {title}
        </h3>
        <p className="text-xs text-gray-400 mt-1 truncate" style={{ fontWeight: 400 }}>{artistName}</p>
        <p className="text-xs text-gray-300 mt-0.5" style={{ fontWeight: 400 }}>{formatReleaseDate(year, month, day)}</p>
      </div>
    </Link>
  )
}
