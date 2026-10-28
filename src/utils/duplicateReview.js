import { fetchCollection } from '../hooks/useFirestore'
import { findDuplicateCandidates } from './dataQuality'
import { formatReleaseDate } from './formatDate'
export async function confirmDuplicateSave(collectionName, item, excludeId) {
  const latest = await fetchCollection(collectionName)
  const matches = findDuplicateCandidates(item, latest, excludeId)
  if (!matches.length) return true
  const details = matches.slice(0, 5).map(match => `${match.title} · ${formatReleaseDate(match.year, match.month, match.day)} · ${(match.formats || [match.format || match.type || match.albumType || '']).join(' / ')}`).join('\n')
  return window.confirm(`找到 ${matches.length} 筆同藝人、相同名稱的作品：\n${details}\n\n請確認是否為不同版本。仍要儲存這筆資料嗎？`)
}
