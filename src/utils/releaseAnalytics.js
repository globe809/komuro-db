import { COLLECTION_KINDS, collectionProgress, inventoryId } from './collectionInventory.js'
const normalize = value => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
const aliases = { '篠原涼子 with t.komuro': '篠原涼子', 'true kiss destination': 'kiss destination' }
export const artistKey = name => aliases[normalize(name)] || normalize(name) || '未填藝人'
export function salesValue(value) {
  if (value == null || typeof value === 'boolean' || String(value).trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}
export const releaseYear = value => /^\d{4}$/.test(String(value)) && Number(value) >= 1900 && Number(value) <= 2200 ? Number(value) : null
export function catalogueRows(collections, inventory = []) {
  const records = new Map(inventory.map(entry => [entry.id, entry]))
  return COLLECTION_KINDS.flatMap(type => (collections[type.key] || []).map(work => ({ ...work, originalKind: work.kind, kind: type.key, kindLabel: type.label, key: inventoryId(type.key, work.id), artist: artistKey(work.artistName), releaseYear: releaseYear(work.year), progress: collectionProgress(work, type.key, records.get(inventoryId(type.key, work.id))) })))
}
export function filterRows(rows, filters = {}) {
  return rows.filter(row => (!filters.artist || row.artist === filters.artist) && (!filters.kind || row.kind === filters.kind) && (!filters.from || row.releaseYear != null && row.releaseYear >= Number(filters.from)) && (!filters.to || row.releaseYear != null && row.releaseYear <= Number(filters.to)) && (!filters.q || `${row.title || ''} ${row.artistName || ''}`.toLowerCase().includes(filters.q.toLowerCase())))
}
export function collectionSummary(rows, format = '') {
  const selected = rows.filter(row => !format || row.progress.tracked.includes(format))
  const owned = row => row.progress.ownedFormats.filter(key => !format || key === format)
  const missing = row => row.progress.missingFormats.filter(key => !format || key === format)
  return { rows: selected, works: selected.length, ownedWorks: selected.filter(row => owned(row).length).length, ownedFormats: selected.reduce((sum, row) => sum + owned(row).length, 0), trackedFormats: selected.reduce((sum, row) => sum + row.progress.tracked.filter(key => !format || key === format).length, 0), missingFormats: selected.reduce((sum, row) => sum + missing(row).length, 0), completeWorks: selected.filter(row => row.progress.tracked.length && !missing(row).length).length, unconfigured: selected.filter(row => !row.progress.tracked.length).length }
}
export function groupCollection(rows, field, format = '') {
  const groups = new Map()
  rows.forEach(row => { const key = String(row[field] ?? '未填年份'); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row) })
  return [...groups].map(([key, works]) => ({ key, ...collectionSummary(works, format) }))
}
// Sales belong to a release, never to each individual track on that release.
export function prepareSales(rows, includeProvided = false) {
  const primary = rows.filter(row => row.kind !== 'providedSongs')
  const releaseKey = row => `${row.artist}|${normalize(row.title)}|${row.kind}|${row.releaseYear ?? ''}`
  const known = new Set(primary.map(releaseKey))
  const groups = new Map(), excluded = []
  for (const row of rows) {
    if (row.kind !== 'providedSongs') continue
    if (!includeProvided) { excluded.push({ ...row, reason: '提供樂曲尚未納入' }); continue }
    // originalKind preserves the provided-song subtype overwritten by catalogueRows.
    const type = row.originalKind === 'album' ? 'albums' : 'singles'
    const title = row.sourceTitle || (row.originalKind === 'single' ? row.title : '')
    if (!title) { excluded.push({ ...row, reason: '缺收錄作品名稱，無法判斷重複銷量' }); continue }
    const candidate = { ...row, title, kind: type }
    const key = releaseKey(candidate)
    if (known.has(key)) { excluded.push({ ...row, reason: '已計入單曲／專輯作品' }); continue }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  const added = []
  for (const works of groups.values()) {
    const values = [...new Set(works.map(row => salesValue(row.salesRecord)).filter(value => value != null))]
    if (values.length > 1) { works.forEach(row => excluded.push({ ...row, reason: '同收錄作品有不同銷量，待確認' })); continue }
    added.push({ ...works[0], title: works[0].sourceTitle || works[0].title, salesRecord: values[0] ?? null })
    works.slice(1).forEach(row => excluded.push({ ...row, reason: '同收錄作品只計一次' }))
  }
  return { rows: [...primary, ...added], excluded }
}
export function salesSummary(rows) {
  const valid = rows.filter(row => salesValue(row.salesRecord) != null)
  return { total: valid.reduce((sum, row) => sum + salesValue(row.salesRecord), 0), known: valid.length, missing: rows.length - valid.length, undated: valid.filter(row => row.releaseYear == null).length }
}
export function groupSales(rows, field) {
  const groups = new Map()
  rows.forEach(row => { const key = String(row[field] ?? '未填年份'); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row) })
  return [...groups].map(([key, works]) => ({ key, works: works.length, ...salesSummary(works) }))
}
export function csvText(headers, rows) {
  const cell = value => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"` }
  return '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
}
