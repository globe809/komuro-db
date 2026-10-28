/** Keep the existing item order within each year; unknown years always go last. */
export function groupReleases(items, direction = 'desc') {
  const buckets = new Map()
  for (const item of items) {
    const value = Number(item.year)
    const year = Number.isInteger(value) && value > 0 ? String(value) : 'unknown'
    if (!buckets.has(year)) buckets.set(year, [])
    buckets.get(year).push(item)
  }
  return [...buckets].sort(([a], [b]) => {
    if (a === 'unknown') return 1
    if (b === 'unknown') return -1
    return direction === 'asc' ? Number(a) - Number(b) : Number(b) - Number(a)
  }).map(([year, releases]) => ({ year, releases }))
}
