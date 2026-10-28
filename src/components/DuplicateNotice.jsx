import { useMemo } from 'react'
import { findDuplicateCandidates } from '../utils/dataQuality'
import { formatReleaseDate } from '../utils/formatDate'
export default function DuplicateNotice({ item, existing, excludeId }) {
  const matches = useMemo(() => findDuplicateCandidates(item, existing, excludeId), [item, existing, excludeId])
  if (!matches.length) return null
  return <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
    <p className="font-medium">有 {matches.length} 筆同藝人、同名作品，請確認版本。</p>
    <ul className="mt-2 space-y-1">{matches.slice(0, 5).map(match => <li key={match.id}>{match.title} · {formatReleaseDate(match.year, match.month, match.day)} · {(match.formats || [match.format || match.type || match.albumType || '']).join(' / ')}</li>)}</ul>
    <p className="mt-2">不同發行日期、再版或格式可能是合理的獨立資料，儲存前會再請你確認。</p>
  </div>
}
