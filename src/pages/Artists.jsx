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

  const featuredArtists = useMemo(() => filtered.filter(a => a.featured), [filtered])
  const normalArtists = useMemo(() => filtered.filter(a => !a.featured), [filtered])

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Artists</h1>
        {!la && <span className="text-sm text-gray-400">{deduped.length}</span>}
      </div>

      <div className="relative mb-8">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-11 pr-4 py-2.5 rounded-full text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-900 placeholder:text-gray-400"
          placeholder="Search artists..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
      </div>

      {la ? <LoadingSpinner /> : (
        <>
          {/* 重要藝人（置頂、放大） */}
          {featuredArtists.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-9 mb-12">
              {featuredArtists.map(artist => (
                <ArtistGridCard key={artist.id} artist={artist} stats={mergedStats[artist.name?.toLowerCase()] || {}} large />
              ))}
            </div>
          )}

          {/* 一般藝人 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
            {normalArtists.map(artist => (
              <ArtistGridCard key={artist.id} artist={artist} stats={mergedStats[artist.name?.toLowerCase()] || {}} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* 藝人卡片（寬3:高2，含毛玻璃光暈；large 為重要藝人放大版） */
function ArtistGridCard({ artist, stats, large = false }) {
  const total = (stats.singles || 0) + (stats.albums || 0) + (stats.videoWorks || 0)
  return (
    <Link to={`/artists/${encodeURIComponent(artist.name)}`} className="group block">
      <div className="relative">
        {artist.visualArtUrl && (
          <img src={artist.visualArtUrl} alt="" aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover rounded-xl pointer-events-none"
            style={{ filter: 'blur(26px) saturate(1.5)', transform: 'translateY(9%) scale(0.92)', opacity: 0.5 }} />
        )}
        <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-gray-100">
          {artist.visualArtUrl ? (
            <img src={artist.visualArtUrl} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center text-gray-300 ${large ? 'text-6xl' : 'text-3xl'}`} style={{ fontWeight: 300 }}>
              {artist.name?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 px-0.5">
        <div className={`text-gray-900 group-hover:text-gray-500 transition-colors truncate ${large ? 'text-lg' : 'text-sm'}`} style={{ fontWeight: 400 }}>
          {artist.name}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-gray-400">
          {stats.singles > 0 && <span className="flex items-center gap-0.5"><Music size={11} /> {stats.singles}</span>}
          {stats.albums > 0 && <span className="flex items-center gap-0.5"><Disc3 size={11} /> {stats.albums}</span>}
          {stats.videoWorks > 0 && <span className="flex items-center gap-0.5"><Video size={11} /> {stats.videoWorks}</span>}
          {total === 0 && <span>—</span>}
        </div>
      </div>
    </Link>
  )
}
