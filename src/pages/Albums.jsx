import { useState, useMemo } from 'react'
import { Disc3 } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import AlbumCard from '../components/AlbumCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { ALBUM_TYPES } from '../utils/constants'

export default function Albums() {
  const [keyword, setKeyword] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedType, setSelectedType] = useState('')

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
    return albums.filter((a) => {
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
  }, [albums, keyword, selectedArtist, selectedYear, selectedType])

  const resetFilters = () => {
    setKeyword('')
    setSelectedArtist('')
    setSelectedYear('')
    setSelectedType('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Disc3 size={22} className="text-indigo-700" />
        <h1 className="text-2xl font-bold text-gray-900">專輯</h1>
        {!loading && (
          <span className="text-sm text-gray-400 ml-2">
            共 {filtered.length} 筆{filtered.length !== albums.length && ` / ${albums.length} 筆`}
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
          types={ALBUM_TYPES}
          onReset={resetFilters}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
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
