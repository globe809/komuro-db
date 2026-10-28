import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../../hooks/useFirestore'
import { duplicateGroups, getQualityIssues } from '../../utils/dataQuality'
import { formatReleaseDate } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'

const types = [{ key: 'singles', label: '單曲', path: 'singles' }, { key: 'albums', label: '專輯', path: 'albums' }, { key: 'videoWorks', label: '影像作品', path: 'video-works' }]
export default function DataQuality() {
  // Unordered reads intentionally include documents with no year field.
  const singles = useCollection('singles', null), albums = useCollection('albums', null), videoWorks = useCollection('videoWorks', null)
  const [kind, setKind] = useState(''), [issue, setIssue] = useState(''), [keyword, setKeyword] = useState('')
  const rows = useMemo(() => types.flatMap(type => {
    const items = ({ singles, albums, videoWorks })[type.key].data
    const duplicateIds = new Set(duplicateGroups(items).flat().map(item => item.id))
    return items.map(item => ({ ...item, kind: type.key, kindLabel: type.label, path: type.path, issues: [...getQualityIssues(item, type.key), ...(duplicateIds.has(item.id) ? [{ key: 'duplicate', label: '同名版本待確認' }] : [])] })).filter(item => item.issues.length)
  }), [singles.data, albums.data, videoWorks.data])
  const filtered = rows.filter(item => (!kind || item.kind === kind) && (!issue || item.issues.some(entry => entry.key === issue)) && `${item.title || ''} ${item.artistName || ''}`.toLowerCase().includes(keyword.toLowerCase()))
  const errors = [singles.error, albums.error, videoWorks.error].filter(Boolean)
  if ([singles, albums, videoWorks].some(result => result.loading)) return <LoadingSpinner />
  return <div>
    <h1 className="text-2xl text-gray-900 mb-2">資料檢查</h1>
    <p className="text-sm text-gray-500 mb-6">集中補齊缺漏資料；同名作品僅提示人工確認，不會自動合併或刪除。只有年份的資料也會列入日期待補清單。</p>
    {errors.length > 0 && <p role="alert" className="text-red-600 mb-4">部分資料讀取失敗，請重新整理：{errors.join('；')}</p>}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{[['cover', '缺封面'], ['date', '日期待補'], ['contents', '缺曲目／內容'], ['duplicate', '同名待確認']].map(([key, label]) => <button type="button" key={key} onClick={() => setIssue(previous => previous === key ? '' : key)} aria-pressed={issue === key} className={`card p-4 text-left ${issue === key ? 'ring-2 ring-gray-800' : ''}`}><span className="block text-xs text-gray-500">{label}</span><span className="block text-2xl mt-2">{rows.filter(row => (!kind || row.kind === kind) && row.issues.some(entry => entry.key === key)).length}</span></button>)}</div>
    <div className="flex flex-wrap gap-3 mb-4">
      <input aria-label="搜尋待補作品" className="form-input flex-1 min-w-[12rem]" placeholder="搜尋作品、藝人…" value={keyword} onChange={event => setKeyword(event.target.value)} />
      <select aria-label="作品類別" className="form-select sm:w-36" value={kind} onChange={event => setKind(event.target.value)}><option value="">所有類別</option>{types.map(type => <option key={type.key} value={type.key}>{type.label}</option>)}</select>
      <select aria-label="資料問題" className="form-select sm:w-44" value={issue} onChange={event => setIssue(event.target.value)}><option value="">所有問題</option>{[['cover', '缺封面'], ['date', '日期待補'], ['contents', '缺曲目／內容'], ['duplicate', '同名待確認'], ['title', '缺名稱'], ['artist', '缺藝人']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
    </div>
    <p className="text-xs text-gray-500 mb-3">{filtered.length} 筆待檢查作品</p>
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full text-sm text-left"><thead className="bg-gray-50 text-xs text-gray-500"><tr>{['類別', '作品／藝人', '發行日期', '待補項目', '操作'].map(label => <th scope="col" key={label} className="p-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{filtered.map(item => <tr key={`${item.kind}:${item.id}`}><td className="p-3 whitespace-nowrap">{item.kindLabel}</td><td className="p-3 min-w-[12rem]"><p>{item.title || '未命名'}</p><p className="text-xs text-gray-400">{item.artistName || '未填藝人'}</p></td><td className="p-3 text-gray-500 whitespace-nowrap">{formatReleaseDate(item.year, item.month, item.day)}</td><td className="p-3"><div className="flex flex-wrap gap-1">{item.issues.map(entry => <span key={entry.key} className="text-xs rounded bg-amber-50 text-amber-800 px-2 py-1 whitespace-nowrap">{entry.label}</span>)}</div></td><td className="p-3"><Link className="text-blue-700 hover:underline whitespace-nowrap" to={`/admin/${item.path}?edit=${encodeURIComponent(item.id)}`}>編輯</Link></td></tr>)}</tbody></table>{!filtered.length && !errors.length && <p className="p-8 text-center text-gray-500">沒有符合條件的待補資料。</p>}</div>
  </div>
}
