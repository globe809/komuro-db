/**
 * 格式化發行日期，支援只有年份、年月、或完整年月日的情況
 */
export function formatReleaseDate(year, month, day) {
  if (!year) return '未知'
  if (!month) return `${year}年`
  if (!day) return `${year}年${month}月`
  return `${year}年${month}月${day}日`
}

/**
 * 產生排序用的數值（YYYYMMDD 格式數字）
 */
export function toSortableDate(year, month, day) {
  const y = year ?? 0
  const m = month ?? 0
  const d = day ?? 0
  return y * 10000 + m * 100 + d
}
