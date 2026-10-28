import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react'
import { collection, writeBatch, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { deduplicateImport, duplicateGroups, findDuplicateCandidates } from '../../utils/dataQuality'
import seedSingles from '../../utils/seedSingles.json'
import seedAlbums from '../../utils/seedAlbums.json'
import seedProvidedSongs from '../../utils/seedProvidedSongs.json'

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
  items = deduplicateImport(items).unique
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

/**
 * 只更新 tracks 欄位，保留 Firestore 中其他所有欄位（封面圖、YouTube 連結等）。
 * 比對方式：artistName + title 正規化後相符。
 */
const normKey = (s) => (s || '').replace(/[\s　]/g, '').toLowerCase()

async function patchTracksOnly(colName, seedItems, onProgress) {
  seedItems = deduplicateImport(seedItems).unique
  const seedVersionKey = item => [normKey(item.artistName), normKey(item.title), Number(item.year) || '', Number(item.month) || '', Number(item.day) || ''].join('\u0000')
  const seedVersionCounts = new Map()
  for (const seed of seedItems) seedVersionCounts.set(seedVersionKey(seed), (seedVersionCounts.get(seedVersionKey(seed)) || 0) + 1)
  // 1. 讀取 Firestore 現有文件
  const snap = await getDocs(collection(db, colName))
  const fsDocs = snap.docs.map(d => ({ ref: d.ref, data: d.data() }))

  let updated = 0, skipped = 0, notFound = 0, ambiguous = 0
  const missed = []

  for (let i = 0; i < seedItems.length; i++) {
    const seed = seedItems[i]
    if (seedVersionCounts.get(seedVersionKey(seed)) > 1) { ambiguous++; onProgress(Math.round(((i+1)/seedItems.length)*100)); continue }
    // 沒有 tracks 資料就略過
    if (!seed.tracks || seed.tracks.length === 0) { skipped++; onProgress(Math.round(((i+1)/seedItems.length)*100)); continue }

    const seedArtist = normKey(seed.artistName)
    const seedTitle  = normKey(seed.title)

    const matches = fsDocs.filter(d =>
      normKey(d.data.artistName) === seedArtist &&
      normKey(d.data.title) === seedTitle &&
      ['year', 'month', 'day'].every(key => !seed[key] || Number(d.data[key]) === Number(seed[key]))
    )

    if (matches.length > 1) {
      ambiguous++; onProgress(Math.round(((i+1)/seedItems.length)*100)); continue
    }
    const match = matches[0]
    if (match) {
      await updateDoc(match.ref, { tracks: seed.tracks })
      updated++
    } else {
      notFound++
      missed.push(`${seed.artistName} - ${seed.title}`)
    }
    onProgress(Math.round(((i+1)/seedItems.length)*100))
  }
  return { updated, skipped, notFound, missed, ambiguous }
}

export default function ImportAdmin() {
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState(0)
  const [importing, setImporting] = useState('')
  const [preflight, setPreflight] = useState([])

  const addLog = (msg) => setLog(l => [...l, msg])

  const inspectImportSets = async (sets) => {
    setStatus('checking')
    try {
      const reports = await Promise.all(sets.map(async ([name, label, items]) => {
        const existing = (await getDocs(collection(db, name))).docs.map(item => ({ id: item.id, ...item.data() }))
        const { unique, duplicates } = deduplicateImport(items)
        const versions = duplicateGroups(unique)
        const existingMatches = unique.filter(item => findDuplicateCandidates(item, existing).length).length
        return { name, label, total: items.length, unique: unique.length, duplicates: duplicates.length, versions: versions.length, existingMatches, examples: versions.slice(0, 5).map(group => `${group[0].artistName} / ${group[0].title}（${group.length} 版本）`) }
      }))
      setPreflight(reports)
      setStatus('idle')
      return '匯入前檢查：\n' + reports.map(report => `${report.label}：${report.unique} 筆；略過 ${report.duplicates} 筆完全重複；${report.versions} 組同名版本保留；${report.existingMatches} 筆與現有資料同名。`).join('\n') + '\n\n'
    } catch (error) {
      setStatus('error'); addLog(`檢查失敗，尚未寫入：${error.message}`); return null
    }
  }

  const handleImportAll = async () => {
    const review = await inspectImportSets([['singles', '單曲', seedSingles], ['albums', '專輯', seedAlbums], ['providedSongs', '提供樂曲', seedProvidedSongs]])
    if (review === null) return
    if (!window.confirm(review +
      `確定要匯入所有資料嗎？\n` +
      `• 單曲：${seedSingles.length} 筆\n` +
      `• 專輯：${seedAlbums.length} 筆\n` +
      `• 提供樂曲：${seedProvidedSongs.length} 筆\n\n` +
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

      // 3. 提供樂曲
      setImporting('providedSongs')
      setProgress(0)
      addLog('🗑️ 清除現有提供樂曲...')
      await clearCollection('providedSongs')
      addLog(`📥 匯入 ${seedProvidedSongs.length} 筆提供樂曲...`)
      await importInBatches('providedSongs', seedProvidedSongs, setProgress)
      addLog(`✅ 提供樂曲完成（${seedProvidedSongs.length} 筆）`)

      // 4. 藝人清單
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
    const review = await inspectImportSets([['singles', '單曲', seedSingles]])
    if (review === null) return
    if (!window.confirm(review + `匯入 ${seedSingles.length} 筆單曲？（現有單曲資料將被清除）`)) return
    setStatus('running'); setLog([]); setProgress(0); setImporting('singles')
    try {
      addLog('🗑️ 清除現有單曲...')
      await clearCollection('singles')
      addLog(`📥 匯入 ${seedSingles.length} 筆單曲...`)
      await importInBatches('singles', seedSingles, setProgress)
      addLog(`✅ 單曲匯入完成！`)
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
    finally { setImporting('') }
  }

  const handleImportAlbums = async () => {
    const review = await inspectImportSets([['albums', '專輯', seedAlbums]])
    if (review === null) return
    if (!window.confirm(review + `匯入 ${seedAlbums.length} 筆專輯？（現有專輯資料將被清除）`)) return
    setStatus('running'); setLog([]); setProgress(0); setImporting('albums')
    try {
      addLog('🗑️ 清除現有專輯...')
      await clearCollection('albums')
      addLog(`📥 匯入 ${seedAlbums.length} 筆專輯...`)
      await importInBatches('albums', seedAlbums, setProgress)
      addLog(`✅ 專輯匯入完成！`)
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
    finally { setImporting('') }
  }

  const handleImportProvidedSongs = async () => {
    const review = await inspectImportSets([['providedSongs', '提供樂曲', seedProvidedSongs]])
    if (review === null) return
    if (!window.confirm(review + `匯入 ${seedProvidedSongs.length} 筆提供樂曲？（現有資料將被清除）`)) return
    setStatus('running'); setLog([]); setProgress(0); setImporting('providedSongs')
    try {
      addLog('🗑️ 清除現有提供樂曲...')
      await clearCollection('providedSongs')
      addLog(`📥 匯入 ${seedProvidedSongs.length} 筆提供樂曲...`)
      await importInBatches('providedSongs', seedProvidedSongs, setProgress)
      addLog(`✅ 提供樂曲匯入完成！`)
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
    finally { setImporting('') }
  }

  const handlePatchTracks = async () => {
    if (!window.confirm(
      `只更新曲目資料（tracks），不影響封面圖、YouTube 連結等其他欄位。\n\n` +
      `• 單曲：${seedSingles.length} 筆\n• 專輯：${seedAlbums.length} 筆\n\n繼續？`
    )) return
    setStatus('running'); setLog([]); setProgress(0); setImporting('patch')
    try {
      addLog('🎵 比對並更新單曲曲目...')
      const r1 = await patchTracksOnly('singles', seedSingles, setProgress)
      addLog(`✅ 單曲：更新 ${r1.updated}、略過（無曲目）${r1.skipped}、找不到 ${r1.notFound}、同名多版本略過 ${r1.ambiguous}`)
      if (r1.missed.length) addLog(`   找不到：${r1.missed.slice(0,5).join('、')}${r1.missed.length>5?'…':''}`)

      setProgress(0)
      addLog('💿 比對並更新專輯曲目...')
      const r2 = await patchTracksOnly('albums', seedAlbums, setProgress)
      addLog(`✅ 專輯：更新 ${r2.updated}、略過（無曲目）${r2.skipped}、找不到 ${r2.notFound}、同名多版本略過 ${r2.ambiguous}`)

      addLog('🎉 曲目更新完成！其他欄位未受影響。')
      setStatus('done')
    } catch (err) { addLog(`❌ ${err.message}`); setStatus('error') }
    finally { setImporting('') }
  }

  const isRunning = status === 'running' || status === 'checking'

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Upload size={20} className="text-gray-400" />
        <h1 className="text-xl text-gray-900" style={{ fontWeight: 400 }}>資料匯入</h1>
      </div>

      <div className="card p-5 mb-5">
        <h2 className="text-sm text-gray-900 mb-2">匯入前重複檢查</h2>
        <p className="text-xs text-gray-500 mb-3">先檢查 seed 與現有資料。完全相同的重複記錄只匯入一次；日期、格式或內容不同的版本會保留。</p>
        <button type="button" disabled={isRunning} className="btn-secondary disabled:opacity-50" onClick={() => inspectImportSets([['singles', '單曲', seedSingles], ['albums', '專輯', seedAlbums], ['providedSongs', '提供樂曲', seedProvidedSongs]])}>{status === 'checking' ? '檢查中…' : '只檢查，不匯入'}</button>
        {preflight.map(report => <div key={report.name} className="text-xs text-gray-600 mt-4"><p className="font-medium">{report.label}：{report.total} 筆 → 實際匯入 {report.unique} 筆</p><p>完全重複 {report.duplicates} 筆 · 同名版本 {report.versions} 組 · 與現有資料同名 {report.existingMatches} 筆</p>{report.examples.map(example => <p key={example} className="mt-1 text-amber-800">{example}</p>)}</div>)}
      </div>

      {/* ── 安全：只更新曲目 ── */}
      <div className="bg-white rounded-xl border-2 border-green-400 p-5 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={16} className="text-green-600" />
          <h2 className="font-semibold text-gray-800">只更新曲目（推薦）</h2>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">安全</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          只把 seed 裡的 <code className="bg-gray-100 px-1 rounded">tracks</code> 資料同步到 Firestore，
          封面圖、YouTube 連結、手動編輯的欄位<strong>完全不受影響</strong>。
        </p>
        <button onClick={handlePatchTracks} disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 hover:bg-green-100 text-green-800 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors">
          {isRunning && importing === 'patch' ? <Loader size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          只更新曲目
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ 以下為完整匯入（危險）</p>
        <p className="text-amber-700">會清除現有所有資料並重新寫入，手動維護的封面圖、連結等資料將全部消失。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* 全部匯入 */}
        <div className="bg-white rounded-xl border-2 border-amber-300 p-5 shadow-sm sm:col-span-3">
          <h2 className="font-semibold text-gray-800 mb-1">一鍵全部匯入</h2>
          <p className="text-xs text-gray-500 mb-4">
            單曲 {seedSingles.length} 筆 + 專輯 {seedAlbums.length} 筆 + 提供樂曲 {seedProvidedSongs.length} 筆，同時建立藝人清單
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
          <p className="text-xs text-gray-400 mb-3">{seedAlbums.length} 筆（含曲目）</p>
          <button onClick={handleImportAlbums} disabled={isRunning}
            className="btn-primary text-xs disabled:opacity-50 flex items-center gap-1">
            {isRunning && importing === 'albums' ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            匯入專輯
          </button>
        </div>

        {/* 單獨匯入提供樂曲 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">僅匯入提供樂曲</h2>
          <p className="text-xs text-gray-400 mb-3">{seedProvidedSongs.length} 筆</p>
          <button onClick={handleImportProvidedSongs} disabled={isRunning}
            className="btn-primary text-xs disabled:opacity-50 flex items-center gap-1">
            {isRunning && importing === 'providedSongs' ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            匯入提供樂曲
          </button>
        </div>
      </div>

      {/* 進度條 */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              {importing === 'singles' ? '匯入單曲中...'
                : importing === 'albums' ? '匯入專輯中...'
                : importing === 'providedSongs' ? '匯入提供樂曲中...'
                : '處理中...'}
            </span>
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
