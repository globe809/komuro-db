import { useRef, useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { useImageUpload } from '../hooks/useStorage'

/**
 * 圖片上傳元件
 * @param {string} folder - Firebase Storage 資料夾名稱
 * @param {string} currentUrl - 目前圖片 URL（若有）
 * @param {function} onUpload - 上傳成功後的回調 ({url, path})
 * @param {function} onRemove - 移除圖片的回調
 */
export default function ImageUpload({ folder, currentUrl, onUpload, onRemove }) {
  const fileRef = useRef()
  const { uploadImage, progress, uploading, error } = useImageUpload(folder)
  const [preview, setPreview] = useState(currentUrl || null)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 本地預覽
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      const result = await uploadImage(file)
      onUpload(result)
    } catch (err) {
      setPreview(currentUrl || null)
      console.error('上傳失敗:', err)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    if (onRemove) onRemove()
  }

  return (
    <div>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="封面"
            className="w-40 h-40 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-400 hover:text-blue-500"
        >
          <ImageIcon size={32} className="mb-2" />
          <span className="text-xs">點擊上傳封面</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {uploading && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>上傳中...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {!preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:underline"
          disabled={uploading}
        >
          <Upload size={12} />
          選擇圖片
        </button>
      )}
    </div>
  )
}
