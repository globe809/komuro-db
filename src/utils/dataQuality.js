export const normalizeReleaseName = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[\s　]+/g, '').replace(/["'’‘“”「」『』・.,，。:：!?！？\-‐‑–—_~〜～]/g, '')
export function releaseIdentity(item) {
  const artist = normalizeReleaseName(item.artistName), title = normalizeReleaseName(item.title)
  return artist && title ? `${artist}\u0000${title}` : ''
}
export function findDuplicateCandidates(item, existing, excludeId) {
  const key = releaseIdentity(item)
  return key ? existing.filter(candidate => (!excludeId || candidate.id !== excludeId) && releaseIdentity(candidate) === key) : []
}
export function validReleaseDate(item) {
  const year = Number(item.year), month = Number(item.month), day = Number(item.day)
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) return false
  // setFullYear handles years below 100 without the Date constructor's 1900 offset.
  const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(0, 0, 0, 0)
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}
export function getQualityIssues(item, kind) {
  const issues = []
  if (!String(item.title || '').trim()) issues.push({ key: 'title', label: '缺名稱' })
  if (!String(item.artistName || '').trim()) issues.push({ key: 'artist', label: '缺藝人' })
  if (!String(item.imageUrl || '').trim()) issues.push({ key: 'cover', label: '缺封面' })
  if (!validReleaseDate(item)) issues.push({ key: 'date', label: '日期未完整或無效' })
  const contents = kind === 'videoWorks' ? item.contents : item.tracks
  if (!Array.isArray(contents) || !contents.some(track => String(track?.title || '').trim())) issues.push({ key: 'contents', label: kind === 'videoWorks' ? '缺內容' : '缺曲目' })
  return issues
}
// Keep release versions as candidates for human review; never automatically delete them.
export function duplicateGroups(items) {
  const groups = new Map()
  for (const item of items) {
    const key = releaseIdentity(item)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.values()].filter(group => group.length > 1)
}
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value
export function deduplicateImport(items) {
  const seen = new Set(), unique = [], duplicates = []
  for (const item of items) {
    // Date and format differences represent distinct editions and must survive import.
    const identity = releaseIdentity(item)
    const date = [item.year, item.month, item.day].map(value => Number(value) || '').join('-')
    const format = Array.isArray(item.formats) ? [...item.formats].sort().join('|') : item.format || item.type || item.albumType || item.kind || ''
    const { id, createdAt, updatedAt, title, artistName, year, month, day, ...details } = item
    const key = identity ? `${identity}\u0000${date}\u0000${format}\u0000${JSON.stringify(canonical(details))}` : null
    if (key && seen.has(key)) duplicates.push(item)
    else { unique.push(item); if (key) seen.add(key) }
  }
  return { unique, duplicates }
}
