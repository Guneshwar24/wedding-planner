import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  // phone + password login/signup (email = phone@shaadi.app)
  async function login(phone, password) {
    const email = `${phone}@shaadi.app`

    // Try sign in first
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // If user doesn't exist, sign up
      if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Skip email confirmation for internal app
            data: { phone }
          }
        })
        if (signUpError) throw signUpError
        // Profile is auto-created by DB trigger
        return signUpData
      }
      throw error
    }

    return data
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function updateName(name) {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => ({ ...prev, name }))
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
