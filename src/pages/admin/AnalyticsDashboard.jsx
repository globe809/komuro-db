import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCollection } from '../../hooks/useFirestore'
import { COLLECTION_FORMATS, COLLECTION_KINDS } from '../../utils/collectionInventory'
import { catalogueRows, filterRows, collectionSummary, groupCollection, prepareSales, salesValue, salesSummary, groupSales, csvText } from '../../utils/releaseAnalytics'
import LoadingSpinner from '../../components/LoadingSpinner'

const number = value => Number(value).toLocaleString('zh-TW', { maximumFractionDigits: 2 })
const yearSort = (a, b) => (Number(a.key) || 9999) - (Number(b.key) || 9999)
function download(name, headers, rows) {
  const url = URL.createObjectURL(new Blob([csvText(headers, rows)], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function Metric({ label, value, sub }) {
  return <div className="card p-4"><p className="text-xs text-gray-500">{label}</p><p className="text-2xl text-gray-800 mt-2">{value}</p>{sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}</div>
}
function Bars({ title, rows, keys, labels, unit = '', onSelect }) {
  const max = Math.max(1, ...rows.map(row => keys.reduce((sum, key) => sum + row[key], 0)))
  return <section className="card p-5 mb-6"><h2 className="text-base text-gray-800 mb-4">{title}</h2><div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">{labels.map((label, index) => <span key={label} className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: index ? '#ddd9cf' : '#8f9b8b' }} />{label}</span>)}</div>
    {!rows.length ? <p className="text-sm text-gray-400 py-6">沒有符合條件的資料。</p> : <div className="max-h-[32rem] overflow-y-auto space-y-3 pr-2">{rows.map(row => <div key={row.key} className="grid grid-cols-[6rem_1fr] sm:grid-cols-[9rem_1fr] items-center gap-3 text-xs"><button type="button" disabled={!onSelect} onClick={() => onSelect?.(row.key)} className="text-left text-gray-600 truncate disabled:cursor-default hover:underline" title={row.label || row.key}>{row.label || row.key}</button><div><div className="flex h-4 rounded overflow-hidden bg-stone-50" aria-label={`${row.label || row.key}：${keys.map((key, i) => `${labels[i]} ${row.known === 0 && key === 'total' ? '未填' : number(row[key])}${row.known === 0 && key === 'total' ? '' : unit}`).join('，')}`}>{keys.map((key, index) => <span key={key} style={{ width: `${row[key] / max * 100}%`, background: index ? '#ddd9cf' : '#8f9b8b' }} />)}</div><p className="mt-1 text-gray-500">{keys.map((key, index) => `${labels[index]} ${row.known === 0 && key === 'total' ? '未填' : number(row[key])}${row.known === 0 && key === 'total' ? '' : unit}`).join(' ／ ')}</p></div></div>)}</div>}
  </section>
}
export default function AnalyticsDashboard() {
  const singles = useCollection('singles', null), albums = useCollection('albums', null), videoWorks = useCollection('videoWorks', null), providedSongs = useCollection('providedSongs', null), inventory = useCollection('collectionInventory', null)
  const [params, setParams] = useSearchParams()
  const mode = params.get('tab') === 'sales' ? 'sales' : 'collection'
  const filters = { artist: params.get('artist') || '', kind: params.get('kind') || '', from: params.get('from') || '', to: params.get('to') || '', q: params.get('q') || '' }
  const format = params.get('format') || '', includeProvided = params.get('provided') !== '0'
  const setParam = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  const all = useMemo(() => catalogueRows({ singles: singles.data, albums: albums.data, videoWorks: videoWorks.data, providedSongs: providedSongs.data }, inventory.data), [singles.data, albums.data, videoWorks.data, providedSongs.data, inventory.data])
  const artistLabels = useMemo(() => new Map(all.map(row => [row.artist, row.artist === 'kiss destination' ? 'KiSS DESTiNATiON' : row.artist === '篠原涼子' ? '篠原涼子' : row.artistName || '未填藝人'])), [all])
  const years = [...new Set(all.map(row => row.releaseYear).filter(Boolean))].sort((a, b) => a - b)
  const invalidRange = filters.from && filters.to && Number(filters.from) > Number(filters.to)
  // Deduplicate against the whole catalogue before applying filters, so selecting a category cannot reintroduce double counting.
  const salesPrepared = useMemo(() => prepareSales(all, includeProvided), [all, includeProvided])
  const matching = filterRows(all, filters), collection = collectionSummary(matching, format)
  const salesRows = filterRows(salesPrepared.rows, filters), sales = salesSummary(salesRows)
  const annualCollection = groupCollection(collection.rows, 'releaseYear', format).sort(yearSort)
  const artistCollection = groupCollection(collection.rows, 'artist', format).sort((a, b) => b.ownedFormats - a.ownedFormats).map(row => ({ ...row, label: artistLabels.get(row.key) }))
  const annualSales = groupSales(salesRows, 'releaseYear').sort(yearSort)
  const artistSales = groupSales(salesRows, 'artist').sort((a, b) => b.total - a.total).map(row => ({ ...row, label: artistLabels.get(row.key) }))
  const excluded = filterRows(salesPrepared.excluded, filters)
  const problems = [singles, albums, videoWorks, providedSongs, ...(mode === 'collection' ? [inventory] : [])]
  if (problems.some(result => result.loading)) return <LoadingSpinner />
  if (problems.some(result => result.error)) return <p role="alert" className="card p-5 text-red-700">資料讀取失敗，暫停統計以避免顯示不完整結果。{problems.map(result => result.error).filter(Boolean).join('；')}</p>
  const exportData = () => mode === 'sales'
    ? download('TK-WORKS-年度銷售.csv', ['發行年份', '藝人', '類別', '作品', '累計銷售（萬枚）'], salesRows.map(row => [row.releaseYear || '未填年份', artistLabels.get(row.artist), row.kindLabel, row.title, salesValue(row.salesRecord) ?? '']))
    : download('TK-WORKS-收藏分析.csv', ['發行年份', '藝人', '類別', '作品', '已收藏格式', '尚缺格式'], collection.rows.map(row => [row.releaseYear || '未填年份', row.artistName, row.kindLabel, row.title, row.progress.ownedFormats.filter(key => !format || key === format).join(' / '), row.progress.missingFormats.filter(key => !format || key === format).join(' / ')]))
  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h1 className="text-2xl text-gray-900">收藏與銷售分析</h1><p className="text-xs text-gray-500 mt-2">依資料庫現有紀錄即時統計 · 收藏資訊僅限管理員</p></div><button type="button" className="btn-secondary" onClick={exportData} disabled={!!invalidRange}>匯出篩選資料 CSV</button></div>
    <div className="flex gap-2 mb-5">{[['collection', '我的收藏'], ['sales', '歷年銷售']].map(([key, label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => setParam('tab', key)} className={`btn-secondary ${mode === key ? 'control-selected' : ''}`}>{label}</button>)}</div>
    <div className="card p-4 mb-5 flex flex-wrap gap-3">
      <input aria-label="搜尋分析作品" placeholder="搜尋作品或藝人…" className="form-input sm:w-48" value={filters.q} onChange={event => setParam('q', event.target.value)} />
      <select aria-label="分析藝人" className="form-select sm:w-44" value={filters.artist} onChange={event => setParam('artist', event.target.value)}><option value="">所有藝人</option>{[...artistLabels].sort((a, b) => a[1].localeCompare(b[1])).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="分析類別" className="form-select sm:w-36" value={filters.kind} onChange={event => setParam('kind', event.target.value)}><option value="">所有作品類別</option>{COLLECTION_KINDS.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>
      <select aria-label="起始發行年份" className="form-select sm:w-32" value={filters.from} onChange={event => setParam('from', event.target.value)}><option value="">起始年份</option>{years.map(year => <option key={year}>{year}</option>)}</select>
      <select aria-label="結束發行年份" className="form-select sm:w-32" value={filters.to} onChange={event => setParam('to', event.target.value)}><option value="">結束年份</option>{years.map(year => <option key={year}>{year}</option>)}</select>
      {mode === 'collection' && <select aria-label="分析收藏格式" className="form-select sm:w-32" value={format} onChange={event => setParam('format', event.target.value)}><option value="">所有格式</option>{COLLECTION_FORMATS.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>}
      <button type="button" className="text-xs text-gray-500 px-2" onClick={() => setParams({ tab: mode }, { replace: true })}>清除篩選</button>
    </div>
    {invalidRange ? <p role="alert" className="card p-5 text-amber-800">起始年份不可晚於結束年份，請調整篩選。</p> : mode === 'collection' ? <>
      <p className="text-xs text-gray-500 mb-5">作品數以資料庫的單筆作品為單位；格式數以每筆 CD／Blu-ray／DVD／VHS／數位勾選各計 1，不代表實際光碟片數。年份依發行日期，並非購入日期。</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"><Metric label="已收藏作品" value={number(collection.ownedWorks)} sub={`篩選範圍 ${number(collection.works)} 筆作品`} /><Metric label="已收藏格式" value={number(collection.ownedFormats)} sub={`尚缺 ${number(collection.missingFormats)} 個格式`} /><Metric label="收藏完成率" value={`${collection.trackedFormats ? (collection.ownedFormats / collection.trackedFormats * 100).toFixed(1) : '0'}%`} sub="已收藏格式／追蹤格式" /><Metric label="已收齊作品" value={number(collection.completeWorks)} sub={`未設定格式 ${number(collection.unconfigured)} 筆`} /></div>
      <Bars title="收藏格式分布" rows={COLLECTION_FORMATS.filter(type => !format || type.key === format).map(type => ({ key: type.label, ownedFormats: collection.rows.filter(row => row.progress.owned[type.key]).length, missingFormats: collection.rows.filter(row => row.progress.missingFormats.includes(type.key)).length }))} keys={['ownedFormats', 'missingFormats']} labels={['已收藏', '尚缺']} />
      <Bars title="作品類別收藏分布" rows={groupCollection(collection.rows, 'kindLabel', format)} keys={['ownedFormats', 'missingFormats']} labels={['已收藏格式', '尚缺格式']} />
      <Bars title="歷年發行作品收藏分布" rows={annualCollection} keys={['ownedFormats', 'missingFormats']} labels={['已收藏格式', '尚缺格式']} />
      <Bars title="各藝人收藏分布（點藝人可篩選）" rows={artistCollection} keys={['ownedFormats', 'missingFormats']} labels={['已收藏格式', '尚缺格式']} onSelect={key => setParam('artist', key)} />
      <Link className="btn-secondary inline-block" to="/admin/collection">前往收藏／缺片清單</Link>
    </> : <>
      <p className="text-xs text-gray-500 mb-3">年度數據＝該年發行作品的累計銷量（萬枚），不是當年實際售出量。以本站小室哲哉相關作品目錄為範圍，不代表全部市場銷售；未填銷量不視為 0。</p>
      <label className="flex items-center gap-2 text-sm text-gray-600 mb-2"><input type="checkbox" className="collection-check" checked={includeProvided} onChange={event => setParam('provided', event.target.checked ? '1' : '0')} />納入提供樂曲的收錄作品銷量（自動檢查重複）</label>
      <p className="text-xs text-gray-400 mb-5">依目前選項加總作品已填銷量。提供樂曲依藝人、收錄作品類型／名稱、發行年份去重；缺收錄名稱或銷量矛盾者暫不加總。不同資料庫版本仍各自計入，若多版本填入同一總銷量，請先於資料檢查確認。</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"><Metric label="累計銷售合計" value={`${number(sales.total)} 萬枚`} /><Metric label="有銷量紀錄" value={`${number(sales.known)}／${number(salesRows.length)}`} sub="筆作品" /><Metric label="未填／無效銷量" value={number(sales.missing)} sub="不納入合計" /><Metric label="有銷量但未填年份" value={number(sales.undated)} sub="另列於未填年份，年份篩選會排除" /></div>
      <Bars title={`${filters.artist ? artistLabels.get(filters.artist) : '小室哲哉相關全部藝人'}：各發行年份累計銷量`} rows={annualSales} keys={['total']} labels={['累計銷量']} unit=" 萬枚" />
      <Bars title="各歌手累計總銷量（點藝人可篩選）" rows={artistSales} keys={['total']} labels={['累計銷量']} unit=" 萬枚" onSelect={key => setParam('artist', key)} />
      <section className="card p-5 mb-6"><h2 className="text-base mb-4">歷年 × 歌手銷售明細</h2><div className="max-h-[30rem] overflow-auto"><table className="w-full text-left text-xs whitespace-nowrap"><thead className="text-gray-500"><tr>{['發行年份', '歌手', '累計銷量（萬枚）', '已填／作品數'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{annualSales.flatMap(year => groupSales(salesRows.filter(row => String(row.releaseYear ?? '未填年份') === year.key), 'artist').sort((a, b) => b.total - a.total).map(row => <tr key={`${year.key}-${row.key}`} className="border-t border-gray-100"><td className="p-2">{year.key}</td><td className="p-2">{artistLabels.get(row.key)}</td><td className="p-2">{row.known ? number(row.total) : '未填'}</td><td className="p-2">{row.known}／{row.works}</td></tr>))}</tbody></table>{!salesRows.length && <p className="p-5 text-gray-400">沒有符合條件的作品。</p>}</div></section>
      <details className="card p-4"><summary className="text-sm text-gray-600 cursor-pointer">未納入的提供樂曲紀錄（{excluded.length} 筆）</summary><div className="max-h-64 overflow-y-auto mt-3 text-xs text-gray-500 space-y-2">{excluded.map(row => <p key={row.key}>{row.artistName} · {row.title}：{row.reason}</p>)}{!excluded.length && <p>沒有排除紀錄。</p>}</div></details>
    </>}
  </div>
}
