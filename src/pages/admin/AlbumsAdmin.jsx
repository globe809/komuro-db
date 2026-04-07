import { useState, useMemo } from 'react'
import { Disc3, Plus, Trash2, Edit2, X, Search } from 'lucide-react'
import {
  useCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from '../../hooks/useFirestore'
import ImageUpload from '../../components/ImageUpload'
import TrackListEditor from '../../components/TrackListEditor'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ALBUM_TYPES, MONTHS, getAlbumTypeLabel } from '../../utils/constants'
import { formatReleaseDate } from '../../utils/formatDate'

const EMPTY_FORM = {
  title: '',
  artistName: '',
  year: '',
  month: '',
  day: '',
  albumType: 'studio',
  tracks: [],
  imageUrl: '',
  imagePath: '',
  notes: '',
}

export default function AlbumsAdmin() {
  const { data: albums, loading } = useCollection('albums', 'year', 'desc')
  const { data: artists } = useCollection('artists', 'name', 'asc')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return albums
    const kw = search.toLowerCase()
    return albums.filter(
      (a) =>
        a.title?.toLowerCase().includes(kw) ||
        a.artistName?.toLowerCase().includes(kw)
    )
  }, [albums, search])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (album) => {
    setForm({ ...EMPTY_FORM, ...album, tracks: album.tracks || [] })
    setEditId(album.id)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
  }

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

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
        tracks: form.tracks.filter((t) => t.title?.trim()),
      }
      if (editId) {
        await updateDocument('albums', editId, data)
      } else {
        await addDocument('albums', data)
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此專輯嗎？')) return
    await deleteDocument('albums', id)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Disc3 size={20} className="text-indigo-700" />
          <h1 className="text-xl font-bold text-gray-900">專輯管理</h1>
          <span className="text-sm text-gray-400">（{albums.length}）</span>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} />
          新增專輯
        </button>
      </div>

      {/* 搜尋 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="搜尋專輯名稱或藝人..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-semibold text-gray-900">
                {editId ? '編輯專輯' : '新增專輯'}
              </h2>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
              {/* 封面圖 */}
              <div>
                <label className="form-label">封面圖片</label>
                <ImageUpload
                  folder="albums"
                  currentUrl={form.imageUrl}
                  onUpload={({ url, path }) => {
                    setField('imageUrl', url)
                    setField('imagePath', path)
                  }}
                  onRemove={() => {
                    setField('imageUrl', '')
                    setField('imagePath', '')
                  }}
                />
              </div>

              {/* 專輯名稱 */}
              <div>
                <label className="form-label">專輯名稱 *</label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="專輯名稱"
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
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 發行日期 */}
              <div>
                <label className="form-label">發行日期</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="form-select"
                    value={form.year}
                    onChange={(e) => setField('year', e.target.value)}
                  >
                    <option value="">年份</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={form.month}
                    onChange={(e) => setField('month', e.target.value)}
                  >
                    <option value="">月份</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="日"
                    min="1"
                    max="31"
                    value={form.day}
                    onChange={(e) => setField('day', e.target.value)}
                  />
                </div>
              </div>

              {/* 專輯類型 */}
              <div>
                <label className="form-label">專輯類型</label>
                <select
                  className="form-select"
                  value={form.albumType}
                  onChange={(e) => setField('albumType', e.target.value)}
                >
                  {ALBUM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* 曲目列表 */}
              <div>
                <label className="form-label">曲目列表</label>
                <TrackListEditor
                  tracks={form.tracks}
                  onChange={(tracks) => setField('tracks', tracks)}
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="form-label">備註</label>
                <textarea
                  className="form-input h-20 resize-none"
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="其他說明..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary">
                  取消
                </button>
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
            {filtered.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 rounded bg-indigo-100 overflow-hidden shrink-0">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 size={16} className="text-indigo-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{a.title}</div>
                  <div className="text-xs text-gray-400">
                    {a.artistName} · {formatReleaseDate(a.year, a.month, a.day)} ·{' '}
                    {getAlbumTypeLabel(a.albumType)}
                    {a.tracks?.length > 0 && ` · ${a.tracks.length} 曲`}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
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
