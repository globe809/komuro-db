import { Search, X } from 'lucide-react'

/**
 * 通用篩選面板
 * @param {string} keyword - 搜尋關鍵字
 * @param {function} onKeywordChange
 * @param {string} selectedArtist
 * @param {function} onArtistChange
 * @param {string} selectedYear
 * @param {function} onYearChange
 * @param {string} selectedType - 類型（optional）
 * @param {function} onTypeChange
 * @param {Array} artists - 藝人選項 [{value, label}]
 * @param {Array} years - 年份選項
 * @param {Array} types - 類型選項 [{value, label}]（optional）
 * @param {function} onReset - 清除篩選
 */
export default function FilterPanel({
  keyword = '',
  onKeywordChange,
  selectedArtist = '',
  onArtistChange,
  selectedYear = '',
  onYearChange,
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
  const hasFilter = keyword || selectedArtist || selectedYear || selectedType || selectedVideoType

  return (
    <div className="surface p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 關鍵字搜尋 */}
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋名稱、藝人..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="form-input pl-9"
          />
        </div>

        {/* 藝人篩選 */}
        {artists.length > 0 && (
          <select
            value={selectedArtist}
            onChange={(e) => onArtistChange(e.target.value)}
            className="form-select sm:w-40"
          >
            <option value="">所有藝人</option>
            {artists.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        )}

        {/* 年份篩選 */}
        {years.length > 0 && (
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="form-select sm:w-28"
          >
            <option value="">所有年份</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
        )}

        {/* 格式篩選（原 types） */}
        {types.length > 0 && (
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="form-select sm:w-36"
          >
            <option value="">所有格式</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {/* 影像類型篩選 */}
        {videoTypes.length > 0 && (
          <select
            value={selectedVideoType}
            onChange={(e) => onVideoTypeChange(e.target.value)}
            className="form-select sm:w-32"
          >
            <option value="">所有類型</option>
            {videoTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        )}

        {/* 清除篩選 */}
        {hasFilter && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            <X size={14} />
            清除
          </button>
        )}
      </div>
    </div>
  )
}
