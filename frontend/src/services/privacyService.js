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

const getAuthenticatedSession = async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Session utilisateur invalide. Reconnectez-vous puis reessayez.')
  }
  return session
}

const downloadJsonFile = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const exportAdvisorDataAsJson = async (advisor) => {
  if (!advisor?.id) throw new Error('Conseiller introuvable')

  const advisorId = advisor.id

  const [advisorResult, clientsResult, insightsResult, invitationsResult, questionnairesResult, questionnaireQuestionsResult, themesResult, questionBankResult] =
    await Promise.all([
      supabase.from('advisors').select('*').eq('id', advisorId).single(),
      supabase.from('clients').select('*').eq('advisor_id', advisorId),
      supabase
        .from('client_insights')
        .select('*, clients!inner(advisor_id)')
        .eq('clients.advisor_id', advisorId),
      supabase
        .from('client_invitations')
        .select('*, clients!inner(advisor_id)')
        .eq('clients.advisor_id', advisorId),
      supabase.from('advisor_questionnaires').select('*').eq('advisor_id', advisorId),
      supabase
        .from('advisor_questionnaire_questions')
        .select('*, advisor_questionnaires!inner(advisor_id)')
        .eq('advisor_questionnaires.advisor_id', advisorId),
      supabase.from('advisor_question_bank_themes').select('*').eq('advisor_id', advisorId),
      supabase
        .from('advisor_question_bank_questions')
        .select('*, advisor_question_bank_themes!inner(advisor_id)')
        .eq('advisor_question_bank_themes.advisor_id', advisorId)
    ])

  const errors = [
    advisorResult.error,
    clientsResult.error,
    insightsResult.error,
    invitationsResult.error,
    questionnairesResult.error,
    questionnaireQuestionsResult.error,
    themesResult.error,
    questionBankResult.error
  ].filter(Boolean)

  if (errors.length > 0) {
    throw errors[0]
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    advisor: advisorResult.data,
    clients: clientsResult.data || [],
    clientInsights: (insightsResult.data || []).map((item) => {
      const cleaned = { ...item }
      delete cleaned.clients
      return cleaned
    }),
    clientInvitations: (invitationsResult.data || []).map((item) => {
      const cleaned = { ...item }
      delete cleaned.clients
      return cleaned
    }),
    questionnaires: questionnairesResult.data || [],
    questionnaireQuestions: (questionnaireQuestionsResult.data || []).map((item) => {
      const cleaned = { ...item }
      delete cleaned.advisor_questionnaires
      return cleaned
    }),
    questionBankThemes: themesResult.data || [],
    questionBankQuestions: (questionBankResult.data || []).map((item) => {
      const cleaned = { ...item }
      delete cleaned.advisor_question_bank_themes
      return cleaned
    })
  }

  const safeEmail = String(advisor.email || 'advisor').replace(/[^a-z0-9@._-]/gi, '_')
  const fileName = `finmate-export-${safeEmail}-${new Date().toISOString().slice(0, 10)}.json`
  downloadJsonFile(fileName, exportPayload)
  return exportPayload
}

export const deleteAdvisorAccount = async () => {
  const session = await getAuthenticatedSession()

  try {
    const response = await supabase.functions.invoke('delete-account', {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: {}
    })

    if (response.error) {
      const details = await extractFunctionErrorMessage(response.error, 'Suppression du compte impossible')
      throw new Error(details)
    }

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Suppression du compte impossible')
    }
  } catch (invokeError) {
    const details = await extractFunctionErrorMessage(invokeError, 'Suppression du compte impossible')
    throw new Error(details)
  }
}
