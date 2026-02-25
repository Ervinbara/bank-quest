import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import * as authService from '@/services/authService'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [advisor, setAdvisor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier la session au chargement
    authService.getSession().then(session => {
      if (session?.user) {
        setUser(session.user)
        loadAdvisor(session.user.email)
      }
      setLoading(false)
    })

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadAdvisor(session.user.email)
        } else {
          setAdvisor(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadAdvisor = async (email) => {
    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('email', email)
      .single()

    if (!error && data) {
      setAdvisor(data)
    }
  }

  const login = async (email, password, remember = false) => {
    const { user: authUser, advisor: advisorData } = await authService.login(email, password)
    setUser(authUser)
    setAdvisor(advisorData)
    return { success: true, user: authUser, advisor: advisorData }
  }

  const register = async (userData) => {
    const { user: authUser, advisor: advisorData } = await authService.register(userData)
    setUser(authUser)
    setAdvisor(advisorData)
    return { success: true, user: authUser, advisor: advisorData }
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setAdvisor(null)
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', advisor.id)
      .select()
      .single()

    if (error) throw error

    setAdvisor(data)
    return { success: true, advisor: data }
  }

  const value = {
    user,
    advisor,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}