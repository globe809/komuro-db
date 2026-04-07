import { useState } from 'react'
import { Users, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useCollection, addDocument, updateDocument, deleteDocument } from '../../hooks/useFirestore'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ArtistsAdmin() {
  const { data: artists, loading } = useCollection('artists', 'name', 'asc')
  const [newName, setNewName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      await addDocument('artists', { name })
      setNewName('')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (artist) => {
    setEditId(artist.id)
    setEditName(artist.name)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      await updateDocument('artists', editId, { name: editName.trim() })
      setEditId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這個藝人嗎？')) return
    await deleteDocument('artists', id)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users size={20} className="text-teal-700" />
        <h1 className="text-xl font-bold text-gray-900">藝人管理</h1>
      </div>

      {/* 新增 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">新增藝人</h2>
        <div className="flex gap-2">
          <input
            className="form-input flex-1"
            placeholder="藝人名稱（例：globe）"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim()}
            className="btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus size={15} />
            新增
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          藝人列表（{artists.length}）
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : artists.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">尚未新增藝人</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {artists.map((artist) => (
              <div key={artist.id} className="flex items-center gap-3 px-5 py-3">
                {editId === artist.id ? (
                  <>
                    <input
                      className="form-input flex-1"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <button onClick={handleSaveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium text-gray-800">{artist.name}</span>
                    <button
                      onClick={() => handleEdit(artist)}
                      className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(artist.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
