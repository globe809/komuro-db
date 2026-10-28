import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Music, ArrowUpDown } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import SingleCard from '../components/SingleCard'
import LoadingSpinner from '../components/LoadingSpinner'
import YearTimeline from '../components/YearTimeline'
import { SINGLE_TYPES } from '../utils/constants'
import { toSortableDate } from '../utils/formatDate'

const SORT_OPTIONS = [
  { value: 'date_desc', label: '發行日期：新→舊' },
  { value: 'date_asc', label: '發行日期：舊→新' },
  { value: 'sales_desc', label: '同年份銷售量：高→低' },
  { value: 'sales_asc', label: '同年份銷售量：低→高' },
]

export default function Singles() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('q') || ''
  const selectedArtist = searchParams.get('artist') || ''
  const selectedYear = searchParams.get('year') || ''
  const selectedMonth = searchParams.get('month') || ''
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

  const { data: singles, loading } = useCollection('singles', 'year', 'desc')

  const artists = useMemo(() => {
    const names = [...new Set(singles.map((s) => s.artistName).filter(Boolean))]
    return names.sort().map((n) => ({ value: n, label: n }))
  }, [singles])

  const years = useMemo(() => {
    const ys = [...new Set(singles.map((s) => s.year).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [singles])

  const filtered = useMemo(() => {
    let result = singles.filter((s) => {
      const kw = keyword.toLowerCase()
      const matchKeyword =
        !keyword ||
        s.title?.toLowerCase().includes(kw) ||
        s.artistName?.toLowerCase().includes(kw) ||
        s.lyrics?.toLowerCase().includes(kw) ||
        s.composition?.toLowerCase().includes(kw)
      const matchArtist = !selectedArtist || s.artistName === selectedArtist
      const matchYear = !selectedYear || String(s.year) === String(selectedYear)
      const matchMonth = !selectedMonth || Number(s.month) === Number(selectedMonth)
      const matchType = !selectedType || s.type === selectedType
      return matchKeyword && matchArtist && matchYear && matchMonth && matchType
    })

    result = [...result].sort((a, b) => {
      if (sortBy === 'sales_desc' || sortBy === 'sales_asc') {
        const sa = Number(a.salesRecord) || 0
        const sb = Number(b.salesRecord) || 0
        // Items with no sales data go to the bottom regardless of direction
        if (sa === 0 && sb === 0) return 0
        if (sa === 0) return 1
        if (sb === 0) return -1
        return sortBy === 'sales_asc' ? sa - sb : sb - sa
      }
      const da = toSortableDate(a.year, a.month, a.day)
      const db = toSortableDate(b.year, b.month, b.day)
      return sortBy === 'date_asc' ? da - db : db - da
    })

    return result
  }, [singles, keyword, selectedArtist, selectedYear, selectedMonth, selectedType, sortBy])

  const resetFilters = () => setSearchParams({}, { replace: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Singles</h1>
        {!loading && (
          <span className="text-sm text-gray-400">
            {filtered.length}{filtered.length !== singles.length && ` / ${singles.length}`}
          </span>
        )}
        {/* 排序 */}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown size={14} className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setParam('sort', e.target.value)}
            className="form-select text-xs py-1.5 w-40"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
          selectedMonth={selectedMonth}
          onMonthChange={(v) => setParam('month', v)}
          selectedType={selectedType}
          onTypeChange={(v) => setParam('type', v)}
          artists={artists}
          years={years}
          types={SINGLE_TYPES}
          onReset={resetFilters}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Music size={48} className="mx-auto mb-3 opacity-30" />
          <p>沒有符合條件的單曲</p>
        </div>
      ) : (
        <YearTimeline
          items={filtered}
          direction={sortBy === 'date_asc' ? 'asc' : 'desc'}
          renderItem={(single) => <SingleCard key={single.id} single={single} />}
        />
      )}
    </div>
  )
}
