import { Link } from 'react-router-dom'
import { Disc3 } from 'lucide-react'
import { formatReleaseDate } from '../utils/formatDate'
import { getAlbumTypeLabelEn } from '../utils/constants'
import CoverArt from './CoverArt'
import { track } from '../utils/analytics'

export default function AlbumCard({ album }) {
  const { id, title, artistName, year, month, day, albumType, imageUrl } = album

  return (
    <Link
      to={`/albums/${id}`}
      className="group block"
      onClick={() => track('select_content', { content_type: 'album', item_id: id, content_title: title, artist: artistName })}
    >
      <div className="relative">
        <CoverArt src={imageUrl} alt={title} icon={Disc3} iconSize={36} />
        {albumType && (
          <span className="absolute top-2 right-2 z-10 tag-overlay">
            {getAlbumTypeLabelEn(albumType)}
          </span>
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
