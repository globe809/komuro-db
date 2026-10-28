import { Link, useLocation } from 'react-router-dom'
import { Music } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import CoverArt from './CoverArt'
import { track } from '../utils/analytics'

export default function SingleCard({ single }) {
  const location = useLocation()
  const { id, title, artistName, year, month, day, type, imageUrl } = single

  return (
    <Link
      state={{ fromList: location.pathname + location.search }}
      to={`/singles/${id}`}
      className="group block"
      onClick={() => track('select_content', { content_type: 'single', item_id: id, content_title: title, artist: artistName })}
    >
      <div className="relative">
        <CoverArt src={imageUrl} alt={title} icon={Music} iconSize={36} />
        {type === 'digital' && (
          <span className="absolute top-2 right-2 z-10 tag-overlay">Digital</span>
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
