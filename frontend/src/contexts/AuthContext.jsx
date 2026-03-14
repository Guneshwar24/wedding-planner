import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

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

  // Step 1: check whitelist then send OTP
  async function sendOtp(phone) {
    const { data: allowed, error: rpcError } = await supabase
      .rpc('is_phone_whitelisted', { p_phone: phone })

    if (rpcError) throw rpcError
    if (!allowed) throw new Error('This number is not authorised. Contact the admin to get access.')

    const { error } = await supabase.auth.signInWithOtp({ phone })
    if (error) throw error
  }

  // Step 2: verify the 6-digit OTP
  async function verifyOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    if (error) throw error
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

  const isAdmin = profile?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, sendOtp, verifyOtp, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
