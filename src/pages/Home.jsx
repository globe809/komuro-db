import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Search, Users, Mic2 } from 'lucide-react'
import { useCollection, useDocument } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'

function StatCard({ icon: Icon, label, count, to, color }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-4 group hover:border-blue-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{count}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Link>
  )
}

export default function Home() {
  const { data: siteConfig } = useDocument('siteConfig', 'home')
  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: videoWorks, loading: lv } = useCollection('videoWorks', 'year', 'desc')
  const { data: artists, loading: lar } = useCollection('artists', 'name', 'asc')
  const { data: providedSongs, loading: lp } = useCollection('providedSongs', 'year', 'desc')

  const [keyword, setKeyword] = useState('')

  const recentSingles = useMemo(() => singles.slice(0, 6), [singles])
  const recentAlbums = useMemo(() => albums.slice(0, 6), [albums])
  const recentProvided = useMemo(() => providedSongs.slice(0, 6), [providedSongs])

  // Deduplicate artists by lowercase name
  const dedupedArtists = useMemo(() => {
    const seen = new Map()
    for (const a of artists) {
      const key = a.name?.toLowerCase()
      if (!key) continue
      if (!seen.has(key)) seen.set(key, a)
      else {
        const existing = seen.get(key)
        if (existing.name === existing.name.toLowerCase()) seen.set(key, a)
      }
    }
    return [...seen.values()]
  }, [artists])

  // Artist stats (case-insensitive merge)
  const artistStats = useMemo(() => {
    const stats = {}
    singles.forEach(s => {
      if (s.artistName) {
        const k = s.artistName.toLowerCase()
        if (!stats[k]) stats[k] = {}
        stats[k].singles = (stats[k].singles || 0) + 1
      }
    })
    albums.forEach(a => {
      if (a.artistName) {
        const k = a.artistName.toLowerCase()
        if (!stats[k]) stats[k] = {}
        stats[k].albums = (stats[k].albums || 0) + 1
      }
    })
    return stats
  }, [singles, albums])

  const topArtists = useMemo(() => {
    return [...dedupedArtists]
      .sort((a, b) => {
        const ka = a.name?.toLowerCase(), kb = b.name?.toLowerCase()
        const ta = (artistStats[ka]?.singles || 0) + (artistStats[ka]?.albums || 0)
        const tb = (artistStats[kb]?.singles || 0) + (artistStats[kb]?.albums || 0)
        return tb - ta
      })
      .slice(0, 12)
  }, [dedupedArtists, artistStats])

  const loading = ls || la || lv || lar

  return (
    <div>
      {/* ── Full-width Visual Art Header ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(200px, 40vh, 480px)' }}
      >
        {siteConfig?.visualArtUrl ? (
          <>
            <img
              src={siteConfig.visualArtUrl}
              alt="小室哲哉"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-950/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-950 to-indigo-900" />
        )}

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-lg leading-tight mb-3">
            小室哲哉<br />
            <span className="text-xl sm:text-2xl font-normal text-blue-200">作品資料庫</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-200 hidden sm:block">
            收錄小室哲哉製作之單曲、專輯與影像作品的完整資料庫
          </p>
        </div>

        {/* Search bar overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4 flex justify-center">
          <div className="w-full max-w-lg relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="輸入歌名、藝人名稱搜尋..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keyword.trim())
                  window.location.href = `#/search?q=${encodeURIComponent(keyword)}`
              }}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-lg bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* 統計 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Users} label="藝人" count={dedupedArtists.length} to="/artists" color="bg-teal-700" />
              <StatCard icon={Music} label="單曲" count={singles.length} to="/singles" color="bg-blue-800" />
              <StatCard icon={Disc3} label="專輯" count={albums.length} to="/albums" color="bg-indigo-700" />
              <StatCard icon={Video} label="影像作品" count={videoWorks.length} to="/video-works" color="bg-gray-700" />
            </div>

            {/* 藝人 Section */}
            {topArtists.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Users size={18} className="text-teal-700" /> 藝人
                  </h2>
                  <Link to="/artists" className="text-sm text-blue-700 hover:underline">查看全部</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {topArtists.map(artist => {
                    const stats = artistStats[artist.name?.toLowerCase()] || {}
                    return (
                      <Link
                        key={artist.id}
                        to={`/artists/${encodeURIComponent(artist.name)}`}
                        className="card group block overflow-hidden"
                      >
                        <div className="aspect-square relative overflow-hidden">
                          {artist.visualArtUrl ? (
                            <img
                              src={artist.visualArtUrl}
                              alt={artist.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center text-white font-bold text-3xl">
                              {artist.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          {/* 底部漸層遮罩確保文字清晰 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
                            <div className="text-xs font-semibold text-white leading-snug line-clamp-2 drop-shadow-md">
                              {artist.name}
                            </div>
                            <div className="text-xs text-white/65 mt-0.5">
                              {(stats.singles || 0) + (stats.albums || 0)} 作品
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 最新單曲 */}
            {recentSingles.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Music size={18} className="text-blue-800" /> 最新單曲
                  </h2>
                  <Link to="/singles" className="text-sm text-blue-700 hover:underline">查看全部</Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {recentSingles.map(s => (
                    <Link key={s.id} to={`/singles/${s.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.imageUrl ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                          : <Music size={16} className="text-blue-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{s.title}</div>
                        <div className="text-xs text-gray-400">{s.artistName}</div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">{s.year ? `${s.year}年` : ''}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 最新專輯 */}
            {recentAlbums.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Disc3 size={18} className="text-indigo-700" /> 最新專輯
                  </h2>
                  <Link to="/albums" className="text-sm text-blue-700 hover:underline">查看全部</Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {recentAlbums.map(a => (
                    <Link key={a.id} to={`/albums/${a.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {a.imageUrl ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                          : <Disc3 size={16} className="text-indigo-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{a.title}</div>
                        <div className="text-xs text-gray-400">{a.artistName}</div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">{a.year ? `${a.year}年` : ''}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 近期提供樂曲 */}
            {recentProvided.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Mic2 size={18} className="text-rose-600" /> 近期提供樂曲
                  </h2>
                  <Link to="/provided-songs" className="text-sm text-blue-700 hover:underline">查看全部</Link>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {recentProvided.map((s, i) => (
                    <div key={s.id || i} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-10 h-10 rounded bg-rose-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.imageUrl ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                          : <Mic2 size={16} className="text-rose-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{s.title}</div>
                        <div className="text-xs text-gray-400">{s.artistName}
                          {s.sourceTitle && ` · ${s.sourceTitle}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 shrink-0">
                        {formatReleaseDate(s.year, s.month, s.day)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
