import { fixtures } from './fixtures'
export const useCollection = name => ({ data: fixtures[name] || [], loading: false, error: null })
export const fetchCollection = async name => fixtures[name] || []
const blocked = async () => { throw new Error('QA 環境已阻止所有資料寫入') }
export const addDocument = blocked, updateDocument = blocked, deleteDocument = blocked
