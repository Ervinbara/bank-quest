import { supabase } from '@/lib/supabase'

const LEGAL_VERSION = '2026-03-02'

const buildAdvisorPayload = ({
  email,
  name,
  company,
  phone = null,
  marketingOptIn = false
}) => {
  const acceptedAt = new Date().toISOString()
  return {
    email,
    name,
    company,
    phone,
    terms_version: LEGAL_VERSION,
    privacy_policy_version: LEGAL_VERSION,
    terms_accepted_at: acceptedAt,
    privacy_accepted_at: acceptedAt,
    marketing_opt_in: Boolean(marketingOptIn),
    gamification_enabled: true,
    gamification_updated_at: acceptedAt,
    smart_alerts_enabled: true,
    smart_alerts_delay_days: 7,
    smart_alerts_updated_at: acceptedAt
  }
}

const ensureAdvisorForAuthenticatedEmail = async ({
  email,
  name,
  company,
  phone = null,
  marketingOptIn = false
}) => {
  const { data: existing, error: existingError } = await supabase
    .from('advisors')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  const payload = buildAdvisorPayload({ email, name, company, phone, marketingOptIn })
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .insert([payload])
    .select()
    .single()

  if (advisorError) throw advisorError
  return advisor
}

// Connexion
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  const advisor = await ensureAdvisorForAuthenticatedEmail({
    email,
    name: data?.user?.user_metadata?.full_name || data?.user?.user_metadata?.name || email.split('@')[0],
    company: data?.user?.user_metadata?.company || 'FinMate Advisor',
    phone: null,
    marketingOptIn: false
  })

  return { user: data.user, advisor }
}

// Connexion Google OAuth
export const loginWithGoogle = async () => {
  const redirectTo = `${window.location.origin}/dashboard`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account'
      }
    }
  })

  if (error) throw error

  if (!data?.url) {
    throw new Error("Impossible de demarrer l'authentification Google. Verifiez la configuration OAuth.")
  }

  window.location.assign(data.url)
  return data
}

// Inscription
export const register = async (userData) => {
  if (!userData?.consents?.termsAccepted || !userData?.consents?.privacyAccepted) {
    throw new Error('Veuillez accepter les conditions et la politique de confidentialite')
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        legal_version: LEGAL_VERSION,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString()
      }
    }
  })

  if (authError) throw authError

  const hasAuthenticatedSession = Boolean(authData?.session?.access_token)

  if (!hasAuthenticatedSession) {
    return {
      user: authData.user,
      advisor: null,
      requiresEmailConfirmation: true
    }
  }

  const advisor = await ensureAdvisorForAuthenticatedEmail({
    email: userData.email,
    name: userData.name,
    company: userData.company,
    phone: userData.phone || null,
    marketingOptIn: Boolean(userData?.consents?.marketingOptIn)
  })

  return {
    user: authData.user,
    advisor,
    requiresEmailConfirmation: false
  }
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

export const reauthenticateUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export const getMfaStatus = async () => {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error

  const factors = [
    ...(data?.all || []),
    ...(data?.totp || []),
    ...(data?.phone || [])
  ]

  return {
    factors,
    verifiedCount: factors.filter((factor) => factor.status === 'verified').length
  }
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
