const memory = new Map()
export function readBrowseState(key, fallback) {
  try {
    const value = sessionStorage.getItem(`tkworks:${key}`)
    return value === null ? (memory.has(key) ? memory.get(key) : fallback) : JSON.parse(value)
  } catch { return memory.has(key) ? memory.get(key) : fallback }
}
export function writeBrowseState(key, value) {
  memory.set(key, value)
  try { sessionStorage.setItem(`tkworks:${key}`, JSON.stringify(value)) } catch { /* Private browsing still works in memory. */ }
}
