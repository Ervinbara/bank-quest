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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Token utilisateur manquant' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

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
    if (!advisor.stripe_customer_id) return json({ error: 'Aucun client Stripe associe' }, 400)

    const session = await stripe.billingPortal.sessions.create({
      customer: advisor.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings?portal=return`
    })

    return json({ success: true, url: session.url })
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 500)
  }
})
