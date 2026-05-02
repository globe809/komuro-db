import { useMemo } from 'react'
import { Music, Disc3, TrendingUp, Users, BarChart2, Mic2 } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'

function StatBigCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-6 flex flex-col gap-2">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} mb-1`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="text-3xl font-bold text-[#1d1d1f]">{value}</div>
      <div className="text-sm text-[#6e6e73]">{label}</div>
      {sub && <div className="text-xs text-[#6e6e73] mt-1">{sub}</div>}
    </div>
  )
}

// 藝人別名合併：key(小寫) → canonical key(小寫)
const ARTIST_MERGE = {
  '篠原涼子 with t.komuro': '篠原涼子',
  'true kiss destination': 'kiss destination',
}

// canonical key(小寫) → 正式顯示名稱
const CANONICAL_NAME = {
  '篠原涼子': '篠原涼子',
  'kiss destination': 'KiSS DESTiNATiON',
}

function canonicalKey(name) {
  if (!name) return ''
  const lower = name.toLowerCase()
  return ARTIST_MERGE[lower] ?? lower
}

function formatSales(v) {
  if (!v) return '—'
  return `${v % 1 === 0 ? v : v.toFixed(1)} 萬枚`
}

export default function Stats() {
  const { data: singles, loading: ls } = useCollection('singles', 'year', 'desc')
  const { data: albums, loading: la } = useCollection('albums', 'year', 'desc')
  const { data: artists, loading: lar } = useCollection('artists', 'name', 'asc')
  const { data: providedSongs, loading: lp } = useCollection('providedSongs', 'year', 'desc')

  const loading = ls || la || lar || lp

  const totalSingleSales = useMemo(() =>
    singles.reduce((sum, s) => sum + (Number(s.salesRecord) || 0), 0), [singles])
  const totalAlbumSales = useMemo(() =>
    albums.reduce((sum, a) => sum + (Number(a.salesRecord) || 0), 0), [albums])
  const totalProvidedSales = useMemo(() =>
    providedSongs.reduce((sum, s) => sum + (Number(s.salesRecord) || 0), 0), [providedSongs])

  const singlesWithSales = useMemo(() =>
    singles.filter(s => s.salesRecord != null && s.salesRecord !== '').length, [singles])
  const albumsWithSales = useMemo(() =>
    albums.filter(a => a.salesRecord != null && a.salesRecord !== '').length, [albums])

  const dedupedArtists = useMemo(() => {
    const seen = new Map()
    for (const a of artists) {
      const key = a.name?.toLowerCase()
      if (key && !seen.has(key)) seen.set(key, a)
    }
    return [...seen.values()]
  }, [artists])

  // 判斷一個作品是否與小室哲哉相關（作曲 OR 作詞 OR 製作人 tatsumaki）
  function hasKomuroCredit(item) {
    const KOMURO = '小室哲哉'
    const TATSUMAKI = 'tatsumaki'
    const fields = [item.composition, item.lyrics, item.arrangement]
    if (fields.some(f => f?.includes(KOMURO))) return true
    if (item.producer?.toLowerCase().includes(TATSUMAKI)) return true
    // 逐曲目檢查
    const tracks = item.tracks || []
    return tracks.some(t =>
      t.composition?.includes(KOMURO) ||
      t.lyrics?.includes(KOMURO) ||
      t.arrangement?.includes(KOMURO) ||
      t.producer?.toLowerCase().includes(TATSUMAKI)
    )
  }

  // 藝人別銷量統計 Map（canonicalKey → stats）
  // 納入條件：作曲、作詞含小室哲哉，或製作人為 tatsumaki
  // 若上述欄位均未填寫則視為 TK 作品（資料庫內的預設前提）仍計入
  const artistStatsMap = useMemo(() => {
    const stats = {}
    const EMPTY_STATS = () => ({ singleSales: 0, albumSales: 0, providedSales: 0, singleCount: 0, albumCount: 0, providedCount: 0 })

    // 以 Set 追蹤已計入的 ID，避免同一作品重複計入
    const countedSingleIds = new Set()
    const countedAlbumIds = new Set()

    // 第一輪：所有 singles（無論是否填寫 credit，資料庫內均為 TK 相關）
    singles.forEach(s => {
      if (!s.artistName || countedSingleIds.has(s.id)) return
      countedSingleIds.add(s.id)
      const k = canonicalKey(s.artistName)
      if (!stats[k]) stats[k] = EMPTY_STATS()
      stats[k].singleCount++
      stats[k].singleSales += Number(s.salesRecord) || 0
    })

    // 第二輪：singles 中若有 lyrics（作詞）含小室哲哉但不同藝人名的 track（補充邊緣情況）
    // 此處為保險機制，一般情況 artistName 相同不會再加
    singles.forEach(s => {
      const tracks = s.tracks || []
      tracks.forEach(t => {
        const artistName = t.artistName || s.artistName
        if (!artistName) return
        const hasLyrics = t.lyrics?.includes('小室哲哉')
        const hasTatsumaki = t.producer?.toLowerCase().includes('tatsumaki')
        if (!hasLyrics && !hasTatsumaki) return
        // 若 track 藝人與 single 藝人不同，單獨計入
        if (artistName !== s.artistName) {
          const k = canonicalKey(artistName)
          if (!stats[k]) stats[k] = EMPTY_STATS()
          stats[k].singleCount++
          stats[k].singleSales += Number(s.salesRecord) || 0
        }
      })
    })

    // albums
    albums.forEach(a => {
      if (!a.artistName || countedAlbumIds.has(a.id)) return
      countedAlbumIds.add(a.id)
      const k = canonicalKey(a.artistName)
      if (!stats[k]) stats[k] = EMPTY_STATS()
      stats[k].albumCount++
      stats[k].albumSales += Number(a.salesRecord) || 0
    })

    // providedSongs：全部計入（包含作詞、作曲、tatsumaki 製作）
    providedSongs.forEach(s => {
      if (!s.artistName) return
      const k = canonicalKey(s.artistName)
      if (!stats[k]) stats[k] = EMPTY_STATS()
      stats[k].providedCount++
      stats[k].providedSales += Number(s.salesRecord) || 0
    })

    return stats
  }, [singles, albums, providedSongs])

  // 藝人照片 Map：canonical key → visualArtUrl（從 artists collection 查）
  const artistPhotoMap = useMemo(() => {
    const map = {}
    dedupedArtists.forEach(a => {
      const key = canonicalKey(a.name)
      if (a.visualArtUrl && !map[key]) {
        map[key] = a.visualArtUrl
      }
    })
    return map
  }, [dedupedArtists])

  // 藝人原始名稱 Map：canonical key → 最佳顯示名（從 artists collection 查）
  const artistDisplayMap = useMemo(() => {
    const map = {}
    dedupedArtists.forEach(a => {
      const key = canonicalKey(a.name)
      // 偏好名稱 lowercase === canonical key 的（即非別名）
      if (!map[key] || a.name.toLowerCase() === key) {
        map[key] = a.name
      }
    })
    return map
  }, [dedupedArtists])

  // 藝人排行：從 artistStatsMap 所有 key 出發
  // 涵蓋 singles + albums + providedSongs 的所有藝人，不限於 artists collection
  const artistRanking = useMemo(() => {
    return Object.entries(artistStatsMap).map(([key, s]) => {
      // 顯示名稱優先順序：CANONICAL_NAME → artists collection → 原始作品中的名稱
      const displayName = CANONICAL_NAME[key] || artistDisplayMap[key] || key
      const visualArtUrl = artistPhotoMap[key] || ''

      return {
        name: displayName,
        visualArtUrl,
        singleSales: s.singleSales,
        albumSales: s.albumSales,
        providedSales: s.providedSales,
        singleCount: s.singleCount,
        albumCount: s.albumCount,
        providedCount: s.providedCount,
        totalSales: s.singleSales + s.albumSales + s.providedSales,
        totalWorks: s.singleCount + s.albumCount + s.providedCount,
      }
    })
    .filter(a => a.totalWorks > 0 && a.totalSales > 0)  // 沒有銷量資料者不顯示
    .sort((a, b) => b.totalSales - a.totalSales || b.totalWorks - a.totalWorks)
  }, [artistStatsMap, artistDisplayMap, artistPhotoMap])

  // 銷量前 100 單曲
  const top100Singles = useMemo(() =>
    [...singles]
      .filter(s => s.salesRecord != null && s.salesRecord !== '' && Number(s.salesRecord) > 0)
      .sort((a, b) => Number(b.salesRecord) - Number(a.salesRecord))
      .slice(0, 100),
    [singles])

  // 銷量前 30 專輯
  const top30Albums = useMemo(() =>
    [...albums]
      .filter(a => a.salesRecord != null && a.salesRecord !== '' && Number(a.salesRecord) > 0)
      .sort((a, b) => Number(b.salesRecord) - Number(a.salesRecord))
      .slice(0, 30),
    [albums])

  const grandTotal = totalSingleSales + totalAlbumSales + totalProvidedSales

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-8">
        <BarChart2 size={24} className="text-blue-800" />
        <h1 className="text-2xl font-bold text-[#1d1d1f]">銷量統計</h1>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          {/* ── 總計 ── */}
          <section className="mb-10">
            <h2 className="text-base font-semibold text-[#6e6e73] mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> 整體統計
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBigCard
                icon={Music}
                label="單曲累積銷量"
                value={formatSales(totalSingleSales)}
                color="bg-blue-800"
                sub={singlesWithSales > 0 ? `${singlesWithSales} 張有銷量資料` : '尚無銷量資料'}
              />
              <StatBigCard
                icon={Disc3}
                label="專輯累積銷量"
                value={formatSales(totalAlbumSales)}
                color="bg-indigo-700"
                sub={albumsWithSales > 0 ? `${albumsWithSales} 張有銷量資料` : '尚無銷量資料'}
              />
              <StatBigCard
                icon={Mic2}
                label="提供樂曲銷量"
                value={formatSales(totalProvidedSales)}
                color="bg-rose-600"
              />
              <StatBigCard
                icon={TrendingUp}
                label="單曲＋專輯＋提供 合計"
                value={formatSales(grandTotal)}
                color="bg-teal-700"
              />
            </div>
          </section>

          {/* ── 藝人排行 ── */}
          <section>
            <h2 className="text-base font-semibold text-[#6e6e73] mb-4 flex items-center gap-2">
              <Users size={16} /> 藝人銷量排行
            </h2>

            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-[#6e6e73] px-5 py-3 border-b border-gray-100">
                <div className="w-8">#</div>
                <div>藝人</div>
                <div className="w-24 text-right">單曲銷量</div>
                <div className="w-24 text-right">專輯銷量</div>
                <div className="w-24 text-right">提供樂曲</div>
                <div className="w-24 text-right">合計</div>
              </div>

              {artistRanking.length === 0 ? (
                <p className="text-center py-12 text-sm text-[#6e6e73]">尚無銷量資料</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {artistRanking.map((a, i) => (
                    <div key={a.name} className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center px-5 py-3 hover:bg-[#f5f5f7] transition-colors">
                      <div className="w-8 text-sm font-bold text-[#6e6e73]">
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-800 to-indigo-700 shrink-0">
                          {a.visualArtUrl
                            ? <img src={a.visualArtUrl} alt={a.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                {a.name?.[0]?.toUpperCase()}
                              </div>
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#1d1d1f] truncate">{a.name}</div>
                          <div className="text-xs text-[#6e6e73]">
                            {a.singleCount > 0 && `${a.singleCount} 單曲`}
                            {a.singleCount > 0 && (a.albumCount > 0 || a.providedCount > 0) && ' · '}
                            {a.albumCount > 0 && `${a.albumCount} 專輯`}
                            {a.albumCount > 0 && a.providedCount > 0 && ' · '}
                            {a.providedCount > 0 && `${a.providedCount} 提供樂曲`}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm text-[#1d1d1f]">
                        {a.singleSales > 0 ? formatSales(a.singleSales) : <span className="text-[#6e6e73]">—</span>}
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm text-[#1d1d1f]">
                        {a.albumSales > 0 ? formatSales(a.albumSales) : <span className="text-[#6e6e73]">—</span>}
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm text-[#1d1d1f]">
                        {a.providedSales > 0 ? formatSales(a.providedSales) : <span className="text-[#6e6e73]">—</span>}
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm font-bold text-[#1d1d1f]">
                        {a.totalSales > 0 ? formatSales(a.totalSales) : <span className="font-normal text-[#6e6e73]">—</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── 銷量前 100 單曲 ── */}
          {top100Singles.length > 0 && (
            <section className="mt-10">
              <h2 className="text-base font-semibold text-[#6e6e73] mb-4 flex items-center gap-2">
                <Music size={16} className="text-blue-800" /> 銷量前 {top100Singles.length} 單曲
              </h2>
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[auto_auto_1fr_auto_auto] gap-0 text-xs font-semibold text-[#6e6e73] px-5 py-3 border-b border-gray-100">
                  <div className="w-8">#</div>
                  <div className="w-10" />
                  <div>單曲名稱</div>
                  <div className="w-32 text-right">藝人</div>
                  <div className="w-24 text-right">銷量</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {top100Singles.map((s, i) => (
                    <div key={s.id} className="grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_auto_auto] items-center px-5 py-2.5 hover:bg-[#f5f5f7] transition-colors gap-0">
                      <div className="w-8 text-sm font-bold text-[#6e6e73]">
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="w-10 h-10 rounded overflow-hidden bg-blue-50 shrink-0 mr-3">
                        {s.imageUrl
                          ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-blue-400" /></div>
                        }
                      </div>
                      <div className="min-w-0 pr-3">
                        <div className="text-sm font-medium text-[#1d1d1f] truncate">{s.title}</div>
                        <div className="text-xs text-[#6e6e73] sm:hidden">{s.artistName}</div>
                      </div>
                      <div className="hidden sm:block w-32 text-right text-xs text-[#6e6e73] pr-3 truncate">{s.artistName}</div>
                      <div className="w-24 text-right text-sm font-bold text-blue-800">{formatSales(Number(s.salesRecord))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 銷量前 30 專輯 ── */}
          {top30Albums.length > 0 && (
            <section className="mt-10 mb-4">
              <h2 className="text-base font-semibold text-[#6e6e73] mb-4 flex items-center gap-2">
                <Disc3 size={16} className="text-indigo-700" /> 銷量前 {top30Albums.length} 專輯
              </h2>
              <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[auto_auto_1fr_auto_auto] gap-0 text-xs font-semibold text-[#6e6e73] px-5 py-3 border-b border-gray-100">
                  <div className="w-8">#</div>
                  <div className="w-10" />
                  <div>專輯名稱</div>
                  <div className="w-32 text-right">藝人</div>
                  <div className="w-24 text-right">銷量</div>
                </div>
                <div className="divide-y divide-gray-50">
                  {top30Albums.map((a, i) => (
                    <div key={a.id} className="grid grid-cols-[auto_auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_auto_auto] items-center px-5 py-2.5 hover:bg-[#f5f5f7] transition-colors gap-0">
                      <div className="w-8 text-sm font-bold text-[#6e6e73]">
                        {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                      </div>
                      <div className="w-10 h-10 rounded overflow-hidden bg-indigo-50 shrink-0 mr-3">
                        {a.imageUrl
                          ? <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Disc3 size={14} className="text-indigo-400" /></div>
                        }
                      </div>
                      <div className="min-w-0 pr-3">
                        <div className="text-sm font-medium text-[#1d1d1f] truncate">{a.title}</div>
                        <div className="text-xs text-[#6e6e73] sm:hidden">{a.artistName}</div>
                      </div>
                      <div className="hidden sm:block w-32 text-right text-xs text-[#6e6e73] pr-3 truncate">{a.artistName}</div>
                      <div className="w-24 text-right text-sm font-bold text-indigo-700">{formatSales(Number(a.salesRecord))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
