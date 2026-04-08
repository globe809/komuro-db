import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Search, Users } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'

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
  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: videoWorks, loading: lv } = useCollection('videoWorks', 'year', 'desc')
  const { data: artists, loading: lar } = useCollection('artists', 'name', 'asc')

  const [keyword, setKeyword] = useState('')

  const recentSingles = useMemo(() => singles.slice(0, 6), [singles])
  const recentAlbums = useMemo(() => albums.slice(0, 6), [albums])

  // 藝人作品統計
  const artistStats = useMemo(() => {
    const stats = {}
    singles.forEach(s => { if (s.artistName) stats[s.artistName] = { ...(stats[s.artistName] || {}), singles: (stats[s.artistName]?.singles || 0) + 1 } })
    albums.forEach(a => { if (a.artistName) stats[a.artistName] = { ...(stats[a.artistName] || {}), albums: (stats[a.artistName]?.albums || 0) + 1 } })
    return stats
  }, [singles, albums])

  // 依作品數排序，取前 12 位
  const topArtists = useMemo(() => {
    return [...artists]
      .sort((a, b) => {
        const ta = (artistStats[a.name]?.singles || 0) + (artistStats[a.name]?.albums || 0)
        const tb = (artistStats[b.name]?.singles || 0) + (artistStats[b.name]?.albums || 0)
        return tb - ta
      })
      .slice(0, 12)
  }, [artists, artistStats])

  const loading = ls || la || lv

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-950 mb-3">
          小室哲哉 作品資料庫
        </h1>
        <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
          收錄小室哲哉製作之單曲、專輯與影像作品的完整資料庫
        </p>
        <div className="mt-6 max-w-md mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="輸入歌名、藝人名稱搜尋..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && keyword.trim())
                window.location.href = `#/singles?q=${encodeURIComponent(keyword)}`
            }}
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-sm"
          />
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* 統計 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <StatCard icon={Users} label="藝人" count={artists.length} to="/artists" color="bg-teal-700" />
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
                  const stats = artistStats[artist.name] || {}
                  return (
                    <Link
                      key={artist.id}
                      to={`/artists/${encodeURIComponent(artist.name)}`}
                      className="card p-3 text-center group hover:border-blue-200"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-800 to-indigo-700 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                        {artist.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-800 leading-snug line-clamp-2">
                        {artist.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {(stats.singles || 0) + (stats.albums || 0)} 作品
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
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                        : <Music size={16} className="text-blue-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{s.title}</div>
                      <div className="text-xs text-gray-400">{s.artistName}</div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{s.year ? `${s.year}年` : '年份未定'}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* 最新專輯 */}
          {recentAlbums.length > 0 && (
            <section>
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
                      {a.imageUrl
                        ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                        : <Disc3 size={16} className="text-indigo-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{a.title}</div>
                      <div className="text-xs text-gray-400">{a.artistName}</div>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{a.year ? `${a.year}年` : '年份未定'}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
