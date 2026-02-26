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
  let mounted = true
  let subscription = null

  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase
          .from('advisors')
          .select('*')
          .eq('email', session.user.email)
          .single()
        
        if (mounted && data) {
          setAdvisor(data)
        }
      }
    } catch (error) {
      console.error('❌ Init auth error:', error)
    } finally {
      // TOUJOURS passer loading à false, même si mounted=false
      // Sinon en StrictMode, le 1er mount met mounted=false avant
      // que le 2e mount ait fini, et loading reste à true forever
      setLoading(false)
    }
  }

  initAuth()

  // Écouter les changements APRÈS l'init
  const setupListener = async () => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setAdvisor(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        try {
          const { data: advisorData } = await supabase
            .from('advisors')
            .select('*')
            .eq('email', session.user.email)
            .single()
          if (mounted && advisorData) setAdvisor(advisorData)
        } catch (e) {
          console.error('❌ Advisor load error:', e)
        }
      }
    })
    subscription = data.subscription
  }

  setupListener()

  return () => {
    mounted = false
    if (subscription) subscription.unsubscribe()
  }
}, [])

  const loadAdvisor = async (email) => {
    try {
      console.log('📊 Chargement advisor pour:', email)
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        console.error('❌ Erreur Supabase loadAdvisor:', error)
        throw error
      }

      if (data) {
        console.log('✅ Advisor chargé:', data.name)
        setAdvisor(data)
      } else {
        console.warn('⚠️ Aucun advisor trouvé pour:', email)
      }
    } catch (error) {
      console.error('❌ Exception loadAdvisor:', error)
      throw error
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
    try {
      console.log('🚪 Déconnexion en cours...')
      await authService.logout()
      clearAllData()
      console.log('✅ Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error)
      clearAllData()
      throw error
    }
  }

  const clearAllData = () => {
    console.log('🧹 Nettoyage de toutes les données...')
    
    setUser(null)
    setAdvisor(null)
    
    // Nettoyer localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') ||
        key.includes('auth-token') ||
        key.includes('bankquest')
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Nettoyer sessionStorage
    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') ||
        key.includes('auth-token')
      )) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    console.log('✅ Nettoyage terminé')
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

  if (loading) {
    console.log('⏳ AuthContext: loading =', loading)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}