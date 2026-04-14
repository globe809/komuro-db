import { useState, useEffect } from 'react'
import { Settings, Save, Image } from 'lucide-react'
import { useDocument, setDocument } from '../../hooks/useFirestore'

export default function SiteConfigAdmin() {
  const { data: config, loading } = useDocument('siteConfig', 'home')
  const [visualArtUrl, setVisualArtUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) setVisualArtUrl(config.visualArtUrl || '')
  }, [config])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setDocument('siteConfig', 'home', { visualArtUrl })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className="text-gray-600" />
        <h1 className="text-xl font-bold text-gray-900">網站設定</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">載入中...</p>
      ) : (
        <form onSubmit={handleSave} className="max-w-xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Image size={15} />
              首頁 Visual Art 橫幅
            </h2>
            <p className="text-xs text-gray-400">
              設定首頁最上方的全寬橫幅圖片，建議使用寬景比例（例如 1920×600）的圖片。
            </p>

            <div>
              <label className="form-label">圖片 URL</label>
              <input
                className="form-input"
                value={visualArtUrl}
                onChange={e => setVisualArtUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {visualArtUrl && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ height: 180 }}>
                <img
                  src={visualArtUrl}
                  alt="預覽"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save size={15} />
              {saving ? '儲存中...' : '儲存設定'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ 已儲存</span>}
          </div>
        </form>
      )}
    </div>
  )
}
