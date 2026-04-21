import { useState, useMemo } from 'react'
import { Video, Plus, Trash2, Edit2, X, Search } from 'lucide-react'
import {
  useCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from '../../hooks/useFirestore'
import ContentListEditor from '../../components/ContentListEditor'
import LoadingSpinner from '../../components/LoadingSpinner'
import { VIDEO_FORMATS, VIDEO_TYPES, getVideoTypeLabel, MONTHS } from '../../utils/constants'
import { formatReleaseDate } from '../../utils/formatDate'

const EMPTY_FORM = {
  title: '',
  artistName: '',
  year: '',
  month: '',
  day: '',
  videoType: '',    // 類型：演唱會 / MV / 紀錄片 / BOX
  formats: [],      // array of format values
  contents: [],
  imageUrl: '',
  imagePath: '',
  notes: '',
}

export default function VideoWorksAdmin() {
  const { data: works, loading } = useCollection('videoWorks', 'year', 'desc')
  const { data: artists } = useCollection('artists', 'name', 'asc')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return works
    const kw = search.toLowerCase()
    return works.filter(
      (w) =>
        w.title?.toLowerCase().includes(kw) ||
        w.artistName?.toLowerCase().includes(kw)
    )
  }, [works, search])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (work) => {
    // Backward-compat: old data may have format (string) instead of formats (array)
    const formats = Array.isArray(work.formats)
      ? work.formats
      : work.format
      ? [work.format]
      : []
    setForm({ ...EMPTY_FORM, ...work, formats, contents: work.contents || [] })
    setEditId(work.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const toggleFormat = (value) => {
    setForm(f => {
      const cur = f.formats || []
      return { ...f, formats: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const data = {
        ...form,
        year: form.year ? Number(form.year) : null,
        month: form.month ? Number(form.month) : null,
        day: form.day ? Number(form.day) : null,
        contents: form.contents.filter((c) => c.title?.trim()),
      }
      if (editId) {
        await updateDocument('videoWorks', editId, data)
      } else {
        await addDocument('videoWorks', data)
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此影像作品嗎？')) return
    await deleteDocument('videoWorks', id)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i)

  // Display label for format(s)
  const formatLabel = (work) => {
    const fmts = Array.isArray(work.formats) ? work.formats : work.format ? [work.format] : []
    return fmts.join(' / ') || '-'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Video size={20} className="text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">影像作品管理</h1>
          <span className="text-sm text-gray-400">（{works.length}）</span>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} />
          新增影像作品
        </button>
      </div>

      {/* 搜尋 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="搜尋影像作品名稱或藝人..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-semibold text-gray-900">
                {editId ? '編輯影像作品' : '新增影像作品'}
              </h2>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
              {/* 封面圖 URL */}
              <div>
                <label className="form-label">封面圖片 URL</label>
                <input
                  className="form-input"
                  value={form.imageUrl}
                  onChange={e => setField('imageUrl', e.target.value)}
                  placeholder="https://..."
                />
                {form.imageUrl && (
                  <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover"
                      onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>

              {/* 名稱 */}
              <div>
                <label className="form-label">作品名稱 *</label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="影像作品名稱"
                />
              </div>

              {/* 藝人 */}
              <div>
                <label className="form-label">藝人</label>
                <select
                  className="form-select"
                  value={form.artistName}
                  onChange={(e) => setField('artistName', e.target.value)}
                >
                  <option value="">請選擇藝人</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* 類型 */}
              <div>
                <label className="form-label">類型</label>
                <select
                  className="form-select"
                  value={form.videoType}
                  onChange={(e) => setField('videoType', e.target.value)}
                >
                  <option value="">請選擇類型</option>
                  {VIDEO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* 發行日期 */}
              <div>
                <label className="form-label">發行日期</label>
                <div className="grid grid-cols-3 gap-2">
                  <select className="form-select" value={form.year} onChange={(e) => setField('year', e.target.value)}>
                    <option value="">年份</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select className="form-select" value={form.month} onChange={(e) => setField('month', e.target.value)}>
                    <option value="">月份</option>
                    {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input type="number" className="form-input" placeholder="日" min="1" max="31"
                    value={form.day} onChange={(e) => setField('day', e.target.value)} />
                </div>
              </div>

              {/* 格式（複選） */}
              <div>
                <label className="form-label">格式（可複選）</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {VIDEO_FORMATS.map((f) => {
                    const checked = (form.formats || []).includes(f.value)
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => toggleFormat(f.value)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          checked
                            ? 'bg-blue-800 border-blue-800 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
                {(form.formats || []).length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">請至少選擇一種格式</p>
                )}
              </div>

              {/* 內容列表 */}
              <div>
                <label className="form-label">收錄內容</label>
                <ContentListEditor
                  contents={form.contents}
                  onChange={(contents) => setField('contents', contents)}
                />
              </div>

              {/* Credit */}
              <div>
                <label className="form-label">Credit（製作人員）</label>
                <textarea
                  className="form-input h-24 resize-y"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="製作人員名單、版權資訊等..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">取消</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? '儲存中...' : editId ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">尚無資料</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((w) => (
              <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                  {w.imageUrl ? (
                    <img src={w.imageUrl} alt={w.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={16} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{w.title}</div>
                  <div className="text-xs text-gray-400">
                    {w.artistName} · {formatReleaseDate(w.year, w.month, w.day)} · {formatLabel(w)}
                    {w.videoType && ` · ${getVideoTypeLabel(w.videoType)}`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(w)} className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(w.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
