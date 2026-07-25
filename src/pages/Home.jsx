import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Music, Disc3, Video, Search, Users, Mic2, Calendar, ChevronDown, List, LayoutGrid } from 'lucide-react'
import { useCollection, useDocument } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'

function StatCard({ icon: Icon, label, count, to, color }) {
  return (
    <Link to={to} className="card p-5 flex items-center gap-4 group hover:border-white/20">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{count}</div>
        <div className="text-sm text-zinc-500">{label}</div>
      </div>
    </Link>
  )
}

// 清單容器：list 模式為直向分隔列表，grid 模式為卡片網格
function ItemContainer({ viewMode, children }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {children}
      </div>
    )
  }
  return (
    <div className="bg-zinc-900 rounded-xl border border-white/8 shadow-sm divide-y divide-white/5">
      {children}
    </div>
  )
}

// 單筆作品：依 viewMode 顯示為列表列或卡片。若未提供 to，則不可點擊
function ReleaseItem({ to, title, subtitle, dateLabel, imageUrl, Icon, iconBg, iconColor, isToday, viewMode }) {
  const Wrapper = to ? Link : 'div'
  const wrapperProps = to ? { to } : {}

  if (viewMode === 'grid') {
    return (
      <Wrapper {...wrapperProps} className="card group block overflow-hidden">
        <div className={`aspect-square relative overflow-hidden ${iconBg}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon size={28} className={iconColor} />
            </div>
          )}
          {isToday && (
            <span className="absolute top-1.5 left-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow">
              🎉 今天
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
            <div className="text-xs font-semibold text-white leading-snug line-clamp-2 drop-shadow-md">
              {title}
            </div>
            <div className="text-[11px] text-white/65 mt-0.5 truncate">{subtitle}</div>
          </div>
        </div>
      </Wrapper>
    )
  }
  return (
    <Wrapper {...wrapperProps}
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${isToday ? 'bg-amber-900/20 hover:bg-amber-900/30' : to ? 'hover:bg-white/5' : ''}`}>
      <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 overflow-hidden ${iconBg}`}>
        {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          : <Icon size={16} className={iconColor} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-white truncate flex items-center gap-1.5">
          {title}
          {isToday && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shrink-0">
              🎉 今天發行
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500 truncate">{subtitle}</div>
      </div>
      <div className={`text-xs shrink-0 ${isToday ? 'text-amber-600 font-semibold' : 'text-zinc-500'}`}>{dateLabel}</div>
    </Wrapper>
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
  const [viewMode, setViewMode] = useState('list')

  const recentSingles = useMemo(() => singles.slice(0, 6), [singles])
  const recentAlbums = useMemo(() => albums.slice(0, 6), [albums])
  const recentProvided = useMemo(() => providedSongs.slice(0, 6), [providedSongs])

  // 歷史上的這個月：過去發行於本月的單曲與專輯（依日期、年份排序）
  const today = useMemo(() => new Date(), [])
  const currentMonth = useMemo(() => today.getMonth() + 1, [today])
  const currentDay = useMemo(() => today.getDate(), [today])

  const historicalSingles = useMemo(() => {
    return singles
      .filter(s => s.month === currentMonth)
      .sort((a, b) => (a.day || 0) - (b.day || 0) || (b.year || 0) - (a.year || 0))
  }, [singles, currentMonth])

  const historicalAlbums = useMemo(() => {
    return albums
      .filter(a => a.month === currentMonth)
      .sort((a, b) => (a.day || 0) - (b.day || 0) || (b.year || 0) - (a.year || 0))
  }, [albums, currentMonth])

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
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="輸入歌名、藝人名稱搜尋..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && keyword.trim())
                  window.location.href = `#/search?q=${encodeURIComponent(keyword)}`
              }}
              className="w-full pl-11 pr-4 py-3 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-lg bg-zinc-900 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? <LoadingSpinner /> : (
          <>
            {/* 統計 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="藝人" count={dedupedArtists.length} to="/artists" color="bg-teal-700" />
              <StatCard icon={Music} label="單曲" count={singles.length} to="/singles" color="bg-blue-800" />
              <StatCard icon={Disc3} label="專輯" count={albums.length} to="/albums" color="bg-indigo-700" />
              <StatCard icon={Video} label="影像作品" count={videoWorks.length} to="/video-works" color="bg-gray-700" />
            </div>

            {/* 顯示模式切換 */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex items-center rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <List size={14} /> 列表
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <LayoutGrid size={14} /> 卡片
                </button>
              </div>
            </div>

            {/* 藝人 Section */}
            {topArtists.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Users size={18} className="text-teal-400" /> 藝人
                  </h2>
                  <Link to="/artists" className="text-sm text-blue-400 hover:underline">查看全部</Link>
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

            {/* 歷史上的這個月 */}
            {(historicalSingles.length > 0 || historicalAlbums.length > 0) && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Calendar size={18} className="text-amber-600" /> 歷史上的{currentMonth}月發行
                  </h2>
                </div>
                <div className="space-y-3">
                  {historicalSingles.length > 0 && (
                    <details className="bg-zinc-900 rounded-xl border border-white/8 shadow-sm group" open>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none list-none">
                        <span className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                          <Music size={16} className="text-blue-400" /> 單曲
                          <span className="text-xs font-normal text-zinc-500">({historicalSingles.length})</span>
                        </span>
                        <ChevronDown size={16} className="text-zinc-500 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className={viewMode === 'grid' ? 'p-3 border-t border-gray-50' : 'border-t border-gray-50'}>
                        <ItemContainer viewMode={viewMode}>
                          {historicalSingles.map(s => (
                            <ReleaseItem
                              key={`s-${s.id}`}
                              to={`/singles/${s.id}`}
                              title={s.title}
                              subtitle={s.artistName}
                              dateLabel={formatReleaseDate(s.year, s.month, s.day)}
                              imageUrl={s.imageUrl}
                              Icon={Music}
                              iconBg="bg-blue-900/30"
                              iconColor="text-blue-400"
                              isToday={s.day === currentDay}
                              viewMode={viewMode}
                            />
                          ))}
                        </ItemContainer>
                      </div>
                    </details>
                  )}
                  {historicalAlbums.length > 0 && (
                    <details className="bg-zinc-900 rounded-xl border border-white/8 shadow-sm group" open>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none list-none">
                        <span className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                          <Disc3 size={16} className="text-indigo-400" /> 專輯
                          <span className="text-xs font-normal text-zinc-500">({historicalAlbums.length})</span>
                        </span>
                        <ChevronDown size={16} className="text-zinc-500 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className={viewMode === 'grid' ? 'p-3 border-t border-gray-50' : 'border-t border-gray-50'}>
                        <ItemContainer viewMode={viewMode}>
                          {historicalAlbums.map(a => (
                            <ReleaseItem
                              key={`a-${a.id}`}
                              to={`/albums/${a.id}`}
                              title={a.title}
                              subtitle={a.artistName}
                              dateLabel={formatReleaseDate(a.year, a.month, a.day)}
                              imageUrl={a.imageUrl}
                              Icon={Disc3}
                              iconBg="bg-indigo-100"
                              iconColor="text-indigo-400"
                              isToday={a.day === currentDay}
                              viewMode={viewMode}
                            />
                          ))}
                        </ItemContainer>
                      </div>
                    </details>
                  )}
                </div>
              </section>
            )}

            {/* 最新單曲 */}
            {recentSingles.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Music size={18} className="text-blue-400" /> 最新單曲
                  </h2>
                  <Link to="/singles" className="text-sm text-blue-400 hover:underline">查看全部</Link>
                </div>
                <ItemContainer viewMode={viewMode}>
                  {recentSingles.map(s => (
                    <ReleaseItem
                      key={s.id}
                      to={`/singles/${s.id}`}
                      title={s.title}
                      subtitle={s.artistName}
                      dateLabel={s.year ? `${s.year}年` : ''}
                      imageUrl={s.imageUrl}
                      Icon={Music}
                      iconBg="bg-blue-900/30"
                      iconColor="text-blue-400"
                      viewMode={viewMode}
                    />
                  ))}
                </ItemContainer>
              </section>
            )}

            {/* 最新專輯 */}
            {recentAlbums.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Disc3 size={18} className="text-indigo-400" /> 最新專輯
                  </h2>
                  <Link to="/albums" className="text-sm text-blue-400 hover:underline">查看全部</Link>
                </div>
                <ItemContainer viewMode={viewMode}>
                  {recentAlbums.map(a => (
                    <ReleaseItem
                      key={a.id}
                      to={`/albums/${a.id}`}
                      title={a.title}
                      subtitle={a.artistName}
                      dateLabel={a.year ? `${a.year}年` : ''}
                      imageUrl={a.imageUrl}
                      Icon={Disc3}
                      iconBg="bg-indigo-100"
                      iconColor="text-indigo-400"
                      viewMode={viewMode}
                    />
                  ))}
                </ItemContainer>
              </section>
            )}

            {/* 近期提供樂曲 */}
            {recentProvided.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Mic2 size={18} className="text-rose-400" /> 近期提供樂曲
                  </h2>
                  <Link to="/provided-songs" className="text-sm text-blue-400 hover:underline">查看全部</Link>
                </div>
                <ItemContainer viewMode={viewMode}>
                  {recentProvided.map((s, i) => (
                    <ReleaseItem
                      key={s.id || i}
                      title={s.title}
                      subtitle={s.sourceTitle ? `${s.artistName} · ${s.sourceTitle}` : s.artistName}
                      dateLabel={formatReleaseDate(s.year, s.month, s.day)}
                      imageUrl={s.imageUrl}
                      Icon={Mic2}
                      iconBg="bg-rose-900/20"
                      iconColor="text-rose-400"
                      viewMode={viewMode}
                    />
                  ))}
                </ItemContainer>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
