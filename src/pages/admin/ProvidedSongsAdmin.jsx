import { useState, useMemo } from 'react'
import { Mic2, Plus, Trash2, Edit2, X, Search, Image } from 'lucide-react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import LoadingSpinner from '../../components/LoadingSpinner'
import { MONTHS, PROVIDED_SONG_KINDS, getProvidedSongKindLabel } from '../../utils/constants'
import { formatReleaseDate } from '../../utils/formatDate'

const EMPTY_FORM = {
  year: '', month: '', day: '',
  artistName: '',
  title: '',
  kind: 'single',
  lyrics: '',
  composition: '',
  arrangement: '',
  sourceTitle: '',
  discNo: '',
  trackNo: '',
  imageUrl: '',
  notes: '',
}

export default function ProvidedSongsAdmin() {
  const { data: songs, loading } = useCollection('providedSongs', 'year', 'asc')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return songs
    const kw = search.toLowerCase()
    return songs.filter(s =>
      s.title?.toLowerCase().includes(kw) ||
      s.artistName?.toLowerCase().includes(kw)
    )
  }, [songs, search])

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (s) => { setForm({ ...EMPTY_FORM, ...s }); setEditId(s.id); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }
  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

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
        discNo: form.discNo ? Number(form.discNo) : null,
        trackNo: form.trackNo ? Number(form.trackNo) : null,
      }
      if (editId) await updateDocument('providedSongs', editId, data)
      else await addDocument('providedSongs', data)
      closeForm()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此筆資料嗎？')) return
    await deleteDocument('providedSongs', id)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1979 + 1 }, (_, i) => currentYear - i)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mic2 size={20} className="text-rose-600" />
          <h1 className="text-xl font-bold text-gray-900">提供樂曲管理</h1>
          <span className="text-sm text-gray-400">（{songs.length}）</span>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} />新增
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9"
          placeholder="搜尋歌名或藝人..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-semibold">{editId ? '編輯提供樂曲' : '新增提供樂曲'}</h2>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

              {/* 歌名 */}
              <div>
                <label className="form-label">歌名 *</label>
                <input className="form-input" required value={form.title} onChange={e => setField('title', e.target.value)} placeholder="歌曲名稱" />
              </div>

              {/* 藝人 */}
              <div>
                <label className="form-label">藝人</label>
                <input className="form-input" value={form.artistName} onChange={e => setField('artistName', e.target.value)} placeholder="演唱藝人" />
              </div>

              {/* 發行日期 */}
              <div>
                <label className="form-label">發行日期</label>
                <div className="grid grid-cols-3 gap-2">
                  <select className="form-select" value={form.year} onChange={e => setField('year', e.target.value)}>
                    <option value="">年份</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select className="form-select" value={form.month} onChange={e => setField('month', e.target.value)}>
                    <option value="">月份</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <input type="number" className="form-input" placeholder="日" min="1" max="31" value={form.day} onChange={e => setField('day', e.target.value)} />
                </div>
              </div>

              {/* 種別 */}
              <div>
                <label className="form-label">種別</label>
                <select className="form-select" value={form.kind} onChange={e => setField('kind', e.target.value)}>
                  {PROVIDED_SONG_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </div>

              {/* 作詞/作曲/編曲 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">作詞</label>
                  <input className="form-input" value={form.lyrics} onChange={e => setField('lyrics', e.target.value)} placeholder="作詞者" />
                </div>
                <div>
                  <label className="form-label">作曲</label>
                  <input className="form-input" value={form.composition} onChange={e => setField('composition', e.target.value)} placeholder="作曲者" />
                </div>
                <div>
                  <label className="form-label">編曲</label>
                  <input className="form-input" value={form.arrangement} onChange={e => setField('arrangement', e.target.value)} placeholder="編曲者" />
                </div>
              </div>

              {/* 收錄資訊 */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">收錄資訊</p>
                <div>
                  <label className="form-label">收錄單曲／專輯名稱</label>
                  <input className="form-input" value={form.sourceTitle} onChange={e => setField('sourceTitle', e.target.value)} placeholder="例：SPEED 4（收錄於哪張作品）" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Disc No.</label>
                    <input type="number" className="form-input" placeholder="1" min="1" value={form.discNo} onChange={e => setField('discNo', e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">第幾首</label>
                    <input type="number" className="form-input" placeholder="1" min="1" value={form.trackNo} onChange={e => setField('trackNo', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* 圖片 URL */}
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Image size={13} />封面圖片 URL
                </label>
                <input className="form-input" value={form.imageUrl} onChange={e => setField('imageUrl', e.target.value)} placeholder="https://..." />
                {form.imageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* 備註 */}
              <div>
                <label className="form-label">備註</label>
                <textarea className="form-input h-16 resize-none" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="其他說明..." />
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
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">尚無資料</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                {/* 封面縮圖 */}
                <div className="w-10 h-10 rounded bg-rose-50 overflow-hidden shrink-0">
                  {s.imageUrl
                    ? <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Mic2 size={14} className="text-rose-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{s.title}</span>
                    <span className="text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded shrink-0">
                      {getProvidedSongKindLabel(s.kind)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-2 flex-wrap">
                    <span>{s.artistName}</span>
                    {s.sourceTitle && <span>· {s.sourceTitle}</span>}
                    {s.discNo && <span>· D{s.discNo}</span>}
                    {s.trackNo && <span>#{s.trackNo}</span>}
                    <span>· {formatReleaseDate(s.year, s.month, s.day)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
