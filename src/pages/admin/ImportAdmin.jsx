import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { collection, writeBatch, doc, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import seedSingles from '../../utils/seedSingles.json'

export default function ImportAdmin() {
  const [status, setStatus] = useState('idle') // idle | running | done | error
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState(0)

  const addLog = (msg) => setLog((l) => [...l, msg])

  const clearCollection = async (name) => {
    const snap = await getDocs(collection(db, name))
    const batches = []
    let batch = writeBatch(db)
    let count = 0
    for (const d of snap.docs) {
      batch.delete(d.ref)
      count++
      if (count === 500) {
        batches.push(batch.commit())
        batch = writeBatch(db)
        count = 0
      }
    }
    if (count > 0) batches.push(batch.commit())
    await Promise.all(batches)
  }

  const importInBatches = async (colName, items) => {
    const BATCH_SIZE = 400
    let done = 0
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE)
      const batch = writeBatch(db)
      for (const item of chunk) {
        const ref = doc(collection(db, colName))
        batch.set(ref, item)
      }
      await batch.commit()
      done += chunk.length
      setProgress(Math.round((done / items.length) * 100))
    }
  }

  const handleImport = async () => {
    if (!window.confirm(`確定要匯入 ${seedSingles.length} 筆單曲資料嗎？\n（現有資料將全部清除並重新匯入）`)) return

    setStatus('running')
    setLog([])
    setProgress(0)

    try {
      // 1. 清除現有單曲
      addLog('🗑️ 清除現有單曲資料...')
      await clearCollection('singles')
      addLog('✅ 已清除')

      // 2. 匯入單曲
      addLog(`📥 匯入 ${seedSingles.length} 筆單曲...`)
      await importInBatches('singles', seedSingles)
      addLog(`✅ 單曲匯入完成（${seedSingles.length} 筆）`)

      // 3. 自動建立藝人清單
      addLog('👥 建立藝人清單...')
      const artistNames = [...new Set(seedSingles.map((s) => s.artistName).filter(Boolean))]
      await clearCollection('artists')
      const artistBatch = writeBatch(db)
      for (const name of artistNames) {
        artistBatch.set(doc(collection(db, 'artists')), { name })
      }
      await artistBatch.commit()
      addLog(`✅ 藝人清單建立完成（${artistNames.length} 位）`)

      addLog('🎉 全部完成！')
      setStatus('done')
    } catch (err) {
      addLog(`❌ 錯誤：${err.message}`)
      setStatus('error')
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Upload size={20} className="text-amber-600" />
        <h1 className="text-xl font-bold text-gray-900">資料匯入</h1>
      </div>

      {/* 說明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ 注意事項</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700">
          <li>此操作會清除現有的所有單曲與藝人資料，再重新匯入</li>
          <li>預先載入資料：<strong>{seedSingles.length} 筆單曲</strong>（來自 Excel）</li>
          <li>匯入後可在「單曲管理」與「藝人管理」頁面繼續編輯</li>
        </ul>
      </div>

      {/* 匯入按鈕 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">預載單曲資料</h2>
        <p className="text-xs text-gray-500 mb-4">
          共 {seedSingles.length} 筆，時間範圍：1984 年 ～ 2025 年
        </p>
        <button
          onClick={handleImport}
          disabled={status === 'running'}
          className="btn-gold flex items-center gap-2 disabled:opacity-50"
        >
          {status === 'running' ? (
            <><Loader size={16} className="animate-spin" /> 匯入中...</>
          ) : (
            <><Upload size={16} /> 開始匯入單曲資料</>
          )}
        </button>
      </div>

      {/* 進度 */}
      {status === 'running' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>匯入進度</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 狀態圖示 */}
      {status === 'done' && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">匯入成功！資料已寫入 Firebase。</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">匯入失敗，請查看下方錯誤訊息。</span>
        </div>
      )}

      {/* 執行記錄 */}
      {log.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}
