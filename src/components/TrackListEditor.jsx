import { useState } from 'react'
import { Plus, Trash2, Youtube, ChevronDown, ChevronUp } from 'lucide-react'

const emptyTrack = () => ({
  discNo: 1,
  title: '',
  lyrics: '',
  composition: '',
  arrangement: '',
  youtubeUrl: '',
})

export default function TrackListEditor({ tracks = [], onChange }) {
  const [expandedMv, setExpandedMv] = useState(null)

  const handleAdd = () => onChange([...tracks, emptyTrack()])
  const handleRemove = (index) => onChange(tracks.filter((_, i) => i !== index))
  const handleChange = (index, field, value) =>
    onChange(tracks.map((t, i) => (i === index ? { ...t, [field]: value } : t)))

  const discGroups = tracks.reduce((acc, t) => {
    const disc = t.discNo || 1
    acc[disc] = (acc[disc] || 0) + 1
    return acc
  }, {})
  const hasMultipleDiscs = Object.keys(discGroups).length > 1
  const discCounters = {}

  return (
    <div>
      {hasMultipleDiscs && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
          已偵測到多張 Disc，曲目將依 Disc No. 分組顯示
        </p>
      )}

      <div className="space-y-2">
        {tracks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
            尚未新增曲目
          </p>
        )}

        {tracks.map((track, index) => {
          const disc = track.discNo || 1
          discCounters[disc] = (discCounters[disc] || 0) + 1
          const trackLabel = hasMultipleDiscs ? `D${disc}-${discCounters[disc]}` : String(index + 1)
          const isMvOpen = expandedMv === index

          return (
            <div key={index} className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2 p-3">
                <span className="text-xs font-mono text-gray-400 pt-2 w-8 shrink-0 text-center">
                  {trackLabel}
                </span>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2 flex gap-2">
                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        className="form-input text-center"
                        placeholder="Disc"
                        min="1"
                        value={track.discNo || 1}
                        onChange={(e) => handleChange(index, 'discNo', Number(e.target.value) || 1)}
                        title="Disc No."
                      />
                    </div>
                    <input
                      className="form-input flex-1"
                      placeholder="曲目名稱 *"
                      value={track.title}
                      onChange={(e) => handleChange(index, 'title', e.target.value)}
                    />
                  </div>
                  <input className="form-input" placeholder="作詞" value={track.lyrics}
                    onChange={(e) => handleChange(index, 'lyrics', e.target.value)} />
                  <input className="form-input" placeholder="作曲" value={track.composition}
                    onChange={(e) => handleChange(index, 'composition', e.target.value)} />
                  <input className="form-input sm:col-span-2" placeholder="編曲" value={track.arrangement}
                    onChange={(e) => handleChange(index, 'arrangement', e.target.value)} />
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button type="button" onClick={() => setExpandedMv(isMvOpen ? null : index)}
                    className={`p-1.5 rounded transition-colors ${track.youtubeUrl ? 'text-red-500 hover:bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
                    title="YouTube MV">
                    <Youtube size={15} />
                  </button>
                  <button type="button" onClick={() => handleRemove(index)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* YouTube URL 展開欄位 */}
              {isMvOpen && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                  <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Youtube size={12} className="text-red-400" /> YouTube MV 連結
                  </label>
                  <input
                    className="form-input text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={track.youtubeUrl || ''}
                    onChange={(e) => handleChange(index, 'youtubeUrl', e.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button type="button" onClick={handleAdd}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium">
        <Plus size={16} />新增曲目
      </button>
    </div>
  )
}
