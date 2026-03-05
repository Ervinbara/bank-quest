// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const parseProviderOrder = () => {
  const raw = Deno.env.get('EMAIL_PROVIDER_ORDER') || 'mailjet,brevo'
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const PLAN_EMAIL_LIMITS: Record<string, number | null> = {
  none: 0,
  solo: 100,
  pro: 500,
  cabinet: 2000,
  test: null
}

const getCurrentMonthStartDate = () => {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return monthStart.toISOString().slice(0, 10)
}

const availableProviders = () => {
  const providers = new Map<string, (payload: any) => Promise<Response>>()

  const mailjetApiKey = Deno.env.get('MAILJET_API_KEY')
  const mailjetSecretKey = Deno.env.get('MAILJET_SECRET_KEY')
  if (mailjetApiKey && mailjetSecretKey) {
    providers.set('mailjet', async (payload) => {
      return fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${mailjetApiKey}:${mailjetSecretKey}`)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Messages: [
            {
              From: { Email: payload.from },
              To: [{ Email: payload.to }],
              Subject: payload.subject,
              TextPart: payload.body
            }
          ]
        })
      })
    })
  }

  const brevoKey = Deno.env.get('BREVO_API_KEY')
  if (brevoKey) {
    providers.set('brevo', async (payload) => {
      return fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: payload.from },
          to: [{ email: payload.to }],
          subject: payload.subject,
          textContent: payload.body
        })
      })
    })
  }

  return providers
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    if (!token) {
      return json({ success: false, error: 'Token utilisateur manquant' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ success: false, error: 'Configuration Supabase incomplete' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user?.email) {
      return json({ success: false, error: 'Session invalide' }, 401)
    }

    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id, plan')
      .ilike('email', userData.user.email)
      .maybeSingle()

    if (advisorError) {
      return json({ success: false, error: String(advisorError.message || advisorError) }, 500)
    }

    const plan = String(advisor?.plan || 'none').toLowerCase()
    const monthlyLimit =
      PLAN_EMAIL_LIMITS[plan] !== undefined ? PLAN_EMAIL_LIMITS[plan] : PLAN_EMAIL_LIMITS.none

    if (monthlyLimit === 0) {
      return json(
        {
          success: false,
          error: "L'envoi d'email d'invitation est reserve aux plans payants."
        },
        403
      )
    }

    const usageMonth = getCurrentMonthStartDate()
    let currentMonthSent = 0
    if (monthlyLimit !== null) {
      const { data: usageRow, error: usageError } = await supabase
        .from('advisor_email_usage')
        .select('emails_sent')
        .eq('advisor_id', advisor.id)
        .eq('usage_month', usageMonth)
        .maybeSingle()

      if (usageError) {
        return json({ success: false, error: String(usageError.message || usageError) }, 500)
      }

      currentMonthSent = Number(usageRow?.emails_sent || 0)
      if (currentMonthSent >= monthlyLimit) {
        return json(
          {
            success: false,
            error: `Quota mensuel atteint pour le plan ${plan}: ${monthlyLimit} emails d'invitation/mois.`
          },
          403
        )
      }
    }

    const payload = await req.json()
    const toEmail = String(payload.toEmail || '').trim()
    const subject = String(payload.subject || '').trim()
    const body = String(payload.body || '').trim()
    const advisorEmail = String(payload.advisorEmail || '').trim()

    if (!toEmail || !subject || !body) {
      return json({ success: false, error: 'Payload email incomplet' }, 400)
    }

    const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || advisorEmail || 'no-reply@bankquest.local'
    const order = parseProviderOrder()
    const providers = availableProviders()

    if (providers.size === 0) {
      return json(
        {
          success: false,
          error: 'Aucun provider email configure. Configurez au moins une cle API.'
        },
        500
      )
    }

    const finalOrder = order.filter((provider) => providers.has(provider))
    if (finalOrder.length === 0) {
      return json(
        {
          success: false,
          error: "Aucun provider valide dans EMAIL_PROVIDER_ORDER. Utilisez 'mailjet,brevo'."
        },
        500
      )
    }
    const tried: Array<{ provider: string; status: number; response: string }> = []

    for (const provider of finalOrder) {
      const send = providers.get(provider)
      if (!send) continue

      const response = await send({
        to: toEmail,
        subject,
        body,
        from: fromAddress
      })

      if (response.ok) {
        if (monthlyLimit !== null) {
          const { error: incrementError } = await supabase.rpc('increment_advisor_email_usage', {
            p_advisor_id: advisor.id,
            p_usage_month: usageMonth,
            p_delta: 1
          })
          if (incrementError) {
            console.error('Failed to increment invitation-email usage:', incrementError)
          }
        }

        return json({
          success: true,
          provider,
          usageMonth,
          monthlyLimit,
          sentThisMonth: monthlyLimit === null ? null : currentMonthSent + 1
        })
      }

      tried.push({
        provider,
        status: response.status,
        response: await response.text()
      })
    }

    return json(
      {
        success: false,
        error: 'Tous les providers ont echoue',
        tried
      },
      502
    )
  } catch (error) {
    return json({ success: false, error: String(error?.message || error) }, 500)
  }
})
