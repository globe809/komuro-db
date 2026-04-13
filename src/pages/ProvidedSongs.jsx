import { useMemo, useState, useRef } from 'react'
import { Mic2, Search, X, ChevronRight, User, Disc3 } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'

const KIND_LABEL = { album: '專輯曲', single: '單曲', coupling: 'C/W', other: '其他' }
const KIND_COLOR = {
  album: 'bg-blue-100 text-blue-700',
  single: 'bg-green-100 text-green-700',
  coupling: 'bg-gray-100 text-gray-600',
  other: 'bg-gray-100 text-gray-600',
}

export default function ProvidedSongs() {
  const { data: songs, loading } = useCollection('providedSongs', 'year', 'asc')
  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState('')
  const [filterArtist, setFilterArtist] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const listRef = useRef(null)

  // Top artists by song count
  const topArtists = useMemo(() => {
    const counts = {}
    songs.forEach(s => {
      if (s.artistName) counts[s.artistName] = (counts[s.artistName] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }))
  }, [songs])

  // All unique artists for dropdown
  const allArtists = useMemo(() => {
    return [...new Set(songs.map(s => s.artistName).filter(Boolean))].sort()
  }, [songs])

  const handleArtistClick = (name) => {
    setFilterArtist(prev => prev === name ? '' : name)
    setSearch('')
    // Scroll to list
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const filtered = useMemo(() => {
    let list = [...songs]
    if (search) {
      const kw = search.toLowerCase()
      list = list.filter(s =>
        s.title?.toLowerCase().includes(kw) ||
        s.artistName?.toLowerCase().includes(kw) ||
        s.composition?.toLowerCase().includes(kw)
      )
    }
    if (filterKind) list = list.filter(s => s.kind === filterKind)
    if (filterArtist) list = list.filter(s => s.artistName === filterArtist)

    list.sort((a, b) => {
      const ay = a.year ?? 0, by = b.year ?? 0
      const am = a.month ?? 0, bm = b.month ?? 0
      const ad = a.day ?? 0, bd = b.day ?? 0
      const cmp = ay !== by ? ay - by : am !== bm ? am - bm : ad - bd
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return list
  }, [songs, search, filterKind, filterArtist, sortOrder])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mic2 size={22} className="text-rose-600" />
          <h1 className="text-2xl font-bold text-gray-900">提供樂曲</h1>
        </div>
        <p className="text-sm text-gray-500">小室哲哉作曲・編曲，但非本人監製的樂曲</p>
      </div>

      {/* Top Artists Section */}
      {!loading && topArtists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            提供最多的藝人
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topArtists.map(({ name, count }) => {
              const isSelected = filterArtist === name
              return (
                <button
                  key={name}
                  onClick={() => handleArtistClick(name)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                      : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <User size={14} className={isSelected ? 'text-rose-200 shrink-0' : 'text-gray-400 shrink-0'} />
                    <span className="text-sm font-medium truncate">{name}</span>
                  </div>
                  <span className={`text-xs font-bold ml-2 shrink-0 px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Artist Detail View */}
      {filterArtist && !loading && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <User size={16} className="text-rose-600" />
              <span className="font-semibold text-rose-800">{filterArtist}</span>
              <span className="text-sm text-rose-500">· 共 {filtered.length} 首</span>
            </div>
            <button
              onClick={() => setFilterArtist('')}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-rose-500">顯示 {filterArtist} 的所有提供樂曲</p>
        </div>
      )}

      {/* Filters */}
      <div ref={listRef} className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9 w-full"
            placeholder="搜尋歌名、藝人、作曲者..."
            value={search}
            onChange={e => { setSearch(e.target.value); setFilterArtist('') }}
          />
        </div>
        <select
          className="form-select sm:w-36"
          value={filterKind}
          onChange={e => setFilterKind(e.target.value)}
        >
          <option value="">所有種別</option>
          <option value="single">單曲</option>
          <option value="album">專輯曲</option>
          <option value="coupling">C/W</option>
          <option value="other">其他</option>
        </select>
        {!filterArtist && (
          <select
            className="form-select sm:w-48"
            value={filterArtist}
            onChange={e => setFilterArtist(e.target.value)}
          >
            <option value="">所有藝人</option>
            {allArtists.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select
          className="form-select sm:w-36"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="asc">年份：舊到新</option>
          <option value="desc">年份：新到舊</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-3">
        {filterArtist ? `${filterArtist} · ` : ''}共 {filtered.length} 首
      </p>

      {/* Song List */}
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">沒有符合條件的結果</p>
          ) : (
            filtered.map((song, i) => (
              <div key={song.id || i} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                {/* 封面縮圖 */}
                <div className="w-10 h-10 rounded overflow-hidden bg-rose-50 shrink-0 mt-0.5">
                  {song.imageUrl
                    ? <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Mic2 size={14} className="text-rose-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{song.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${KIND_COLOR[song.kind] || KIND_COLOR.other}`}>
                      {KIND_LABEL[song.kind] || song.kind}
                    </span>
                  </div>
                  {!filterArtist && (
                    <button
                      onClick={() => handleArtistClick(song.artistName)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium mb-1 flex items-center gap-0.5 hover:underline"
                    >
                      {song.artistName}
                      <ChevronRight size={11} />
                    </button>
                  )}
                  {/* 收錄資訊 */}
                  {song.sourceTitle && (
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                      <Disc3 size={11} className="text-gray-400" />
                      {song.sourceTitle}
                      {song.discNo && <span className="text-gray-400">· Disc {song.discNo}</span>}
                      {song.trackNo && <span className="text-gray-400">· #{song.trackNo}</span>}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 flex flex-wrap gap-x-4">
                    {song.lyrics && <span>作詞：{song.lyrics}</span>}
                    {song.composition && <span>作曲：{song.composition}</span>}
                    {song.arrangement && <span>編曲：{song.arrangement}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-400 shrink-0 pt-0.5 whitespace-nowrap">
                  {formatReleaseDate(song.year, song.month, song.day)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
