import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

/**
 * 影像作品內容列表編輯器（支援多 Disc）
 */
export default function ContentListEditor({ contents = [], onChange }) {
  const handleAdd = () => {
    const lastDisc = contents.length > 0 ? (contents[contents.length - 1].discNo || 1) : 1
    onChange([...contents, { discNo: lastDisc, title: '' }])
  }

  const handleRemove = (index) => {
    onChange(contents.filter((_, i) => i !== index))
  }

  const handleChange = (index, field, value) => {
    onChange(contents.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  // Detect multiple discs
  const discNums = [...new Set(contents.map(c => c.discNo || 1))]
  const hasMultipleDiscs = discNums.length > 1
  const discCounters = {}

  return (
    <div>
      {hasMultipleDiscs && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-3">
          已偵測到多張 Disc，內容將依 Disc No. 分組顯示
        </p>
      )}

      <div className="space-y-2">
        {contents.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
            尚未新增內容
          </p>
        )}

        {contents.map((item, index) => {
          const disc = item.discNo || 1
          discCounters[disc] = (discCounters[disc] || 0) + 1
          const label = hasMultipleDiscs ? `D${disc}-${discCounters[disc]}` : String(index + 1)

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono w-8 text-right shrink-0">{label}</span>
              {/* Disc No. */}
              <input
                type="number"
                className="form-input w-16 text-center shrink-0"
                placeholder="Disc"
                min="1"
                value={item.discNo || 1}
                onChange={(e) => handleChange(index, 'discNo', Number(e.target.value) || 1)}
                title="Disc No."
              />
              <input
                className="form-input flex-1"
                placeholder="內容名稱"
                value={item.title}
                onChange={(e) => handleChange(index, 'title', e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-3 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium"
      >
        <Plus size={16} />
        新增內容
      </button>
    </div>
  )
}
