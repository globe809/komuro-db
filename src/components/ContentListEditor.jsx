import { Plus, Trash2 } from 'lucide-react'

/**
 * 影像作品內容列表編輯器
 */
export default function ContentListEditor({ contents = [], onChange }) {
  const handleAdd = () => {
    onChange([...contents, { title: '' }])
  }

  const handleRemove = (index) => {
    onChange(contents.filter((_, i) => i !== index))
  }

  const handleChange = (index, value) => {
    onChange(contents.map((c, i) => (i === index ? { ...c, title: value } : c)))
  }

  return (
    <div>
      <div className="space-y-2">
        {contents.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
            尚未新增內容
          </p>
        )}

        {contents.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono w-6 text-right shrink-0">
              {index + 1}.
            </span>
            <input
              className="form-input flex-1"
              placeholder="內容名稱"
              value={item.title}
              onChange={(e) => handleChange(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
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
