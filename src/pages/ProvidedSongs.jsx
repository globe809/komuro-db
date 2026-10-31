import { useMemo, useState, useRef } from 'react'
import { Mic2, Search, X, ChevronRight, Disc3, Youtube } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import YearTimeline from '../components/YearTimeline'
import { compareReleaseDate } from '../utils/sortReleaseDate'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatReleaseDate } from '../utils/formatDate'
import { getProvidedSongKindLabel } from '../utils/constants'

const KIND_COLOR = {
  single: 'bg-blue-50 text-gray-400',
  digital: 'bg-green-900/30 text-green-700',
  album: 'bg-indigo-100 text-indigo-400',
  coupling: 'bg-gray-100 text-gray-500',
  other: 'bg-gray-100 text-gray-500',
}

export default function ProvidedSongs() {
  const { data: songs, loading } = useCollection('providedSongs', null)
  const { data: artistsData } = useCollection('artists', 'name', 'asc')
  const [search, setSearch] = useState('')
  const [filterKind, setFilterKind] = useState('')
  const [filterArtist, setFilterArtist] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const listRef = useRef(null)

  // Build map: artist name (lowercase) → visualArtUrl
  const artistImageMap = useMemo(() => {
    const map = {}
    artistsData.forEach(a => {
      if (a.name) map[a.name.toLowerCase()] = a.visualArtUrl || ''
    })
    return map
  }, [artistsData])

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

    list.sort((a, b) => compareReleaseDate(a, b, sortOrder))
    return list
  }, [songs, search, filterKind, filterArtist, sortOrder])

  // Group filtered songs by sourceTitle, then sort within group by discNo → trackNo
  const groupedFiltered = useMemo(() => {
    const groups = []
    const groupMap = new Map()
    filtered.forEach(song => {
      const key = song.sourceTitle || ''
      if (!groupMap.has(key)) {
        const group = { key, sourceTitle: song.sourceTitle || '', imageUrl: '', artistName: song.artistName || '', songs: [] }
        groupMap.set(key, group)
        groups.push(group)
      }
      const group = groupMap.get(key)
      if (!group.imageUrl && song.imageUrl) group.imageUrl = song.imageUrl
      group.songs.push(song)
    })
    // Sort songs within each group by discNo → trackNo
    groups.forEach(group => {
      group.songs.sort((a, b) => {
        const da = a.discNo ?? 1, db = b.discNo ?? 1
        if (da !== db) return da - db
        const ta = a.trackNo ?? 999, tb = b.trackNo ?? 999
        return ta - tb
      })
    })
    return groups
  }, [filtered])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-1">
          <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase" }}>Provided Songs</h1>
        </div>
        <p className="text-sm text-gray-400">小室哲哉作曲・編曲，但非本人監製的樂曲</p>
      </div>

      {/* Top Artists Section */}
      {!loading && topArtists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            提供最多的藝人
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topArtists.map(({ name, count }) => {
              const isSelected = filterArtist === name
              const imgUrl = artistImageMap[name.toLowerCase()]
              return (
                <button
                  key={name}
                  onClick={() => handleArtistClick(name)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all gap-2 ${
                    isSelected
                      ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                      : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Artist image */}
                    <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${isSelected ? 'ring-2 ring-white/50' : 'ring-1 ring-gray-200'}`}>
                      {imgUrl
                        ? <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
                        : <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-400'}`}>
                            {name[0]?.toUpperCase() || '?'}
                          </div>
                      }
                    </div>
                    <span className="text-sm font-medium truncate">{name}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-400'
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
              <Mic2 size={16} className="text-rose-400" />
              <span className="font-semibold text-rose-800">{filterArtist}</span>
              <span className="text-sm text-rose-500">· 共 {filtered.length} 首</span>
            </div>
            <button
              onClick={() => setFilterArtist('')}
              className="p-1 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-400 transition-colors"
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
          <option value="single">實體單曲</option>
          <option value="digital">數位單曲</option>
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
          aria-label="發行日期排序"
          className="form-select sm:w-36"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="asc">發行日期：舊到新</option>
          <option value="desc">發行日期：新到舊</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 mb-3">
        {filterArtist ? `${filterArtist} · ` : ''}共 {filtered.length} 首 / {groupedFiltered.length} 張作品
      </p>

      {/* Song List（同 Charts 的簡潔列表樣式） */}
      {loading ? <LoadingSpinner /> : (
        filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.07)' }}>
            沒有符合條件的結果
          </p>
        ) : (
          <YearTimeline items={filtered} direction={sortOrder} layout="list" renderItem={(song, i) => (
              <div key={song.id || i} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-11 h-11 rounded overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {song.imageUrl
                    ? <img src={song.imageUrl} alt={song.title} className="w-full h-full object-cover" />
                    : <Mic2 size={16} className="text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-900">{song.title}</span>
                    {song.kind && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {getProvidedSongKindLabel(song.kind)}
                      </span>
                    )}
                    {Number(song.oriconPeak) === 1 && (
                      <span className="text-xs text-amber-600">Oricon #1</span>
                    )}
                    {song.youtubeUrl && (
                      <a href={song.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-500">
                        <Youtube size={12} /> MV
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {!filterArtist ? (
                      <button onClick={() => handleArtistClick(song.artistName)} className="hover:text-gray-700 hover:underline">
                        {song.artistName}
                      </button>
                    ) : song.artistName}
                    {song.sourceTitle && <span className="text-gray-300"> · {song.sourceTitle}</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-300 shrink-0 whitespace-nowrap">
                  {formatReleaseDate(song.year, song.month, song.day)}
                </div>
              </div>
            )} />
        )
      )}
    </div>
  )
}
