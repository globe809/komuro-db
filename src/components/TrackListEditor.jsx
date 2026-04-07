import { Plus, Trash2, GripVertical } from 'lucide-react'

const emptyTrack = () => ({
  trackNo: '',
  title: '',
  lyrics: '',
  composition: '',
  arrangement: '',
})

/**
 * 曲目列表編輯器（用於專輯後台）
 * @param {Array} tracks - 曲目陣列
 * @param {function} onChange - 資料變更回調
 */
export default function TrackListEditor({ tracks = [], onChange }) {
  const handleAdd = () => {
    onChange([...tracks, emptyTrack()])
  }

  const handleRemove = (index) => {
    const updated = tracks.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleChange = (index, field, value) => {
    const updated = tracks.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    onChange(updated)
  }

  return (
    <div>
      <div className="space-y-3">
        {tracks.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
            尚未新增曲目
          </p>
        )}

        {tracks.map((track, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2">
              <div className="flex items-center gap-1 pt-1 text-gray-400">
                <GripVertical size={14} />
                <span className="text-xs font-mono w-5 text-center">
                  {index + 1}
                </span>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2">
                  <input
                    className="form-input"
                    placeholder="曲目名稱 *"
                    value={track.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                  />
                </div>
                <input
                  className="form-input"
                  placeholder="作詞"
                  value={track.lyrics}
                  onChange={(e) => handleChange(index, 'lyrics', e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="作曲"
                  value={track.composition}
                  onChange={(e) => handleChange(index, 'composition', e.target.value)}
                />
                <input
                  className="form-input sm:col-span-2"
                  placeholder="編曲"
                  value={track.arrangement}
                  onChange={(e) => handleChange(index, 'arrangement', e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded mt-0.5"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium"
      >
        <Plus size={16} />
        新增曲目
      </button>
    </div>
  )
}
