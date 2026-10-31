/** Unknown date parts sort after known parts in either direction. */
export function compareReleaseDate(a, b, direction = 'asc') {
  for (const [key, min, max] of [['year', 1, 9999], ['month', 1, 12], ['day', 1, 31]]) {
    const av = Number(a[key]), bv = Number(b[key])
    const ak = Number.isInteger(av) && av >= min && av <= max
    const bk = Number.isInteger(bv) && bv >= min && bv <= max
    if (ak !== bk) return ak ? -1 : 1
    if (ak && av !== bv) return (av - bv) * (direction === 'desc' ? -1 : 1)
  }
  return String(a.artistName || '').localeCompare(String(b.artistName || '')) || String(a.sourceTitle || '').localeCompare(String(b.sourceTitle || '')) || (Number(a.discNo) || 1) - (Number(b.discNo) || 1) || (Number(a.trackNo) || 999) - (Number(b.trackNo) || 999) || String(a.title || '').localeCompare(String(b.title || '')) || String(a.id || '').localeCompare(String(b.id || ''))
}
