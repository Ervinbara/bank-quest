import { supabase } from '@/lib/supabase'
import { FUNNEL_ACTIONS, recordFunnelMilestone } from '@/services/auditService'

const LEGAL_VERSION = '2026-03-02'
const AUTH_CALLBACK_PATH = '/auth/callback'

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const buildAuthCallbackUrl = (nextPath = '/dashboard') => {
  const next = typeof nextPath === 'string' && nextPath.trim() ? nextPath.trim() : '/dashboard'
  return `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}`
}

const normalizeAuthError = (error) => {
  const rawMessage = String(error?.message || '').trim()
  const message = rawMessage.toLowerCase()

  if (!rawMessage) return 'Une erreur de connexion est survenue'
  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Email non confirme. Verifiez votre boite mail ou renvoyez un email de confirmation.'
  }
  if (message.includes('invalid login credentials')) {
    return 'Identifiants invalides'
  }
  if (message.includes('invalid jwt')) {
    return 'Session invalide. Reconnectez-vous.'
  }
  if (message.includes('user already registered')) {
    return 'Un compte existe deja avec cet email'
  }

  return rawMessage
}

const buildAdvisorPayload = ({
  email,
  name,
  company,
  phone = null,
  marketingOptIn = false
}) => {
  const acceptedAt = new Date().toISOString()
  return {
    email: normalizeEmail(email),
    name,
    company,
    phone,
    terms_version: LEGAL_VERSION,
    privacy_policy_version: LEGAL_VERSION,
    terms_accepted_at: acceptedAt,
    privacy_accepted_at: acceptedAt,
    marketing_opt_in: Boolean(marketingOptIn),
    gamification_enabled: false,
    gamification_updated_at: acceptedAt,
    smart_alerts_enabled: true,
    smart_alerts_delay_days: 7,
    smart_alerts_updated_at: acceptedAt,
    product_instrumentation_enabled: false,
    product_instrumentation_updated_at: acceptedAt
  }
}

const ensureAdvisorForAuthenticatedEmail = async ({
  email,
  name,
  company,
  phone = null,
  marketingOptIn = false,
  funnelSource = 'auth'
}) => {
  const normalizedEmail = normalizeEmail(email)
  const { data: existing, error: existingError } = await supabase
    .from('advisors')
    .select('*')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  const payload = buildAdvisorPayload({ email: normalizedEmail, name, company, phone, marketingOptIn })
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .insert([payload])
    .select()
    .single()

  if (advisorError) throw advisorError
  await recordFunnelMilestone(FUNNEL_ACTIONS.SIGNUP_COMPLETED, {
    advisorId: advisor.id,
    metadata: {
      source: funnelSource
    }
  })
  return advisor
}

// Connexion
export const login = async (email, password) => {
  try {
    const normalizedEmail = normalizeEmail(email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    if (error) throw error

    let advisor = null
    try {
      advisor = await ensureAdvisorForAuthenticatedEmail({
        email: normalizedEmail,
        name:
          data?.user?.user_metadata?.full_name ||
          data?.user?.user_metadata?.name ||
          normalizedEmail.split('@')[0],
        company: data?.user?.user_metadata?.company || 'FinMate Advisor',
        phone: null,
        marketingOptIn: false,
        funnelSource: 'password_login'
      })
    } catch (profileError) {
      console.warn('Unable to upsert advisor profile after login:', profileError?.message || profileError)
    }

    return { user: data.user, advisor }
  } catch (error) {
    throw new Error(normalizeAuthError(error))
  }
}

// Connexion Google OAuth
export const loginWithGoogle = async () => {
  try {
    const redirectTo = buildAuthCallbackUrl('/dashboard')
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
  } catch (error) {
    throw new Error(normalizeAuthError(error))
  }
}

// Inscription
export const register = async (userData) => {
  try {
    if (!userData?.consents?.termsAccepted || !userData?.consents?.privacyAccepted) {
      throw new Error('Veuillez accepter les conditions et la politique de confidentialite')
    }

    const normalizedEmail = normalizeEmail(userData.email)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: userData.password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl('/dashboard'),
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

    let advisor = null
    try {
      advisor = await ensureAdvisorForAuthenticatedEmail({
        email: normalizedEmail,
        name: userData.name,
        company: userData.company,
        phone: userData.phone || null,
        marketingOptIn: Boolean(userData?.consents?.marketingOptIn),
        funnelSource: 'password_signup'
      })
    } catch (profileError) {
      console.warn('Unable to upsert advisor profile after signup:', profileError?.message || profileError)
    }

    return {
      user: authData.user,
      advisor,
      requiresEmailConfirmation: false
    }
  } catch (error) {
    throw new Error(normalizeAuthError(error))
  }
}

// Deconnexion
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const resendSignupConfirmation = async (email) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) throw new Error("L'email est requis")

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: buildAuthCallbackUrl('/dashboard')
    }
  })

  if (error) {
    throw new Error(normalizeAuthError(error))
  }

  return { success: true }
}

export const ensureAdvisorProfileForUser = async (authUser) => {
  const email = normalizeEmail(authUser?.email)
  if (!email) return null

  return ensureAdvisorForAuthenticatedEmail({
    email,
    name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || email.split('@')[0],
    company: authUser?.user_metadata?.company || authUser?.user_metadata?.hd || 'FinMate Advisor',
    phone: null,
    marketingOptIn: false,
    funnelSource: 'oauth_or_session'
  })
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
