import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import seedSingles from '../../utils/seedSingles.json'
import seedAlbums from '../../utils/seedAlbums.json'

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  let batch = writeBatch(db)
  let count = 0
  const promises = []
  for (const d of snap.docs) {
    batch.delete(d.ref)
    count++
    if (count === 500) { promises.push(batch.commit()); batch = writeBatch(db); count = 0 }
  }
  if (count > 0) promises.push(batch.commit())
  await Promise.all(promises)
}

async function importInBatches(colName, items, onProgress) {
  const BATCH_SIZE = 400
  let done = 0
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    for (const item of chunk) batch.set(doc(collection(db, colName)), item)
    await batch.commit()
    done += chunk.length
    onProgress(Math.round((done / items.length) * 100))
  }
}

export default function ImportAdmin() {
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState(0)
  const [importing, setImporting] = useState('')

  const addLog = (msg) => setLog(l => [...l, msg])

  const handleImportAll = async () => {
    if (!window.confirm(
      `確定要匯入所有資料嗎？\n` +
      `• 單曲：${seedSingles.length} 筆\n` +
      `• 專輯：${seedAlbums.length} 筆\n\n` +
      `現有資料將全部清除並重新匯入。`
    )) return

    setStatus('running'); setLog([]); setProgress(0)

    try {
      // 1. 單曲
      setImporting('singles')
      addLog('🗑️ 清除現有單曲...')
      await clearCollection('singles')
      addLog(`📥 匯入 ${seedSingles.length} 筆單曲...`)
      await importInBatches('singles', seedSingles, setProgress)
      addLog(`✅ 單曲完成（${seedSingles.length} 筆）`)

      // 2. 專輯
      setImporting('albums')
      setProgress(0)
      addLog('🗑️ 清除現有專輯...')
      await clearCollection('albums')
      addLog(`📥 匯入 ${seedAlbums.length} 筆專輯...`)
      await importInBatches('albums', seedAlbums, setProgress)
      addLog(`✅ 專輯完成（${seedAlbums.length} 筆）`)

      // 3. 藝人清單
      setImporting('artists')
      addLog('👥 建立藝人清單...')
      const allArtists = [...new Set([
        ...seedSingles.map(s => s.artistName),
        ...seedAlbums.map(a => a.artistName),
      ].filter(Boolean))]
      await clearCollection('artists')
      const batch = writeBatch(db)
      for (const name of allArtists) batch.set(doc(collection(db, 'artists')), { name })
      await batch.commit()
      addLog(`✅ 藝人清單完成（${allArtists.length} 位）`)

      addLog('🎉 全部完成！')
      setStatus('done')
    } catch (err) {
      addLog(`❌ 錯誤：${err.message}`)
      setStatus('error')
    } finally { setImporting('') }
  }

  const handleImportSingles = async () => {
    if (!window.confirm(`匯入 ${seedSingles.length} 筆單曲？（現有單曲資料將被清除）`)) return
    setStatus('running'); setLog([]); setProgress(0)
    try {
      addLog('🗑️ 清除現有單曲...')
      await clearCollection('singles')
      addLog(`📥 匯入 ${seedSingles.length} 筆單曲...`)
      await importInBatches('singles', seedSingles, setProgress)
      addLog(`✅ 單曲匯入完成！`)
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
  }

  const handleImportAlbums = async () => {
    if (!window.confirm(`匯入 ${seedAlbums.length} 筆專輯？（現有專輯資料將被清除）`)) return
    setStatus('running'); setLog([]); setProgress(0)
    try {
      addLog('🗑️ 清除現有專輯...')
      await clearCollection('albums')
      addLog(`📥 匯入 ${seedAlbums.length} 筆專輯...`)
      await importInBatches('albums', seedAlbums, setProgress)
      addLog(`✅ 專輯匯入完成！`)
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
  }

  const isRunning = status === 'running'

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Upload size={20} className="text-amber-600" />
        <h1 className="text-xl font-bold text-gray-900">資料匯入</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ 注意事項</p>
        <p className="text-amber-700">匯入操作會清除現有資料並重新寫入，請勿重複匯入。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* 全部匯入 */}
        <div className="bg-white rounded-xl border-2 border-amber-300 p-5 shadow-sm sm:col-span-3">
          <h2 className="font-semibold text-gray-800 mb-1">一鍵全部匯入</h2>
          <p className="text-xs text-gray-500 mb-4">
            單曲 {seedSingles.length} 筆 + 專輯 {seedAlbums.length} 筆，同時建立藝人清單
          </p>
          <button onClick={handleImportAll} disabled={isRunning}
            className="btn-gold flex items-center gap-2 disabled:opacity-50">
            {isRunning && importing === '' ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
            全部匯入
          </button>
        </div>

        {/* 單獨匯入單曲 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">僅匯入單曲</h2>
          <p className="text-xs text-gray-400 mb-3">{seedSingles.length} 筆</p>
          <button onClick={handleImportSingles} disabled={isRunning}
            className="btn-primary text-xs disabled:opacity-50 flex items-center gap-1">
            {isRunning && importing === 'singles' ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            匯入單曲
          </button>
        </div>

        {/* 單獨匯入專輯 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">僅匯入專輯</h2>
          <p className="text-xs text-gray-400 mb-3">{seedAlbums.length} 筆（含 61 張曲目）</p>
          <button onClick={handleImportAlbums} disabled={isRunning}
            className="btn-primary text-xs disabled:opacity-50 flex items-center gap-1">
            {isRunning && importing === 'albums' ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            匯入專輯
          </button>
        </div>
      </div>

      {/* 進度條 */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{importing === 'singles' ? '匯入單曲中...' : importing === 'albums' ? '匯入專輯中...' : '處理中...'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3 mb-4">
          <CheckCircle size={18} /><span className="text-sm font-medium">匯入成功！</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={18} /><span className="text-sm font-medium">匯入失敗，請查看下方錯誤訊息。</span>
        </div>
      )}

      {log.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  )
}
