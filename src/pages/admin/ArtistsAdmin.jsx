import { useState } from 'react'
import { Users, Plus, Trash2, Edit2, X, UserPlus, Image } from 'lucide-react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import LoadingSpinner from '../../components/LoadingSpinner'

const EMPTY_MEMBER = { name: '', photoUrl: '' }

const EMPTY_FORM = {
  name: '',
  visualArtUrl: '',
  bio: '',
  members: [],
}

export default function ArtistsAdmin() {
  const { data: artists, loading } = useCollection('artists', 'name', 'asc')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  const openEdit = (a) => {
    setForm({ ...EMPTY_FORM, ...a, members: a.members || [] })
    setEditId(a.id)
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }
  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Member helpers
  const addMember = () => setForm(f => ({ ...f, members: [...f.members, { ...EMPTY_MEMBER }] }))
  const removeMember = (i) => setForm(f => ({ ...f, members: f.members.filter((_, idx) => idx !== i) }))
  const setMemberField = (i, field, value) =>
    setForm(f => ({
      ...f,
      members: f.members.map((m, idx) => idx === i ? { ...m, [field]: value } : m),
    }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = {
        ...form,
        name: form.name.trim(),
        members: form.members.filter(m => m.name.trim()),
      }
      if (editId) await updateDocument('artists', editId, data)
      else await addDocument('artists', data)
      closeForm()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這個藝人嗎？')) return
    await deleteDocument('artists', id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-teal-700" />
          <h1 className="text-xl font-bold text-gray-900">藝人管理</h1>
          <span className="text-sm text-gray-400">（{artists.length}）</span>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} />新增藝人
        </button>
      </div>

      {/* 表單 Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-semibold">{editId ? '編輯藝人' : '新增藝人'}</h2>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

              {/* 藝人名稱 */}
              <div>
                <label className="form-label">藝人名稱 *</label>
                <input
                  className="form-input"
                  required
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="例：globe、TRF、安室奈美恵"
                />
              </div>

              {/* Visual Art 圖片 URL */}
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Image size={13} />
                  藝人 Visual Art 圖片（URL）
                </label>
                <input
                  className="form-input"
                  value={form.visualArtUrl}
                  onChange={e => setField('visualArtUrl', e.target.value)}
                  placeholder="https://..."
                />
                {form.visualArtUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden h-28 bg-gray-100">
                    <img src={form.visualArtUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* 藝人簡介 */}
              <div>
                <label className="form-label">藝人簡介</label>
                <textarea
                  className="form-input h-24 resize-none"
                  value={form.bio}
                  onChange={e => setField('bio', e.target.value)}
                  placeholder="簡短介紹這個藝人..."
                />
              </div>

              {/* 團員 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">團員／成員</label>
                  <button
                    type="button"
                    onClick={addMember}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <UserPlus size={13} />新增成員
                  </button>
                </div>

                {form.members.length === 0 && (
                  <p className="text-xs text-gray-400 py-2">尚未新增成員（適合個人藝人可略過）</p>
                )}

                <div className="space-y-3">
                  {form.members.map((member, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      {/* 大頭照預覽 */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                        {member.photoUrl
                          ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                        }
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          className="form-input text-sm"
                          placeholder="成員名稱"
                          value={member.name}
                          onChange={e => setMemberField(i, 'name', e.target.value)}
                        />
                        <input
                          className="form-input text-sm"
                          placeholder="大頭照 URL（https://...）"
                          value={member.photoUrl}
                          onChange={e => setMemberField(i, 'photoUrl', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(i)}
                        className="p-1 text-gray-400 hover:text-red-500 mt-1"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
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
        <div className="px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          藝人列表（{artists.length}）
        </div>

        {loading ? <LoadingSpinner /> : artists.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">尚未新增藝人</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {artists.map((artist) => (
              <div key={artist.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                {/* Visual art thumbnail */}
                <div className="w-12 h-8 rounded overflow-hidden bg-gray-100 shrink-0">
                  {artist.visualArtUrl
                    ? <img src={artist.visualArtUrl} alt={artist.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Image size={14} className="text-gray-300" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{artist.name}</div>
                  <div className="text-xs text-gray-400 flex gap-3">
                    {artist.members?.length > 0 && <span>{artist.members.length} 位成員</span>}
                    {artist.bio && <span className="truncate max-w-xs">{artist.bio.slice(0, 40)}...</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(artist)} className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(artist.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
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
