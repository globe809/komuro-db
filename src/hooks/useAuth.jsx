import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'

// 唯一可管理後台的帳號
export const ADMIN_EMAIL = 'elvis814@gmail.com'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signIn = async () => {
    setError(null)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('登入失敗:', err)
      setError(err.code || err.message || '登入失敗')
    }
  }
  const signOut = () => fbSignOut(auth)

  const isAdmin = !!user && user.email === ADMIN_EMAIL

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signIn, signOut, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
