import { supabase } from '@/lib/supabase'
import { FunctionsHttpError } from '@supabase/supabase-js'

export const INVITE_LINK_PLACEHOLDER = '{{invite_link}}'

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: 'Invitation quiz Bank Quest - {{client_name}}',
  body: `Bonjour {{client_name}},

{{advisor_name}} vous invite a completer votre quiz Bank Quest.

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
  const rendered = renderEmailTemplate(template || DEFAULT_EMAIL_TEMPLATE, {
    clientName,
    advisorName,
    advisorEmail,
    inviteLink
  })

  let data
  let error

  try {
    const response = await supabase.functions.invoke('send-invitation-email', {
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
    if (invokeError instanceof FunctionsHttpError) {
      const context = invokeError.context
      try {
        const body = await context.json()
        throw new Error(body?.error || "Echec de l'envoi email")
      } catch {
        throw new Error("Edge Function non disponible ou mal configuree")
      }
    }
    throw invokeError
  }

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        throw new Error(body?.error || "Echec de l'envoi email")
      } catch {
        throw new Error(error.message || "Echec de l'envoi email")
      }
    }
    throw new Error(error.message || "Echec de l'envoi email")
  }

  if (!data?.success) {
    throw new Error(data?.error || "Echec de l'envoi email")
  }

  return data
}
