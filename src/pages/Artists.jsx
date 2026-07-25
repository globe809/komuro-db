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

  // Deduplicate artists by lowercase name (e.g. keep TRF, remove trf)
  const deduped = useMemo(() => {
    const seen = new Map()
    for (const a of artists) {
      const key = a.name?.toLowerCase()
      if (!key) continue
      if (!seen.has(key)) {
        seen.set(key, a)
      } else {
        // Keep the uppercase/canonical version (prefer ALL-CAPS or mixed case over all-lowercase)
        const existing = seen.get(key)
        const existingIsLower = existing.name === existing.name.toLowerCase()
        const currentIsLower = a.name === a.name.toLowerCase()
        if (existingIsLower && !currentIsLower) seen.set(key, a)
      }
    }
    return [...seen.values()]
  }, [artists])

  const filtered = useMemo(() => {
    if (!keyword) return deduped
    return deduped.filter(a => a.name?.toLowerCase().includes(keyword.toLowerCase()))
  }, [deduped, keyword])

  // Merge stats for case variants (TRF + trf → same bucket)
  const mergedStats = useMemo(() => {
    const merged = {}
    Object.entries(artistStats).forEach(([name, stat]) => {
      const key = name.toLowerCase()
      if (!merged[key]) merged[key] = { singles: 0, albums: 0, videoWorks: 0 }
      merged[key].singles += stat.singles || 0
      merged[key].albums += stat.albums || 0
      merged[key].videoWorks += stat.videoWorks || 0
    })
    return merged
  }, [artistStats])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Users size={22} className="text-teal-400" />
        <h1 className="text-2xl font-bold text-white">藝人</h1>
        {!la && <span className="text-sm text-zinc-500 ml-2">共 {deduped.length} 位</span>}
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
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
            const stats = mergedStats[artist.name?.toLowerCase()] || {}
            const total = (stats.singles || 0) + (stats.albums || 0) + (stats.videoWorks || 0)
            return (
              <Link
                key={artist.id}
                to={`/artists/${encodeURIComponent(artist.name)}`}
                className="card p-4 flex items-center gap-4 group hover:border-white/20"
              >
                {/* 頭像 */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-800 to-indigo-700 shrink-0">
                  {artist.visualArtUrl ? (
                    <img src={artist.visualArtUrl} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                      {artist.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white group-hover:text-blue-400 truncate">
                    {artist.name}
                  </div>
                  <div className="flex gap-3 mt-0.5 text-xs text-zinc-500">
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
                <span className="text-zinc-600 group-hover:text-blue-400 text-lg">›</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
