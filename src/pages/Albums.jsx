import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Disc3, ArrowUpDown } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import AlbumCard from '../components/AlbumCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { ALBUM_TYPES } from '../utils/constants'
import { toSortableDate } from '../utils/formatDate'

const SORT_OPTIONS = [
  { value: 'date_desc', label: '發行日期：新→舊' },
  { value: 'date_asc', label: '發行日期：舊→新' },
  { value: 'sales_desc', label: '銷售量：高→低' },
  { value: 'sales_asc', label: '銷售量：低→高' },
]

export default function Albums() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const selectedArtist = searchParams.get('artist') || ''
  const selectedYear = searchParams.get('year') || ''
  const selectedType = searchParams.get('type') || ''
  const sortBy = searchParams.get('sort') || 'date_desc'

  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  const { data: albums, loading } = useCollection('albums', 'year', 'desc')

  const artists = useMemo(() => {
    const names = [...new Set(albums.map((a) => a.artistName).filter(Boolean))]
    return names.sort().map((n) => ({ value: n, label: n }))
  }, [albums])

  const years = useMemo(() => {
    const ys = [...new Set(albums.map((a) => a.year).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [albums])

  const filtered = useMemo(() => {
    const list = albums.filter((a) => {
      const kw = keyword.toLowerCase()
      const matchKeyword =
        !keyword ||
        a.title?.toLowerCase().includes(kw) ||
        a.artistName?.toLowerCase().includes(kw)
      const matchArtist = !selectedArtist || a.artistName === selectedArtist
      const matchYear = !selectedYear || String(a.year) === String(selectedYear)
      const matchType = !selectedType || a.albumType === selectedType
      return matchKeyword && matchArtist && matchYear && matchType
    })
    return [...list].sort((a, b) => {
      if (sortBy === 'sales_desc' || sortBy === 'sales_asc') {
        const sa = Number(a.salesRecord) || 0
        const sb = Number(b.salesRecord) || 0
        if (sa === 0 && sb === 0) return 0
        if (sa === 0) return 1
        if (sb === 0) return -1
        return sortBy === 'sales_asc' ? sa - sb : sb - sa
      }
      const da = toSortableDate(a.year, a.month, a.day)
      const db = toSortableDate(b.year, b.month, b.day)
      return sortBy === 'date_asc' ? da - db : db - da
    })
  }, [albums, keyword, selectedArtist, selectedYear, selectedType, sortBy])

  const resetFilters = () => setSearchParams({}, { replace: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Disc3 size={22} className="text-indigo-700" />
        <h1 className="text-2xl font-bold text-[#1d1d1f]">專輯</h1>
        {!loading && (
          <span className="text-sm text-[#6e6e73] ml-2">
            共 {filtered.length} 筆{filtered.length !== albums.length && ` / ${albums.length} 筆`}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={15} className="text-[#6e6e73]" />
          <select
            value={sortBy}
            onChange={e => setParam('sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 text-[#1d1d1f]"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <FilterPanel
          keyword={keyword}
          onKeywordChange={(v) => setParam('q', v)}
          selectedArtist={selectedArtist}
          onArtistChange={(v) => setParam('artist', v)}
          selectedYear={selectedYear}
          onYearChange={(v) => setParam('year', v)}
          selectedType={selectedType}
          onTypeChange={(v) => setParam('type', v)}
          artists={artists}
          years={years}
          types={ALBUM_TYPES}
          onReset={resetFilters}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6e6e73]">
          <Disc3 size={48} className="mx-auto mb-3 opacity-30" />
          <p>沒有符合條件的專輯</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  )
}
