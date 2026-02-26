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

  const fetchAdvisorByEmail = async (email) => {
    if (!email) return null

    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) throw error
    return data
  }

  useEffect(() => {
    let mounted = true
    let subscription = null
    let loadingGuardTimeout = null

    const stopLoadingSafely = () => {
      if (!mounted) return
      setLoading(false)

      if (loadingGuardTimeout) {
        clearTimeout(loadingGuardTimeout)
        loadingGuardTimeout = null
      }
    }

    const loadAdvisorForUser = async (email, contextLabel = 'advisor') => {
      if (!email) {
        if (mounted) setAdvisor(null)
        return
      }

      try {
        const advisorData = await fetchAdvisorByEmail(email)
        if (mounted) setAdvisor(advisorData || null)
      } catch (err) {
        console.error(`Init ${contextLabel} load error:`, err)
        if (mounted) setAdvisor(null)
      }
    }

    const initAuth = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) throw error
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          stopLoadingSafely()
          void loadAdvisorForUser(session.user.email, 'advisor')
        } else {
          setUser(null)
          setAdvisor(null)
          stopLoadingSafely()
        }
      } catch (error) {
        console.error('Init auth error:', error)
        if (mounted) {
          setUser(null)
          setAdvisor(null)
        }
        stopLoadingSafely()
      }
    }

    initAuth()

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setAdvisor(null)
        stopLoadingSafely()
        return
      }

      if (['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        setUser(session.user)
        stopLoadingSafely()

        // Evite les deadlocks Supabase: ne pas await d'appel auth/db dans ce callback.
        void loadAdvisorForUser(session.user.email, 'advisor')
      }
    })

    subscription = data.subscription

    // Filet de securite: evite un spinner infini si un appel reseau se bloque.
    loadingGuardTimeout = setTimeout(() => {
      if (!mounted) return
      console.warn('Auth loading timeout reached, forcing loading=false')
      setLoading(false)
    }, 10000)

    return () => {
      mounted = false
      if (loadingGuardTimeout) clearTimeout(loadingGuardTimeout)
      if (subscription) subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
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

  const clearAllData = () => {
    setUser(null)
    setAdvisor(null)

    const localKeysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token') ||
          key.includes('bankquest'))
      ) {
        localKeysToRemove.push(key)
      }
    }
    localKeysToRemove.forEach((key) => localStorage.removeItem(key))

    const sessionKeysToRemove = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (
        key &&
        (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))
      ) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))
  }

  const logout = async () => {
    try {
      await authService.logout()
      clearAllData()
    } catch (error) {
      clearAllData()
      throw error
    }
  }

  const updateProfile = async (updates) => {
    if (!advisor?.id) throw new Error('Advisor non charge')

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
