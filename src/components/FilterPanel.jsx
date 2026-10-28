import { Search, X } from 'lucide-react'

export default function FilterPanel({
  keyword = '',
  onKeywordChange,
  selectedArtist = '',
  onArtistChange,
  selectedYear = '',
  onYearChange,
  selectedMonth = '',
  onMonthChange,
  selectedType = '',
  onTypeChange,
  selectedVideoType = '',
  onVideoTypeChange,
  artists = [],
  years = [],
  types = [],
  videoTypes = [],
  onReset,
}) {
  const hasFilter = keyword || selectedArtist || selectedYear || selectedMonth || selectedType || selectedVideoType

  return (
    <div className="flex flex-col sm:flex-row gap-3" style={{ flexWrap: 'wrap' }}>
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋歌名、藝人..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="form-input pl-9"
          />
        </div>

        {artists.length > 0 && (
          <select value={selectedArtist} onChange={(e) => onArtistChange(e.target.value)} className="form-select sm:w-40">
            <option value="">All Artists</option>
            {artists.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        )}

        {(years.length > 0 || onMonthChange) && (
          <select aria-label="發行年份" value={selectedYear} onChange={(e) => onYearChange(e.target.value)} className="form-select sm:w-28">
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {onMonthChange && (
          <select aria-label="發行月份" value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)} className="form-select sm:w-28">
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>
        )}

        {types.length > 0 && (
          <select value={selectedType} onChange={(e) => onTypeChange(e.target.value)} className="form-select sm:w-36">
            <option value="">All Formats</option>
            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}

        {videoTypes.length > 0 && (
          <select value={selectedVideoType} onChange={(e) => onVideoTypeChange(e.target.value)} className="form-select sm:w-32">
            <option value="">All Types</option>
            {videoTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}

        {hasFilter && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <X size={13} />
            Clear
          </button>
        )}
    </div>
  )
}
