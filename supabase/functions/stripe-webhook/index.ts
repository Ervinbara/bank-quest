// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import Stripe from 'npm:stripe@16.10.0'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

const planFromPriceId = (priceId: string | null) => {
  const map = new Map([
    [Deno.env.get('STRIPE_PRICE_SOLO_MONTHLY') || '', 'solo'],
    [Deno.env.get('STRIPE_PRICE_PRO_MONTHLY') || '', 'pro'],
    [Deno.env.get('STRIPE_PRICE_CABINET_MONTHLY') || '', 'cabinet']
  ])
  return (priceId && map.get(priceId)) || 'solo'
}

const extractPriceId = (subscription: any) =>
  subscription?.items?.data?.[0]?.price?.id || subscription?.items?.data?.[0]?.plan?.id || null

const toIso = (unixSeconds?: number | null) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Configuration webhook incomplete' }, 500)
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const signature = req.headers.get('stripe-signature')
    if (!signature) return json({ error: 'Signature Stripe manquante' }, 400)

    const rawBody = await req.text()
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret)

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      let customerId: string | null = null
      let subscriptionId: string | null = null
      let status = 'inactive'
      let priceId: string | null = null
      let currentPeriodEnd: string | null = null

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        customerId = String(session.customer || '')
        subscriptionId = String(session.subscription || '')
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          status = subscription.status || 'active'
          priceId = extractPriceId(subscription)
          currentPeriodEnd = toIso(subscription.current_period_end)
        } else {
          status = 'active'
        }
      } else {
        const subscription = event.data.object as Stripe.Subscription
        customerId = String(subscription.customer || '')
        subscriptionId = String(subscription.id || '')
        status = subscription.status || 'inactive'
        priceId = extractPriceId(subscription)
        currentPeriodEnd = toIso(subscription.current_period_end)
      }

      if (customerId) {
        const plan = planFromPriceId(priceId)
        const finalStatus = status === 'canceled' ? 'inactive' : status

        const updates: Record<string, unknown> = {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId || null,
          stripe_price_id: priceId,
          subscription_status: finalStatus,
          current_period_end: currentPeriodEnd
        }

        if (['active', 'trialing', 'past_due', 'unpaid'].includes(finalStatus)) {
          updates.plan = plan
        }

        if (finalStatus === 'inactive') {
          updates.plan = 'solo'
        }

        const { data: byCustomerRows, error } = await supabase
          .from('advisors')
          .update(updates)
          .eq('stripe_customer_id', customerId)
          .select('id')

        if (error || !byCustomerRows || byCustomerRows.length === 0) {
          // Fallback: conseiller pas encore associe au customer_id -> tenter via metadata advisor_id
          const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null
          const advisorId = (subscription?.metadata?.advisor_id as string | undefined) || null
          if (!advisorId) {
            if (error) throw error
          } else {
            const { error: byAdvisorError } = await supabase
              .from('advisors')
              .update(updates)
              .eq('id', advisorId)
            if (byAdvisorError) throw byAdvisorError
          }
        }
      }
    }

    return json({ received: true })
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 400)
  }
})
