import { toSortableDate } from './formatDate.js'

// Typography and casing may vary between releases; named musical versions must not disappear.
export function normalizeCompositionTitle(title) {
  return String(title || '').normalize('NFKC').trim().replace(/\s+/g, ' ').replace(/\s*([()[\]])\s*/g, '$1').toLowerCase()
}

export function dedupeCompositions(songs) {
  const grouped = new Map()
  for (const song of songs) {
    const key = JSON.stringify([String(song.artistName || '').normalize('NFKC').trim().toLowerCase(), normalizeCompositionTitle(song.title)])
    const date = toSortableDate(song.year, song.month, song.day)
    const existing = grouped.get(key)
    if (!existing || date > 0 && (existing._date === 0 || date < existing._date)) {
      grouped.set(key, { ...song, _key: key, _date: date })
    }
  }
  return [...grouped.values()]
}
