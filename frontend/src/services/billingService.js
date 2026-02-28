import { supabase } from '@/lib/supabase'

const extractFunctionErrorMessage = async (fnError, fallbackMessage) => {
  const context = fnError?.context
  if (!context) return fnError?.message || fallbackMessage

  try {
    const clone = context.clone ? context.clone() : context
    const asJson = await clone.json()
    return asJson?.error || asJson?.message || fnError?.message || fallbackMessage
  } catch {
    try {
      const asText = await context.text()
      if (!asText) return fnError?.message || fallbackMessage
      try {
        const parsed = JSON.parse(asText)
        return parsed?.error || parsed?.message || fnError?.message || fallbackMessage
      } catch {
        return asText
      }
    } catch {
      return fnError?.message || fallbackMessage
    }
  }
}

const invokeFunction = async (name, body, fallbackError) => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Session utilisateur invalide. Reconnectez-vous puis reessayez.')
  }

  try {
    const response = await supabase.functions.invoke(name, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      body
    })

    if (response.error) {
      const details = await extractFunctionErrorMessage(response.error, fallbackError)
      throw new Error(details)
    }

    if (!response.data?.success || !response.data?.url) {
      throw new Error(response.data?.error || fallbackError)
    }

    return response.data.url
  } catch (invokeError) {
    const details = await extractFunctionErrorMessage(invokeError, fallbackError)
    throw new Error(details)
  }
}

const invokeJsonFunction = async (name, body, fallbackError) => {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Session utilisateur invalide. Reconnectez-vous puis reessayez.')
  }

  try {
    const response = await supabase.functions.invoke(name, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      },
      body
    })

    if (response.error) {
      const details = await extractFunctionErrorMessage(response.error, fallbackError)
      throw new Error(details)
    }

    return response.data
  } catch (invokeError) {
    const details = await extractFunctionErrorMessage(invokeError, fallbackError)
    throw new Error(details)
  }
}

export const createStripeCheckoutSession = async (plan) => {
  const planId = String(plan || '').trim().toLowerCase()
  if (!['solo', 'pro', 'cabinet', 'test'].includes(planId)) {
    throw new Error('Plan Stripe invalide')
  }
  return invokeFunction('stripe-checkout', { plan: planId }, 'Impossible de creer la session de paiement')
}

export const createStripeCustomerPortalSession = async () => {
  return invokeFunction('stripe-customer-portal', {}, 'Impossible de creer la session portail')
}

export const syncStripeSubscription = async () => {
  return invokeJsonFunction('stripe-sync-subscription', {}, 'Impossible de synchroniser l abonnement Stripe')
}
