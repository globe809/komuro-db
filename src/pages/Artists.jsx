import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Music, Disc3, Video } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Artists() {
  const [keyword, setKeyword] = useState('')
  const { data: artists, loading: la } = useCollection('artists', 'name', 'asc')
  const { data: singles } = useCollection('singles', 'year', 'desc')
  const { data: albums } = useCollection('albums', 'year', 'desc')
  const { data: videoWorks } = useCollection('videoWorks', 'year', 'desc')

  // 統計每位藝人的作品數
  const artistStats = useMemo(() => {
    const stats = {}
    singles.forEach(s => { if (s.artistName) stats[s.artistName] = { ...(stats[s.artistName] || {}), singles: (stats[s.artistName]?.singles || 0) + 1 } })
    albums.forEach(a => { if (a.artistName) stats[a.artistName] = { ...(stats[a.artistName] || {}), albums: (stats[a.artistName]?.albums || 0) + 1 } })
    videoWorks.forEach(v => { if (v.artistName) stats[v.artistName] = { ...(stats[v.artistName] || {}), videoWorks: (stats[v.artistName]?.videoWorks || 0) + 1 } })
    return stats
  }, [singles, albums, videoWorks])

  const filtered = useMemo(() => {
    if (!keyword) return artists
    return artists.filter(a => a.name?.toLowerCase().includes(keyword.toLowerCase()))
  }, [artists, keyword])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-teal-700" />
        <h1 className="text-2xl font-bold text-gray-900">藝人</h1>
        {!la && <span className="text-sm text-gray-400 ml-2">共 {filtered.length} 位</span>}
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="搜尋藝人名稱..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      {la ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(artist => {
            const stats = artistStats[artist.name] || {}
            const total = (stats.singles || 0) + (stats.albums || 0) + (stats.videoWorks || 0)
            return (
              <Link
                key={artist.id}
                to={`/artists/${encodeURIComponent(artist.name)}`}
                className="card p-4 flex items-center gap-4 group hover:border-blue-200"
              >
                {/* 頭像佔位 */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {artist.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 group-hover:text-blue-800 truncate">
                    {artist.name}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                    {stats.singles > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Music size={11} /> {stats.singles}
                      </span>
                    )}
                    {stats.albums > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Disc3 size={11} /> {stats.albums}
                      </span>
                    )}
                    {stats.videoWorks > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Video size={11} /> {stats.videoWorks}
                      </span>
                    )}
                    {total === 0 && <span>尚無作品</span>}
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-blue-400 text-lg">›</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
