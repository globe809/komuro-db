import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Settings, Disc3 } from 'lucide-react'
import { useCollection, setDocument } from '../../hooks/useFirestore'
import { COLLECTION_FORMATS, COLLECTION_KINDS, collectionProgress, inventoryId } from '../../utils/collectionInventory'
import { formatReleaseDate } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'

const PAGE_SIZE = 40
const statusLabels = { unconfigured: '未設定格式', unowned: '尚未收藏', partial: '尚缺版本', complete: '已收齊' }

export default function CollectionInventory() {
  const singles = useCollection('singles', null)
  const albums = useCollection('albums', null)
  const videos = useCollection('videoWorks', null)
  const inventory = useCollection('collectionInventory', null)
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState('')
  const [saving, setSaving] = useState({})
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState('')
  const keyword = params.get('q') || '', kind = params.get('kind') || '', artist = params.get('artist') || ''
  const year = params.get('year') || '', format = params.get('format') || '', status = params.get('status') || ''
  const setParam = (key, value) => {
    setPage(1)
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  }
  const records = useMemo(() => new Map(inventory.data.map(entry => [entry.id, entry])), [inventory.data])
  const rows = useMemo(() => COLLECTION_KINDS.flatMap(type => {
    const data = ({ singles, albums, videoWorks: videos })[type.key].data
    return data.map(work => {
      const id = inventoryId(type.key, work.id)
      return { ...work, key: id, kind: type.key, kindLabel: type.label, path: type.path, progress: collectionProgress(work, type.key, records.get(id)) }
    })
  }).sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0) || (Number(b.month) || 0) - (Number(a.month) || 0) || (Number(b.day) || 0) - (Number(a.day) || 0) || String(a.title || '').localeCompare(String(b.title || ''))), [singles.data, albums.data, videos.data, records])
  const artists = useMemo(() => [...new Set(rows.map(row => row.artistName).filter(Boolean))].sort(), [rows])
  const years = useMemo(() => [...new Set(rows.map(row => row.year).filter(Boolean))].sort((a, b) => b - a), [rows])
  const matching = rows.filter(row => (!kind || row.kind === kind) && (!artist || row.artistName === artist) && (!year || String(row.year) === year) && (!format || row.progress.tracked.includes(format)) && `${row.title || ''} ${row.artistName || ''}`.toLowerCase().includes(keyword.toLowerCase()))
  const filtered = matching.filter(row => !status || (status === 'missing' ? row.progress.missingFormats.some(key => !format || key === format) : status === 'owned' ? row.progress.ownedFormats.some(key => !format || key === format) : row.progress.status === status))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const errors = [singles.error, albums.error, videos.error, inventory.error].filter(Boolean)
  const unavailable = errors.length > 0

  const save = async (row, values) => {
    if (saving[row.key] || unavailable) return
    setSaving(previous => ({ ...previous, [row.key]: true }))
    setSaveError(''); setNotice('')
    try {
      await setDocument('collectionInventory', row.key, { schemaVersion: 1, kind: row.kind, workId: row.id, ...values })
      setNotice(`已儲存「${row.title}」的收藏紀錄`)
    } catch (error) { setSaveError(`「${row.title}」儲存失敗：${error.message}，請重新勾選重試。`) }
    finally { setSaving(previous => ({ ...previous, [row.key]: false })) }
  }
  const toggleTracked = (row, key, checked) => {
    const trackedFormats = checked ? [...new Set([...row.progress.tracked, key])] : row.progress.tracked.filter(format => format !== key)
    save(row, { trackedFormats })
  }

  if ([singles, albums, videos, inventory].some(result => result.loading)) return <LoadingSpinner />
  return <div>
    <h1 className="text-2xl text-gray-900 mb-2">收藏／缺片清單</h1>
    <p className="text-sm text-gray-500 mb-2">勾選你已收藏的版本，找出還缺哪些作品或格式。每次勾選都會自動儲存。</p>
    <p className="text-xs text-gray-400 mb-6">專輯預設追蹤 CD；單曲與影像作品依現有發行格式設定。可逐筆「調整格式」，選擇你想收藏的版本。</p>
    {unavailable && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3 mb-4 text-sm">無法完整讀取資料，暫停勾選以避免誤判收藏狀態：{errors.join('；')}</p>}
    {saveError && <p role="alert" className="text-sm text-red-600 mb-4">{saveError}</p>}
    <p role="status" aria-live="polite" className="text-xs text-green-700 min-h-[1.25rem] mb-3">{notice}</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[['', '追蹤作品', matching.length], ['owned', '已有收藏', matching.filter(row => row.progress.ownedFormats.some(key => !format || key === format)).length], ['missing', '尚缺作品／版本', matching.filter(row => row.progress.missingFormats.some(key => !format || key === format)).length], ['unconfigured', '未設定格式', matching.filter(row => !row.progress.tracked.length).length]].map(([value, label, count]) => <button key={label} type="button" disabled={unavailable} onClick={() => setParam('status', value)} aria-pressed={status === value} className={`card p-4 text-left ${status === value ? 'ring-2 ring-gray-800' : ''}`}><span className="block text-xs text-gray-500">{label}</span><span className="block text-2xl mt-2">{unavailable ? '—' : count}</span></button>)}
    </div>
    <div className="flex flex-wrap gap-3 mb-4">
      <input aria-label="搜尋收藏作品" className="form-input flex-1 min-w-[12rem]" placeholder="搜尋作品或藝人…" value={keyword} onChange={event => setParam('q', event.target.value)} />
      <select aria-label="收藏作品類別" className="form-select sm:w-32" value={kind} onChange={event => setParam('kind', event.target.value)}><option value="">所有類別</option>{COLLECTION_KINDS.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>
      <select aria-label="收藏藝人" className="form-select sm:w-40" value={artist} onChange={event => setParam('artist', event.target.value)}><option value="">所有藝人</option>{artists.map(name => <option key={name} value={name}>{name}</option>)}</select>
      <select aria-label="收藏發行年份" className="form-select sm:w-28" value={year} onChange={event => setParam('year', event.target.value)}><option value="">所有年份</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select>
      <select aria-label="追蹤格式" className="form-select sm:w-32" value={format} onChange={event => setParam('format', event.target.value)}><option value="">所有格式</option>{COLLECTION_FORMATS.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>
      <select aria-label="收藏狀態" className="form-select sm:w-36" value={status} onChange={event => setParam('status', event.target.value)}><option value="">全部狀態</option><option value="missing">尚缺作品／版本</option><option value="owned">已有收藏</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button type="button" className="text-xs text-gray-500 px-2" onClick={() => { setParams({}, { replace: true }); setPage(1) }}>清除篩選</button>
    </div>
    <p className="text-xs text-gray-500 mb-3">{filtered.length} 筆作品 · 第 {currentPage}／{pageCount} 頁 · 「—」表示未追蹤該格式，可按調整格式加入。</p>
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <caption className="sr-only">個人收藏與尚缺格式</caption>
        <thead className="bg-gray-50 text-xs text-gray-500"><tr><th scope="col" className="p-3">作品／藝人</th><th scope="col" className="p-3">發行日期</th>{COLLECTION_FORMATS.map(type => <th scope="col" key={type.key} className="p-3 text-center">{type.label}</th>)}<th scope="col" className="p-3">收藏狀態</th><th scope="col" className="p-3">追蹤格式</th></tr></thead>
        <tbody className="divide-y divide-gray-100">{visible.map(row => <CollectionRow key={row.key} row={row} editing={editing === row.key} saving={!!saving[row.key]} disabled={unavailable} onEdit={() => setEditing(previous => previous === row.key ? '' : row.key)} onOwned={(key, checked) => save(row, { owned: { [key]: checked } })} onTracked={(key, checked) => toggleTracked(row, key, checked)} />)}</tbody>
      </table>
      {!filtered.length && <p className="text-center text-sm text-gray-400 p-8">沒有符合條件的作品。</p>}
    </div>
    <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
      <button className="btn-secondary disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>上一頁</button>
      <span>{currentPage}／{pageCount}</span>
      <button className="btn-secondary disabled:opacity-40" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>下一頁</button>
    </div>
  </div>
}

function CollectionRow({ row, editing, saving, disabled, onEdit, onOwned, onTracked }) {
  return <>
    <tr className="hover:bg-gray-50">
      <th scope="row" className="p-3 font-normal min-w-[13rem] max-w-xs whitespace-normal"><Link to={`/${row.path}/${row.id}`} className="text-gray-900 hover:underline">{row.title || '未命名'}</Link><p className="text-xs text-gray-400 mt-1">{row.kindLabel} · {row.artistName || '未填藝人'}</p></th>
      <td className="p-3 text-xs text-gray-500">{formatReleaseDate(row.year, row.month, row.day)}</td>
      {COLLECTION_FORMATS.map(type => <td key={type.key} className="p-3 text-center">{row.progress.tracked.includes(type.key) ? <input type="checkbox" aria-label={`${row.title}（${row.artistName || row.kindLabel}，${formatReleaseDate(row.year, row.month, row.day)}）：已收藏 ${type.label}`} checked={row.progress.owned[type.key]} disabled={saving || disabled} onChange={event => onOwned(type.key, event.target.checked)} className="w-4 h-4 accent-gray-900 cursor-pointer disabled:opacity-40" /> : <span className="text-gray-300">—</span>}</td>)}
      <td className="p-3"><span className={`inline-flex gap-1 items-center text-xs rounded px-2 py-1 ${row.progress.status === 'complete' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.progress.status === 'complete' && <Check size={12} />}{saving ? '儲存中…' : statusLabels[row.progress.status]}</span>{row.progress.missingFormats.length > 0 && <p className="text-xs text-gray-400 mt-1">缺 {COLLECTION_FORMATS.filter(type => row.progress.missingFormats.includes(type.key)).map(type => type.label).join('、')}</p>}</td>
      <td className="p-3"><button type="button" disabled={saving || disabled} aria-expanded={editing} onClick={onEdit} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"><Settings size={13} />調整格式</button></td>
    </tr>
    {editing && <tr><td colSpan={9} className="p-4 bg-gray-50"><div className="flex flex-wrap gap-4 items-center"><Disc3 size={15} className="text-gray-400" /><span className="text-xs text-gray-500">想收藏的版本：</span>{COLLECTION_FORMATS.map(type => <label key={type.key} className="flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" aria-label={`追蹤 ${row.title}：${type.label}`} checked={row.progress.tracked.includes(type.key)} disabled={saving || disabled || row.progress.owned[type.key]} onChange={event => onTracked(type.key, event.target.checked)} className="accent-gray-900" />{type.label}</label>)}</div><p className="text-xs text-gray-400 mt-2">已收藏的格式會保留追蹤；若要移除，請先取消該格式的收藏勾選。</p></td></tr>}
  </>
}
