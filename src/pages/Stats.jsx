import { useMemo } from 'react'
import { Music, Disc3, TrendingUp, Users, BarChart2 } from 'lucide-react'
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

// 藝人別名合併：key(小寫) → 正規藝人名(小寫)
const ARTIST_MERGE = {
  '篠原涼子 with t.komuro': '篠原涼子',
  'true kiss destination': 'kiss destination',
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

  const loading = ls || la || lar

  const totalSingleSales = useMemo(() =>
    singles.reduce((sum, s) => sum + (Number(s.salesRecord) || 0), 0), [singles])
  const totalAlbumSales = useMemo(() =>
    albums.reduce((sum, a) => sum + (Number(a.salesRecord) || 0), 0), [albums])

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

  const artistStatsMap = useMemo(() => {
    const stats = {}
    singles.forEach(s => {
      if (!s.artistName) return
      const k = canonicalKey(s.artistName)
      if (!stats[k]) stats[k] = { name: s.artistName, singleSales: 0, albumSales: 0, singleCount: 0, albumCount: 0 }
      stats[k].singleCount++
      stats[k].singleSales += Number(s.salesRecord) || 0
    })
    albums.forEach(a => {
      if (!a.artistName) return
      const k = canonicalKey(a.artistName)
      if (!stats[k]) stats[k] = { name: a.artistName, singleSales: 0, albumSales: 0, singleCount: 0, albumCount: 0 }
      stats[k].albumCount++
      stats[k].albumSales += Number(a.salesRecord) || 0
    })
    return stats
  }, [singles, albums])

  const artistRanking = useMemo(() => {
    return dedupedArtists
      .map(a => {
        const k = canonicalKey(a.name)
        const s = artistStatsMap[k] || { singleSales: 0, albumSales: 0, singleCount: 0, albumCount: 0 }
        return {
          name: a.name,
          visualArtUrl: a.visualArtUrl,
          singleSales: s.singleSales,
          albumSales: s.albumSales,
          singleCount: s.singleCount,
          albumCount: s.albumCount,
          totalSales: s.singleSales + s.albumSales,
          totalWorks: s.singleCount + s.albumCount,
        }
      })
      .filter(a => a.totalWorks > 0)
      .sort((a, b) => b.totalSales - a.totalSales || b.totalWorks - a.totalWorks)
  }, [dedupedArtists, artistStatsMap])

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
                icon={TrendingUp}
                label="單曲＋專輯合計"
                value={formatSales(totalSingleSales + totalAlbumSales)}
                color="bg-teal-700"
              />
              <StatBigCard
                icon={Users}
                label="藝人數"
                value={artistRanking.length}
                color="bg-gray-700"
                sub="有作品紀錄"
              />
            </div>
          </section>

          {/* ── 藝人排行 ── */}
          <section>
            <h2 className="text-base font-semibold text-[#6e6e73] mb-4 flex items-center gap-2">
              <Users size={16} /> 藝人銷量排行
            </h2>

            <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-semibold text-[#6e6e73] px-5 py-3 border-b border-gray-100">
                <div className="w-8">#</div>
                <div>藝人</div>
                <div className="w-24 text-right">單曲銷量</div>
                <div className="w-24 text-right">專輯銷量</div>
                <div className="w-24 text-right">合計</div>
              </div>

              {artistRanking.length === 0 ? (
                <p className="text-center py-12 text-sm text-[#6e6e73]">尚無銷量資料</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {artistRanking.map((a, i) => (
                    <div key={a.name} className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center px-5 py-3 hover:bg-[#f5f5f7] transition-colors">
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
                            {a.singleCount > 0 && a.albumCount > 0 && ' · '}
                            {a.albumCount > 0 && `${a.albumCount} 專輯`}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm text-[#1d1d1f]">
                        {a.singleSales > 0 ? formatSales(a.singleSales) : <span className="text-[#6e6e73]">—</span>}
                      </div>
                      <div className="hidden sm:block w-24 text-right text-sm text-[#1d1d1f]">
                        {a.albumSales > 0 ? formatSales(a.albumSales) : <span className="text-[#6e6e73]">—</span>}
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
        </>
      )}
    </div>
  )
}
