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

  // Compatibilite ancienne config: STRIPE_SECRET_KEY, STRIPE_PRICE_* sans suffixe
  const legacyValue = Deno.env.get(baseName)
  if (legacyValue) return legacyValue

  return null
}

const PLAN_TO_PRICE_ENV_BASE: Record<string, string> = {
  solo: 'STRIPE_PRICE_SOLO_MONTHLY',
  pro: 'STRIPE_PRICE_PRO_MONTHLY',
  cabinet: 'STRIPE_PRICE_CABINET_MONTHLY'
}

const getPriceIdForPlan = (plan: string, mode: 'test' | 'live') => {
  const envBase = PLAN_TO_PRICE_ENV_BASE[plan]
  if (!envBase) throw new Error(`Plan inconnu: ${plan}`)
  const priceId = resolveStripeEnv(envBase, mode)
  if (!priceId) throw new Error(`Variable manquante: ${envBase}_${mode.toUpperCase()}`)
  return priceId
}

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
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

    if (!supabaseUrl || !serviceRoleKey || !stripeSecret) {
      return json({ error: 'Configuration serveur Stripe incomplete' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user?.email) return json({ error: 'Session invalide' }, 401)

    const email = userData.user.email
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, email, name, stripe_customer_id')
      .eq('email', email)
      .single()

    if (advisorError || !advisor) return json({ error: 'Conseiller introuvable' }, 404)

    const payload = await req.json()
    const plan = String(payload?.plan || '').trim().toLowerCase()
    if (!['solo', 'pro', 'cabinet'].includes(plan)) return json({ error: 'Plan invalide' }, 400)

    const priceId = getPriceIdForPlan(plan, stripeMode)

    let customerId = advisor.stripe_customer_id || ''
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: advisor.email,
        name: advisor.name || advisor.email,
        metadata: { advisor_id: advisor.id }
      })
      customerId = customer.id
      await supabase.from('advisors').update({ stripe_customer_id: customerId }).eq('id', advisor.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          advisor_id: advisor.id,
          plan
        }
      },
      success_url: `${appUrl}/dashboard/settings?checkout=success`,
      cancel_url: `${appUrl}/dashboard/settings?checkout=cancel`,
      metadata: {
        advisor_id: advisor.id,
        plan
      }
    })

    return json({ success: true, url: session.url })
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 500)
  }
})
