import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { Video } from 'lucide-react'
import { useCollection } from '../hooks/useFirestore'
import FilterPanel from '../components/FilterPanel'
import VideoWorkCard from '../components/VideoWorkCard'
import LoadingSpinner from '../components/LoadingSpinner'
import YearTimeline from '../components/YearTimeline'
import { VIDEO_FORMATS, VIDEO_TYPES } from '../utils/constants'

export default function VideoWorks() {
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') || '', selectedArtist = params.get('artist') || '', selectedYear = params.get('year') || '', selectedFormat = params.get('type') || '', selectedVideoType = params.get('videoType') || ''
  const setParam = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  const setKeyword = value => setParam('q', value), setSelectedArtist = value => setParam('artist', value), setSelectedYear = value => setParam('year', value), setSelectedFormat = value => setParam('type', value), setSelectedVideoType = value => setParam('videoType', value)

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
      const formats = Array.isArray(w.formats) ? w.formats : w.format ? [w.format] : []
      const matchFormat = !selectedFormat || formats.includes(selectedFormat)
      const matchVideoType = !selectedVideoType || w.videoType === selectedVideoType
      return matchKeyword && matchArtist && matchYear && matchFormat && matchVideoType
    })
  }, [works, keyword, selectedArtist, selectedYear, selectedFormat, selectedVideoType])

  const resetFilters = () => setParams({}, { replace: true })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl sm:text-4xl text-gray-900" style={{ fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Video Works</h1>
        {!loading && (
          <span className="text-sm text-gray-400">
            {filtered.length}{filtered.length !== works.length && ` / ${works.length}`}
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
          selectedType={selectedFormat}
          onTypeChange={setSelectedFormat}
          selectedVideoType={selectedVideoType}
          onVideoTypeChange={setSelectedVideoType}
          artists={artists}
          years={years}
          types={VIDEO_FORMATS}
          videoTypes={VIDEO_TYPES}
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
        <YearTimeline
          kind="video"
          items={filtered}
          renderItem={(work) => <VideoWorkCard key={work.id} work={work} />}
        />
      )}
    </div>
  )
}
