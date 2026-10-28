export const COLLECTION_FORMATS = [
  { key: 'cd', label: 'CD' },
  { key: 'bluray', label: 'Blu-ray' },
  { key: 'dvd', label: 'DVD' },
  { key: 'vhs', label: 'VHS' },
  { key: 'digital', label: '數位' },
]
export const COLLECTION_KINDS = [
  { key: 'singles', label: '單曲', path: 'singles' },
  { key: 'albums', label: '專輯', path: 'albums' },
  { key: 'videoWorks', label: '影像作品', path: 'video-works' },
]
const formatKeys = COLLECTION_FORMATS.map(format => format.key)
export const inventoryId = (kind, id) => `${kind}__${id}`
export function defaultTrackedFormats(work, kind) {
  const raw = Array.isArray(work.formats) ? work.formats : work.format ? [work.format] : []
  const mapped = raw.map(value => {
    const format = String(value).normalize('NFKC').toLowerCase().replace(/[\s_-]/g, '')
    return ({ cd: 'cd', '8cmcd': 'cd', '12cmcd': 'cd', bluray: 'bluray', bd: 'bluray', dvd: 'dvd', vhs: 'vhs', digital: 'digital', '數位': 'digital' })[format]
  }).filter(Boolean)
  if (mapped.length) return [...new Set(mapped)]
  if (work.type === 'digital' || work.format === 'digital') return ['digital']
  if (kind === 'singles' && work.type === 'physical') return ['cd']
  if (kind === 'albums') return ['cd']
  return []
}
export function collectionProgress(work, kind, entry = {}) {
  const owned = Object.fromEntries(formatKeys.map(key => [key, entry.owned?.[key] === true]))
  const requested = Array.isArray(entry.trackedFormats) ? entry.trackedFormats : defaultTrackedFormats(work, kind)
  // An owned format remains visible even if old tracking settings omitted it.
  const tracked = formatKeys.filter(key => requested.includes(key) || owned[key])
  const ownedFormats = tracked.filter(key => owned[key])
  const missingFormats = tracked.filter(key => !owned[key])
  return {
    owned, tracked, ownedFormats, missingFormats,
    status: !tracked.length ? 'unconfigured' : !ownedFormats.length ? 'unowned' : missingFormats.length ? 'partial' : 'complete',
  }
}
