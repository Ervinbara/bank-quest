import { supabase } from '@/lib/supabase'
import { getPlanAccess, getRemainingInvitationEmails } from '@/lib/planAccess'
import { runWithNetworkGuard } from '@/lib/networkGuard'

export const INVITE_LINK_PLACEHOLDER = '{{invite_link}}'

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Invitation questionnaire FinMate - {{client_name}}',
  body: `Bonjour {{client_name}},

{{advisor_name}} vous invite a completer votre questionnaire FinMate.

Cliquez ici pour demarrer:
{{invite_link}}

Ce lien vous permettra de repondre au questionnaire en quelques minutes.

Cordialement,
{{advisor_name}}`
}

const normalizeTemplate = (template) => ({
  subject: (template?.subject || '').trim(),
  body: (template?.body || '').trim()
})

export const validateEmailTemplate = (template) => {
  const cleaned = normalizeTemplate(template)

  if (!cleaned.subject) {
    throw new Error("L'objet du mail est requis")
  }

  if (!cleaned.body) {
    throw new Error('Le contenu du mail est requis')
  }

  if (!cleaned.body.includes(INVITE_LINK_PLACEHOLDER)) {
    throw new Error(`Le contenu doit obligatoirement contenir ${INVITE_LINK_PLACEHOLDER}`)
  }

  return cleaned
}

export const renderEmailTemplate = (template, variables) => {
  const cleaned = validateEmailTemplate(template)
  const replacements = {
    '{{client_name}}': variables?.clientName || '',
    '{{advisor_name}}': variables?.advisorName || '',
    '{{advisor_email}}': variables?.advisorEmail || '',
    '{{invite_link}}': variables?.inviteLink || ''
  }

  const replaceAllTokens = (value) =>
    Object.entries(replacements).reduce((output, [token, tokenValue]) => {
      return output.replaceAll(token, tokenValue)
    }, value)

  return {
    subject: replaceAllTokens(cleaned.subject),
    body: replaceAllTokens(cleaned.body)
  }
}

export const getAdvisorEmailTemplate = async (advisorId) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const { data, error } = await supabase
    .from('advisor_email_templates')
    .select('subject, body')
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (error) {
    const message = String(error?.message || '').toLowerCase()
    if (message.includes("could not find the table 'public.advisor_email_templates'")) {
      return DEFAULT_EMAIL_TEMPLATE
    }
    throw error
  }

  return data || DEFAULT_EMAIL_TEMPLATE
}

export const saveAdvisorEmailTemplate = async (advisorId, template) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  const cleaned = validateEmailTemplate(template)

  const { data, error } = await supabase
    .from('advisor_email_templates')
    .upsert([{ advisor_id: advisorId, ...cleaned }], { onConflict: 'advisor_id' })
    .select('subject, body')
    .single()

  if (error) {
    const message = String(error?.message || '').toLowerCase()
    if (message.includes("could not find the table 'public.advisor_email_templates'")) {
      throw new Error('Migration email templates manquante (004_advisor_email_templates.sql)')
    }
    throw error
  }

  return data
}

export const sendInvitationEmail = async ({
  toEmail,
  clientName,
  advisorName,
  advisorEmail,
  inviteLink,
  template
}) => {
  return runWithNetworkGuard(
    async () => {
      const rendered = renderEmailTemplate(template || DEFAULT_EMAIL_TEMPLATE, {
        clientName,
        advisorName,
        advisorEmail,
        inviteLink
      })

      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Session utilisateur invalide. Reconnectez-vous puis reessayez.')
      }

      const {
        data: { user }
      } = await supabase.auth.getUser()
      const email = String(user?.email || '').toLowerCase()
      if (!email) {
        throw new Error('Session utilisateur invalide. Reconnectez-vous puis reessayez.')
      }

      const { data: advisor, error: advisorError } = await supabase
        .from('advisors')
        .select('plan')
        .ilike('email', email)
        .maybeSingle()

      if (advisorError) throw advisorError

      const planAccess = getPlanAccess(advisor?.plan || 'none')
      if (!planAccess.canSendInvitationEmails) {
        throw new Error("L'envoi d'email d'invitation est reserve aux plans payants.")
      }

      let data
      let error

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

      try {
        const response = await supabase.functions.invoke('send-invitation-email', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: {
            toEmail,
            clientName,
            advisorName,
            advisorEmail,
            inviteLink,
            subject: rendered.subject,
            body: rendered.body
          }
        })
        data = response.data
        error = response.error
      } catch (invokeError) {
        const details = await extractFunctionErrorMessage(
          invokeError,
          "Edge Function non disponible ou mal configuree"
        )
        throw new Error(details)
      }

      if (error) {
        const details = await extractFunctionErrorMessage(error, "Echec de l'envoi email")
        throw new Error(details)
      }

      if (!data?.success) {
        throw new Error(data?.error || "Echec de l'envoi email")
      }

      return data
    },
    {
      timeoutMs: 20000,
      timeoutMessage: "L'envoi de l'email prend trop de temps",
      fallbackMessage: "Impossible d'envoyer l'email d'invitation"
    }
  )
}

export const getInvitationEmailQuotaStatus = async ({ advisorId, advisorPlan }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const planAccess = getPlanAccess(advisorPlan || 'none')
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10)

  const { data, error } = await supabase
    .from('advisor_email_usage')
    .select('emails_sent')
    .eq('advisor_id', advisorId)
    .eq('usage_month', monthStart)
    .maybeSingle()

  if (error) {
    const message = String(error?.message || '').toLowerCase()
    if (message.includes("could not find the table 'public.advisor_email_usage'")) {
      return {
        sentThisMonth: 0,
        monthlyLimit: planAccess.monthlyInvitationEmailLimit,
        remaining:
          planAccess.monthlyInvitationEmailLimit === null
            ? null
            : getRemainingInvitationEmails({ plan: planAccess.code, sentCount: 0 })
      }
    }
    throw error
  }

  const sentThisMonth = Number(data?.emails_sent || 0)
  return {
    sentThisMonth,
    monthlyLimit: planAccess.monthlyInvitationEmailLimit,
    remaining: getRemainingInvitationEmails({
      plan: planAccess.code,
      sentCount: sentThisMonth
    })
  }
}
