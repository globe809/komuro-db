import { useState, useMemo } from 'react'
import { Video } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import VideoWorkCard from '../components/VideoWorkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { VIDEO_FORMATS } from '../utils/constants'

export default function VideoWorks() {
  const [keyword, setKeyword] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')

  const { data: works, loading } = useCollection('videoWorks', 'year', 'desc')

  const artists = useMemo(() => {
    const names = [...new Set(works.map((w) => w.artistName).filter(Boolean))]
    return names.sort().map((n) => ({ value: n, label: n }))
  }, [works])

  const years = useMemo(() => {
    const ys = [...new Set(works.map((w) => w.year).filter(Boolean))]
    return ys.sort((a, b) => b - a)
  }, [works])

  const filtered = useMemo(() => {
    return works.filter((w) => {
      const kw = keyword.toLowerCase()
      const matchKeyword =
        !keyword ||
        w.title?.toLowerCase().includes(kw) ||
        w.artistName?.toLowerCase().includes(kw)
      const matchArtist = !selectedArtist || w.artistName === selectedArtist
      const matchYear = !selectedYear || String(w.year) === String(selectedYear)
      const matchType = !selectedType || w.format === selectedType
      return matchKeyword && matchArtist && matchYear && matchType
    })
  }, [works, keyword, selectedArtist, selectedYear, selectedType])

  const resetFilters = () => {
    setKeyword('')
    setSelectedArtist('')
    setSelectedYear('')
    setSelectedType('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Video size={22} className="text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">影像作品</h1>
        {!loading && (
          <span className="text-sm text-gray-400 ml-2">
            共 {filtered.length} 筆{filtered.length !== works.length && ` / ${works.length} 筆`}
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
          types={VIDEO_FORMATS}
          onReset={resetFilters}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Video size={48} className="mx-auto mb-3 opacity-30" />
          <p>沒有符合條件的影像作品</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((work) => (
            <VideoWorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  )
}
