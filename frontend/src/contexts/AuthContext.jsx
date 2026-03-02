import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import * as authService from '@/services/authService'

const AuthContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
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

    if (error) {
      throw error
    }

    return data
  }

  const createAdvisorIfMissing = async (authUser) => {
    const email = authUser?.email
    if (!email) return null

    const existing = await fetchAdvisorByEmail(email)
    if (existing) return existing

    const fullName =
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      email.split('@')[0]

    const company =
      authUser?.user_metadata?.company ||
      authUser?.user_metadata?.hd ||
      'FinMate Advisor'

    const { data, error } = await supabase
      .from('advisors')
      .insert([
        {
          email,
          name: fullName,
          company,
          phone: null
        }
      ])
      .select()
      .single()

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

    const loadAdvisorForUser = async (authUser, contextLabel = 'advisor') => {
      const email = authUser?.email
      if (!email) {
        if (mounted) setAdvisor(null)
        return
      }

      try {
        let advisorData = await fetchAdvisorByEmail(email)
        if (!advisorData) {
          advisorData = await createAdvisorIfMissing(authUser)
        }
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
          void loadAdvisorForUser(session.user, 'advisor')
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
          stopLoadingSafely()
        }
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
        void loadAdvisorForUser(session.user, 'advisor')
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

  const loginWithGoogle = async () => {
    await authService.loginWithGoogle()
    return { success: true }
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
          key.includes('bankquest') ||
          key.includes('finmate'))
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

  const refreshAdvisor = async () => {
    if (!user?.email) return null
    const advisorData = await fetchAdvisorByEmail(user.email)
    setAdvisor(advisorData || null)
    return advisorData || null
  }

  const value = {
    user,
    advisor,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshAdvisor,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
