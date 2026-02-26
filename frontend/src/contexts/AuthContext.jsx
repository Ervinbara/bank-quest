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
    checkSession()

    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event) // Pour debug
        
        if (event === 'SIGNED_OUT') {
          // Nettoyage complet lors de la déconnexion
          clearAllData()
        } else if (session?.user) {
          setUser(session.user)
          await loadAdvisor(session.user.email)
        } else {
          setUser(null)
          setAdvisor(null)
        }
      }
    )

    // Cleanup: unsubscribe quand le composant se démonte
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkSession = async () => {
    try {
      const session = await authService.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadAdvisor(session.user.email)
      }
    } catch (error) {
      console.error('Erreur vérification session:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdvisor = async (email) => {
    try {
      const { data, error } = await supabase
        .from('advisors')
        .select('*')
        .eq('email', email)
        .single()

      if (!error && data) {
        setAdvisor(data)
      }
    } catch (error) {
      console.error('Erreur chargement advisor:', error)
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
      
      // 1. Déconnexion Supabase (gère automatiquement les cookies et le storage)
      await authService.logout()
      
      // 2. Nettoyage complet du stockage local
      clearAllData()
      
      console.log('✅ Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, on nettoie localement
      clearAllData()
      throw error
    }
  }

  const clearAllData = () => {
    console.log('🧹 Nettoyage de toutes les données...')
    
    // Nettoyer le state React
    setUser(null)
    setAdvisor(null)
    
    // Nettoyer localStorage (toutes les clés Supabase)
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
    keysToRemove.forEach(key => {
      console.log('  - Suppression localStorage:', key)
      localStorage.removeItem(key)
    })
    
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
    sessionKeysToRemove.forEach(key => {
      console.log('  - Suppression sessionStorage:', key)
      sessionStorage.removeItem(key)
    })
    
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}