import { supabase } from '@/lib/supabase'

const LEGAL_VERSION = '2026-03-02'

// Connexion
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .select('*')
    .eq('email', email)
    .single()

  if (advisorError) throw advisorError

  return { user: data.user, advisor }
}

// Connexion Google OAuth
export const loginWithGoogle = async () => {
  const redirectTo = `${window.location.origin}/dashboard`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  })

  if (error) throw error
  return data
}

// Inscription
export const register = async (userData) => {
  if (!userData?.consents?.termsAccepted || !userData?.consents?.privacyAccepted) {
    throw new Error('Veuillez accepter les conditions et la politique de confidentialite')
  }

  const acceptedAt = new Date().toISOString()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        legal_version: LEGAL_VERSION,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt
      }
    }
  })

  if (authError) throw authError

  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .insert([
      {
        email: userData.email,
        name: userData.name,
        company: userData.company,
        phone: userData.phone || null,
        terms_version: LEGAL_VERSION,
        privacy_policy_version: LEGAL_VERSION,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt,
        marketing_opt_in: Boolean(userData?.consents?.marketingOptIn)
      }
    ])
    .select()
    .single()

  if (advisorError) throw advisorError

  return { user: authData.user, advisor }
}

// Deconnexion
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const isUserAuthenticated = async () => {
  try {
    const session = await getSession()
    return !!session?.user
  } catch {
    return false
  }
}

export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

// Recuperer la session actuelle
export const getSession = async () => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Validation d'email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation de mot de passe
export const validatePassword = (password) => {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres'
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule'
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule'
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre'
  return null
}

// Generer les initiales
export const getUserInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

