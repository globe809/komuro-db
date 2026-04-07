import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * 監聽 Firestore collection 並回傳資料清單
 */
export function useCollection(collectionName, orderByField = 'year', orderDir = 'asc') {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, orderDir)
    )
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [collectionName, orderByField, orderDir])

  return { data, loading, error }
}

/**
 * 一次性取得 collection 全部資料（不監聽）
 */
export async function fetchCollection(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName))
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * 新增文件
 */
export async function addDocument(collectionName, data) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/**
 * 更新文件
 */
export async function updateDocument(collectionName, id, data) {
  const ref = doc(db, collectionName, id)
  return updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

/**
 * 刪除文件
 */
export async function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id))
}
