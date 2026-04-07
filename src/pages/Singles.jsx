import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Music } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import SingleCard from '../components/SingleCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { SINGLE_TYPES } from '../utils/constants'

export default function Singles() {
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const { data: singles, loading } = useCollection('singles', 'year', 'desc')

  // 取得藝人清單
  const artists = useMemo(() => {
    const names = [...new Set(singles.map((s) => s.artistName).filter(Boolean))]
    return names.sort().map((n) => ({ value: n, label: n }))
  }, [singles])

  // 取得年份清單
  const years = useMemo(() => {
    const ys = [...new Set(singles.map((s) => s.year).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [singles])

  // 篩選邏輯
  const filtered = useMemo(() => {
    return singles.filter((s) => {
      const kw = keyword.toLowerCase()
      const matchKeyword =
        !keyword ||
        s.title?.toLowerCase().includes(kw) ||
        s.artistName?.toLowerCase().includes(kw) ||
        s.lyrics?.toLowerCase().includes(kw) ||
        s.composition?.toLowerCase().includes(kw)
      const matchArtist = !selectedArtist || s.artistName === selectedArtist
      const matchYear = !selectedYear || String(s.year) === String(selectedYear)
      const matchType = !selectedType || s.type === selectedType
      return matchKeyword && matchArtist && matchYear && matchType
    })
  }, [singles, keyword, selectedArtist, selectedYear, selectedType])

  const resetFilters = () => {
    setKeyword('')
    setSelectedArtist('')
    setSelectedYear('')
    setSelectedType('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Music size={22} className="text-blue-800" />
        <h1 className="text-2xl font-bold text-gray-900">單曲</h1>
        {!loading && (
          <span className="text-sm text-gray-400 ml-2">
            共 {filtered.length} 筆{filtered.length !== singles.length && ` / ${singles.length} 筆`}
          </span>
        )}
      </div>

      <div className="mb-6">
        <FilterPanel
          keyword={keyword}
          onKeywordChange={setKeyword}
          selectedArtist={selectedArtist}
          onArtistChange={setSelectedArtist}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((single) => (
            <SingleCard key={single.id} single={single} />
          ))}
        </div>
      )}
    </div>
  )
}
