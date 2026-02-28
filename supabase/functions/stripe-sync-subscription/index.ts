// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@16.10.0'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

const resolveStripeMode = () => {
  const raw = String(Deno.env.get('STRIPE_MODE') || 'test').trim().toLowerCase()
  return raw === 'live' ? 'live' : 'test'
}

const resolveStripeEnv = (baseName: string, mode: 'test' | 'live') => {
  const preferredName = `${baseName}_${mode.toUpperCase()}`
  const preferredValue = Deno.env.get(preferredName)
  if (preferredValue) return preferredValue

  const legacyValue = Deno.env.get(baseName)
  if (legacyValue) return legacyValue

  return null
}

const planFromPriceId = (priceId: string | null, mode: 'test' | 'live') => {
  const map = new Map([
    [resolveStripeEnv('STRIPE_PRICE_SOLO_MONTHLY', mode) || '', 'solo'],
    [resolveStripeEnv('STRIPE_PRICE_PRO_MONTHLY', mode) || '', 'pro'],
    [resolveStripeEnv('STRIPE_PRICE_CABINET_MONTHLY', mode) || '', 'cabinet'],
    [resolveStripeEnv('STRIPE_PRICE_TEST_MONTHLY', mode) || '', 'test']
  ])
  return (priceId && map.get(priceId)) || 'none'
}

const extractPriceId = (subscription: any) =>
  subscription?.items?.data?.[0]?.price?.id || subscription?.items?.data?.[0]?.plan?.id || null

const toIso = (unixSeconds?: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Token utilisateur manquant' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeMode = resolveStripeMode()
    const stripeSecret = resolveStripeEnv('STRIPE_SECRET_KEY', stripeMode)

    if (!supabaseUrl || !serviceRoleKey || !stripeSecret) {
      return json({ error: 'Configuration serveur Stripe incomplete' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user?.email) return json({ error: 'Session invalide' }, 401)

    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, stripe_customer_id')
      .eq('email', userData.user.email)
      .single()

    if (advisorError || !advisor) return json({ error: 'Conseiller introuvable' }, 404)

    if (!advisor.stripe_customer_id) {
      await supabase
        .from('advisors')
        .update({
          plan: 'none',
          subscription_status: 'inactive',
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
          subscription_started_at: null,
          cancel_at_period_end: false,
          cancel_at: null,
          canceled_at: null,
          subscription_ended_at: null,
          subscription_updated_at: new Date().toISOString()
        })
        .eq('id', advisor.id)

      return json({ success: true, synced: true, status: 'inactive' })
    }

    try {
      await stripe.customers.retrieve(advisor.stripe_customer_id)
    } catch (customerError: any) {
      const message = String(customerError?.message || '')
      if (message.includes('No such customer')) {
        await supabase
          .from('advisors')
          .update({
            stripe_customer_id: null,
            plan: 'none',
            subscription_status: 'inactive',
            stripe_subscription_id: null,
            stripe_price_id: null,
            current_period_start: null,
            current_period_end: null,
            subscription_started_at: null,
            cancel_at_period_end: false,
            cancel_at: null,
            canceled_at: null,
            subscription_ended_at: null,
            subscription_updated_at: new Date().toISOString()
          })
          .eq('id', advisor.id)

        return json({ success: true, synced: true, status: 'inactive' })
      }
      throw customerError
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: advisor.stripe_customer_id,
      status: 'all',
      limit: 10
    })

    const sorted = [...(subscriptions.data || [])].sort((a, b) => (b.created || 0) - (a.created || 0))
    const latest = sorted[0] || null

    if (!latest) {
      await supabase
        .from('advisors')
        .update({
          plan: 'none',
          subscription_status: 'inactive',
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
          subscription_started_at: null,
          cancel_at_period_end: false,
          cancel_at: null,
          canceled_at: null,
          subscription_ended_at: null,
          subscription_updated_at: new Date().toISOString()
        })
        .eq('id', advisor.id)

      return json({ success: true, synced: true, status: 'inactive' })
    }

    const rawStatus = latest.status || 'inactive'
    const finalStatus = rawStatus === 'canceled' ? 'inactive' : rawStatus
    const priceId = extractPriceId(latest)
    const plan = planFromPriceId(priceId, stripeMode)
    const currentPeriodStart = toIso(latest.current_period_start)
    const currentPeriodEnd = toIso(latest.current_period_end)
    const subscriptionStartedAt = toIso(latest.start_date)
    const cancelAtPeriodEnd = Boolean(latest.cancel_at_period_end)
    const cancelAt = toIso(latest.cancel_at)
    const canceledAt = toIso(latest.canceled_at)
    const endedAt = finalStatus === 'inactive'
      ? (canceledAt || currentPeriodEnd || new Date().toISOString())
      : null

    const updates: Record<string, unknown> = {
      stripe_subscription_id: String(latest.id || '') || null,
      stripe_price_id: priceId,
      subscription_status: finalStatus,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      subscription_started_at: subscriptionStartedAt,
      cancel_at_period_end: cancelAtPeriodEnd,
      cancel_at: cancelAt,
      canceled_at: canceledAt,
      subscription_ended_at: endedAt,
      subscription_updated_at: new Date().toISOString()
    }

    if (finalStatus === 'inactive') {
      updates.plan = 'none'
    } else if (plan !== 'none') {
      updates.plan = plan
    }

    const { error: updateError } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', advisor.id)

    if (updateError) throw updateError

    return json({ success: true, synced: true, status: finalStatus, plan: updates.plan || null })
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 500)
  }
})
