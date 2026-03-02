import { supabase } from '@/lib/supabase'

// Connexion
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  // Récupérer les infos du conseiller
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
  // 1. Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password
  })

  if (authError) throw authError

  // 2. Créer le profil conseiller
  const { data: advisor, error: advisorError } = await supabase
    .from('advisors')
    .insert([{
      email: userData.email,
      name: userData.name,
      company: userData.company,
      phone: userData.phone || null
    }])
    .select()
    .single()

  if (advisorError) throw advisorError

  return { user: authData.user, advisor }
}

// Déconnexion
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const isUserAuthenticated = async () => {
  try {
    const session = await getSession()
    return !!session?.user
  } catch (error) {
    return false
  }
}

export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return data.session
}

// Récupérer la session actuelle
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
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
  if (password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caractères'
  }
  return null
}

// Générer les initiales
export const getUserInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

