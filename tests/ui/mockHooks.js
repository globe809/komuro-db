import { useSyncExternalStore } from 'react'
import { fixtures } from './fixtures'
const listeners = new Set()
const EMPTY = []
let data = { ...fixtures }
try { const saved = localStorage.getItem('tkworks-qa-inventory'); if (saved) data.collectionInventory = JSON.parse(saved) } catch { /* in-memory fallback */ }
const subscribe = callback => { listeners.add(callback); return () => listeners.delete(callback) }
export const useCollection = name => ({ data: useSyncExternalStore(subscribe, () => data[name] || EMPTY), loading: false, error: null })
export const fetchCollection = async name => data[name] || []
const blocked = async () => { throw new Error('QA 環境已阻止所有正式資料寫入') }
export const addDocument = blocked, updateDocument = blocked, deleteDocument = blocked
export async function setDocument(name, id, values) {
  if (name !== 'collectionInventory') return blocked()
  const current = data[name] || []
  const before = current.find(entry => entry.id === id) || {}
  const record = { ...before, ...values, id, ...(values.owned ? { owned: { ...before.owned, ...values.owned } } : {}) }
  data = { ...data, [name]: [...current.filter(entry => entry.id !== id), record] }
  try { localStorage.setItem('tkworks-qa-inventory', JSON.stringify(data[name])) } catch { /* in-memory fallback */ }
  listeners.forEach(callback => callback())
}
