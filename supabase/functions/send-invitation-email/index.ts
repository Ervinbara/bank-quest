// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const parseProviderOrder = () => {
  const raw = Deno.env.get('EMAIL_PROVIDER_ORDER') || 'resend,sendgrid,mailgun,postmark'
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const availableProviders = () => {
  const providers = new Map<string, (payload: any) => Promise<Response>>()

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    providers.set('resend', async (payload) => {
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: payload.from,
          to: [payload.to],
          subject: payload.subject,
          text: payload.body
        })
      })
    })
  }

  const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
  if (sendgridKey) {
    providers.set('sendgrid', async (payload) => {
      return fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: payload.from },
          subject: payload.subject,
          content: [{ type: 'text/plain', value: payload.body }]
        })
      })
    })
  }

  const mailgunKey = Deno.env.get('MAILGUN_API_KEY')
  const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')
  if (mailgunKey && mailgunDomain) {
    providers.set('mailgun', async (payload) => {
      const form = new URLSearchParams()
      form.set('from', payload.from)
      form.set('to', payload.to)
      form.set('subject', payload.subject)
      form.set('text', payload.body)

      return fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunKey}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
      })
    })
  }

  const postmarkKey = Deno.env.get('POSTMARK_SERVER_TOKEN')
  if (postmarkKey) {
    providers.set('postmark', async (payload) => {
      return fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'X-Postmark-Server-Token': postmarkKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          From: payload.from,
          To: payload.to,
          Subject: payload.subject,
          TextBody: payload.body
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
        return json({ success: true, provider })
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
