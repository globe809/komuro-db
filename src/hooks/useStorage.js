import { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

/**
 * 上傳圖片到 Firebase Storage
 * @param {string} folder - 資料夾名稱（如 'singles', 'albums'）
 */
export function useImageUpload(folder = 'images') {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const uploadImage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('請選擇圖片'))
        return
      }
      const ext = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      setUploading(true)
      setError(null)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          setProgress(pct)
        },
        (err) => {
          setError(err.message)
          setUploading(false)
          reject(err)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          setUploading(false)
          setProgress(100)
          resolve({ url, path: fileName })
        }
      )
    })
  }

  const deleteImage = async (path) => {
    if (!path) return
    try {
      await deleteObject(ref(storage, path))
    } catch (err) {
      console.warn('刪除圖片失敗（可能已不存在）:', err.message)
    }
  }

  return { uploadImage, deleteImage, progress, uploading, error }
}
