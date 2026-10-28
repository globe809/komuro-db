import { fixtures } from './fixtures'
export const collection = (_db, name) => ({ name })
export const getDocs = async ref => ({ docs: (fixtures[ref.name] || []).map(data => ({ id: data.id, data: () => data, ref: { id: data.id } })) })
const blocked = () => { throw new Error('QA 環境已阻止所有資料寫入') }
export const writeBatch = blocked, updateDoc = blocked, doc = blocked
