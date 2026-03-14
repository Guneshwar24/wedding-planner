import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'sonner'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('shaadi_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      client.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('shaadi_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  async function login(phone, password) {
    const res = await client.post('/api/auth/login', { phone, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('shaadi_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('shaadi_token')
    setToken(null)
    setUser(null)
  }

  async function updateUser(name) {
    const res = await client.patch('/api/auth/me', { name })
    setUser(res.data)
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
