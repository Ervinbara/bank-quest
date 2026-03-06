import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getPlanAccess, getRemainingClientSlots } from '@/lib/planAccess'
import { FUNNEL_ACTIONS, recordFunnelMilestone } from '@/services/auditService'

const generateInvitationToken = () => {
  const array = new Uint8Array(16)
  window.crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const normalizeEmail = (email) => (email || '').trim().toLowerCase()
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const buildInviteUrl = (clientId, token) => {
  if (!clientId || !token) return `${window.location.origin}/quiz`
  return `${window.location.origin}/quiz/${token}`
}
const buildLegacyToken = (clientId) => `legacy-${String(clientId).replaceAll('-', '')}`
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const createQuizSupabaseClient = (token) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'x-quiz-token': token
      }
    }
  })

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

const getAdvisorPlanInfo = async (advisorId) => {
  if (!advisorId) {
    return {
      plan: 'none',
      access: getPlanAccess('none')
    }
  }

  const { data, error } = await supabase
    .from('advisors')
    .select('plan')
    .eq('id', advisorId)
    .maybeSingle()

  if (error) throw error

  const plan = data?.plan || 'none'
  return {
    plan,
    access: getPlanAccess(plan)
  }
}

const getAdvisorClientCount = async (advisorId) => {
  const { count, error } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('advisor_id', advisorId)

  if (error) throw error
  return count || 0
}

const isMissingInvitationsTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_invitations'") ||
    message.includes('relation "public.client_invitations" does not exist')
  )
}

const isMissingInvitationQuestionnaireColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return message.includes("column 'questionnaire_id' does not exist") || message.includes('questionnaire_id')
}

const isMissingQuestionnairesTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.advisor_questionnaires'") ||
    message.includes('relation "public.advisor_questionnaires" does not exist')
  )
}

const isMissingInvitationLinksTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_invitation_links'") ||
    message.includes('relation "public.client_invitation_links" does not exist')
  )
}

const isMissingQuizSessionsTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_quiz_sessions'") ||
    message.includes('relation "public.client_quiz_sessions" does not exist')
  )
}

const isMissingSessionAnswersColumnError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return message.includes("column 'question_answers' does not exist") || message.includes('question_answers')
}

const isMissingClientFollowupEventsTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_followup_events'") ||
    message.includes('relation "public.client_followup_events" does not exist')
  )
}

const normalizeInsightArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

const normalizeQuestionAnswers = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item
      const points = Number(row.points)
      return {
        questionId: row.questionId || row.id || null,
        prompt: row.prompt || row.questionText || null,
        concept: row.concept || null,
        theme: row.theme || null,
        answerLabel: row.answerLabel || row.optionLabel || row.answer || null,
        points: Number.isFinite(points) ? points : null
      }
    })
    .filter(Boolean)
}

const buildProgressFromSessions = (sessions) => {
  const safeSessions = Array.isArray(sessions) ? sessions : []
  if (safeSessions.length === 0) {
    return {
      quizSessionCount: 0,
      latestScore: null,
      firstScore: null,
      bestScore: null,
      latestCompletedAt: null,
      progressDelta: null
    }
  }

  const newestFirst = [...safeSessions].sort(
    (a, b) => new Date(b.completed_at || b.created_at || 0).getTime() - new Date(a.completed_at || a.created_at || 0).getTime()
  )
  const scores = newestFirst.map((item) => (typeof item.score === 'number' ? item.score : null)).filter((item) => item !== null)
  const latestScore = scores.length > 0 ? scores[0] : null
  const firstScore = scores.length > 0 ? scores[scores.length - 1] : null
  const bestScore = scores.length > 0 ? Math.max(...scores) : null

  return {
    quizSessionCount: newestFirst.length,
    latestScore,
    firstScore,
    bestScore,
    latestCompletedAt: newestFirst[0]?.completed_at || newestFirst[0]?.created_at || null,
    progressDelta:
      newestFirst.length >= 2 && latestScore !== null && firstScore !== null ? latestScore - firstScore : null,
    sessions: newestFirst
  }
}

const enrichClientWithSessions = async (client) => {
  if (!client?.id) return client

  const { byClientId } = await fetchQuizSessionsByClientIds([client.id])
  let sessions = byClientId.get(client.id) || []

  if (sessions.length === 0 && typeof client?.score === 'number') {
    let latestQuestionnaireName = 'Questionnaire standard'
    let snapshotDate = client.completed_at || client.updated_at || client.created_at

    let { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .select('questionnaire_id, updated_at, created_at')
      .eq('client_id', client.id)
      .maybeSingle()

    if (invitationError && isMissingInvitationQuestionnaireColumnError(invitationError)) {
      const fallback = await supabase
        .from('client_invitations')
        .select('updated_at, created_at')
        .eq('client_id', client.id)
        .maybeSingle()
      invitation = fallback.data
      invitationError = fallback.error
    }

    if (!invitationError && invitation) {
      snapshotDate = invitation.updated_at || invitation.created_at || snapshotDate
      if (invitation.questionnaire_id) {
        const { data: questionnaire } = await supabase
          .from('advisor_questionnaires')
          .select('name')
          .eq('id', invitation.questionnaire_id)
          .maybeSingle()
        if (questionnaire?.name) latestQuestionnaireName = questionnaire.name
      }
    }

    sessions = [
      {
        id: `legacy-${client.id}`,
        client_id: client.id,
        questionnaire_id: null,
        questionnaire_name: latestQuestionnaireName,
        score: client.score,
        strengths: (client.client_insights || [])
          .filter((item) => item.type === 'strength')
          .map((item) => item.concept),
        weaknesses: (client.client_insights || [])
          .filter((item) => item.type === 'weakness')
          .map((item) => item.concept),
        question_answers: [],
        completed_at: snapshotDate,
        created_at: snapshotDate
      }
    ]
  }

  const progress = buildProgressFromSessions(sessions)
  return {
    ...client,
    quiz_sessions: progress.sessions || [],
    quiz_progress: {
      sessionCount: progress.quizSessionCount,
      latestScore: progress.latestScore,
      firstScore: progress.firstScore,
      bestScore: progress.bestScore,
      progressDelta: progress.progressDelta,
      latestCompletedAt: progress.latestCompletedAt
    }
  }
}

const fetchClientFollowupEvents = async (clientId) => {
  if (!clientId) return []
  const { data, error } = await supabase
    .from('client_followup_events')
    .select('id, event_type, followup_status, advisor_notes, metadata, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingClientFollowupEventsTableError(error)) return []
    throw error
  }

  return data || []
}

const fetchQuizSessionsByClientIds = async (clientIds) => {
  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    return { byClientId: new Map(), questionnaireNameById: new Map() }
  }

  let { data: sessions, error } = await supabase
    .from('client_quiz_sessions')
    .select('id, client_id, questionnaire_id, score, strengths, weaknesses, question_answers, completed_at, created_at')
    .in('client_id', clientIds)
    .order('completed_at', { ascending: false })

  if (error && isMissingSessionAnswersColumnError(error)) {
    const fallback = await supabase
      .from('client_quiz_sessions')
      .select('id, client_id, questionnaire_id, score, strengths, weaknesses, completed_at, created_at')
      .in('client_id', clientIds)
      .order('completed_at', { ascending: false })
    sessions = fallback.data
    error = fallback.error
  }

  if (error) {
    if (isMissingQuizSessionsTableError(error)) {
      return { byClientId: new Map(), questionnaireNameById: new Map() }
    }
    throw error
  }

  const safeSessions = sessions || []
  const questionnaireIds = [...new Set(safeSessions.map((item) => item.questionnaire_id).filter(Boolean))]
  const questionnaireNameById = new Map()

  if (questionnaireIds.length > 0) {
    const { data: questionnaires, error: questionnaireError } = await supabase
      .from('advisor_questionnaires')
      .select('id, name')
      .in('id', questionnaireIds)

    if (!questionnaireError) {
      ;(questionnaires || []).forEach((item) => {
        questionnaireNameById.set(item.id, item.name)
      })
    }
  }

  const byClientId = safeSessions.reduce((acc, session) => {
    const existing = acc.get(session.client_id) || []
    existing.push({
      ...session,
      strengths: normalizeInsightArray(session.strengths),
      weaknesses: normalizeInsightArray(session.weaknesses),
      question_answers: normalizeQuestionAnswers(session.question_answers),
      questionnaire_name: session.questionnaire_id
        ? questionnaireNameById.get(session.questionnaire_id) || 'Questionnaire personnalise'
        : 'Questionnaire standard'
    })
    acc.set(session.client_id, existing)
    return acc
  }, new Map())

  return { byClientId, questionnaireNameById }
}

const recordInvitationLinkHistory = async ({
  clientId,
  invitationId = null,
  token,
  questionnaireId = null,
  expiresAt = null,
  createdAt = null
}) => {
  if (!clientId || !token) return

  const { error } = await supabase.from('client_invitation_links').insert({
    client_id: clientId,
    invitation_id: invitationId,
    questionnaire_id: questionnaireId,
    token,
    expires_at: expiresAt,
    created_at: createdAt || new Date().toISOString()
  })

  if (error && !isMissingInvitationLinksTableError(error)) {
    throw error
  }
}

const resolveQuestionnaireIdForInvitation = async (advisorId, questionnaireId) => {
  if (!advisorId) return null

  if (questionnaireId) {
    const { data, error } = await supabase
      .from('advisor_questionnaires')
      .select('id')
      .eq('id', questionnaireId)
      .eq('advisor_id', advisorId)
      .maybeSingle()

    if (error) {
      if (isMissingQuestionnairesTableError(error)) return null
      throw error
    }
    return data?.id || null
  }

  const { data, error } = await supabase
    .from('advisor_questionnaires')
    .select('id')
    .eq('advisor_id', advisorId)
    .eq('is_default', true)
    .maybeSingle()

  if (error) {
    if (isMissingQuestionnairesTableError(error)) return null
    throw error
  }

  if (data?.id) return data.id

  const { data: firstRow, error: firstError } = await supabase
    .from('advisor_questionnaires')
    .select('id')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (firstError) {
    if (isMissingQuestionnairesTableError(firstError)) return null
    throw firstError
  }

  return firstRow?.id || null
}

const getQuestionnaireDetails = async (questionnaireId) => {
  if (!questionnaireId) return null

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from('advisor_questionnaires')
    .select('id, name, description')
    .eq('id', questionnaireId)
    .maybeSingle()

  if (questionnaireError) {
    if (isMissingQuestionnairesTableError(questionnaireError)) return null
    throw questionnaireError
  }
  if (!questionnaire) return null

  const { data: questions, error: questionsError } = await supabase
    .from('advisor_questionnaire_questions')
    .select('id, question_text, concept, theme, order_index, options')
    .eq('questionnaire_id', questionnaireId)
    .order('order_index', { ascending: true })

  if (questionsError) throw questionsError

  return {
    id: questionnaire.id,
    name: questionnaire.name,
    description: questionnaire.description || '',
    questions: (questions || []).map((question) => ({
      id: question.id,
      prompt: question.question_text,
      concept: question.concept,
      theme: question.theme,
      orderIndex: question.order_index,
      options: question.options
    }))
  }
}

const upsertClientInvitation = async (clientId, questionnaireId = null) => {
  const token = generateInvitationToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString() // 14 jours

  let { data, error } = await supabase
    .from('client_invitations')
    .upsert(
      [
        {
          client_id: clientId,
          token,
          questionnaire_id: questionnaireId,
          expires_at: expiresAt,
          revoked_at: null
        }
      ],
      { onConflict: 'client_id' }
    )
    .select('*')
    .single()

  if (error && isMissingInvitationQuestionnaireColumnError(error)) {
    const fallback = await supabase
      .from('client_invitations')
      .upsert(
        [
          {
            client_id: clientId,
            token,
            expires_at: expiresAt,
            revoked_at: null
          }
        ],
        { onConflict: 'client_id' }
      )
      .select('*')
      .single()

    data = fallback.data
    error = fallback.error
  }

  if (error) {
    if (isMissingInvitationsTableError(error)) {
      const legacyToken = buildLegacyToken(clientId)
      return {
        token: legacyToken,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
        inviteUrl: buildInviteUrl(clientId, legacyToken),
        legacyMode: true
      }
    }
    throw error
  }

  await recordInvitationLinkHistory({
    clientId,
    invitationId: data.id || null,
    token: data.token,
    questionnaireId: data.questionnaire_id || null,
    expiresAt: data.expires_at || null,
    createdAt: data.updated_at || data.created_at || null
  })

  return {
    invitationId: data.id || null,
    token: data.token,
    questionnaireId: data.questionnaire_id || null,
    expiresAt: data.expires_at,
    updatedAt: data.updated_at,
    inviteUrl: buildInviteUrl(clientId, data.token),
    legacyMode: false
  }
}

// Récupérer tous les clients d'un conseiller
export const getAdvisorClients = async (advisorId) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_insights (
        id,
        type,
        concept
      )
    `)
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const clients = data || []
  const clientIds = clients.map((client) => client.id)
  const { byClientId } = await fetchQuizSessionsByClientIds(clientIds)

  return clients.map((client) => {
    const sessionProgress = buildProgressFromSessions(byClientId.get(client.id) || [])
    return {
      ...client,
      quiz_session_count: sessionProgress.quizSessionCount,
      quiz_progress_delta: sessionProgress.progressDelta,
      latest_session_at: sessionProgress.latestCompletedAt,
      latest_session_score: sessionProgress.latestScore,
      best_session_score: sessionProgress.bestScore
    }
  })
}

const getAdvisorClientsGlobalStats = async (advisorId) => {
  const countQuery = async (builder) => {
    const { count, error } = await builder
    if (error) throw error
    return count || 0
  }

  const [all, completed, toContact, rdvPlanifie, enCours, clos] = await Promise.all([
    countQuery(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('advisor_id', advisorId)),
    countQuery(
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('quiz_status', 'completed')
    ),
    countQuery(
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('followup_status', 'a_contacter')
    ),
    countQuery(
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('followup_status', 'rdv_planifie')
    ),
    countQuery(
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('followup_status', 'en_cours')
    ),
    countQuery(
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('followup_status', 'clos')
    )
  ])

  return {
    all,
    completed,
    pending: Math.max(0, all - completed),
    a_contacter: toContact,
    rdv_planifie: rdvPlanifie,
    en_cours: enCours,
    clos
  }
}

export const getAdvisorClientsPage = async ({
  advisorId,
  page = 1,
  pageSize = 9,
  statusFilter = 'all',
  followupFilter = 'all',
  searchTerm = ''
}) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const normalizedSearch = String(searchTerm || '').trim()
  const from = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, pageSize))
  const to = from + Math.max(1, pageSize) - 1

  let query = supabase
    .from('clients')
    .select(
      `
      *,
      client_insights (
        id,
        type,
        concept
      )
    `,
      { count: 'exact' }
    )
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })

  if (statusFilter === 'completed') {
    query = query.eq('quiz_status', 'completed')
  } else if (statusFilter === 'pending') {
    query = query.neq('quiz_status', 'completed')
  }

  if (followupFilter && followupFilter !== 'all') {
    query = query.eq('followup_status', followupFilter)
  }

  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[%_]/g, '\\$&')
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`)
  }

  const { data, count, error } = await query.range(from, to)
  if (error) throw error

  const clients = data || []
  const clientIds = clients.map((client) => client.id)
  const { byClientId } = await fetchQuizSessionsByClientIds(clientIds)
  const stats = await getAdvisorClientsGlobalStats(advisorId)

  const items = clients.map((client) => {
    const sessionProgress = buildProgressFromSessions(byClientId.get(client.id) || [])
    return {
      ...client,
      quiz_session_count: sessionProgress.quizSessionCount,
      quiz_progress_delta: sessionProgress.progressDelta,
      latest_session_at: sessionProgress.latestCompletedAt,
      latest_session_score: sessionProgress.latestScore,
      best_session_score: sessionProgress.bestScore
    }
  })

  return {
    items,
    totalItems: count || 0,
    stats
  }
}

// Récupérer les statistiques d'un conseiller
export const getAdvisorStats = async (advisorId) => {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, quiz_status, score, followup_status')
    .eq('advisor_id', advisorId)

  if (error) throw error

  const stats = {
    totalClients: clients.length,
    completed: clients.filter(c => c.quiz_status === 'completed').length,
    pending: clients.filter(c => c.quiz_status === 'pending').length,
    toContact: clients.filter(c => c.followup_status === 'a_contacter').length,
    inProgress: clients.filter(c => ['rdv_planifie', 'en_cours'].includes(c.followup_status)).length,
    closed: clients.filter(c => c.followup_status === 'clos').length,
    avgScore: clients.length > 0
      ? Math.round(
          clients
            .filter(c => c.score !== null)
            .reduce((acc, c) => acc + c.score, 0) / 
          clients.filter(c => c.score !== null).length || 0
        )
      : 0
  }

  return stats
}

// Récupérer un client spécifique avec ses insights
export const getClientById = async (clientId) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_insights (
        id,
        type,
        concept
      )
    `)
    .eq('id', clientId)
    .single()

  if (error) throw error
  const enriched = await enrichClientWithSessions(data)
  const followupEvents = await fetchClientFollowupEvents(clientId)
  return {
    ...enriched,
    followup_events: followupEvents
  }
}

// Mettre a jour les informations d'un client
export const updateClient = async ({ clientId, advisorId, name, email, avatar }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const cleanedName = (name || '').trim()
  const cleanedEmail = normalizeEmail(email)
  const cleanedAvatar = (avatar || '').trim() || '👤'

  if (!cleanedName) throw new Error('Le nom est requis')
  if (!cleanedEmail) throw new Error("L'email est requis")

  const { data: duplicate, error: duplicateError } = await supabase
    .from('clients')
    .select('id')
    .eq('advisor_id', advisorId)
    .eq('email', cleanedEmail)
    .neq('id', clientId)
    .maybeSingle()

  if (duplicateError) throw duplicateError
  if (duplicate) throw new Error('Un autre client utilise deja cet email')

  const { error } = await supabase
    .from('clients')
    .update({
      name: cleanedName,
      email: cleanedEmail,
      avatar: cleanedAvatar
    })
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error
  const { data: clientWithInsights, error: clientWithInsightsError } = await supabase
    .from('clients')
    .select(
      `
      *,
      client_insights (
        id,
        type,
        concept
      )
    `
    )
    .eq('id', clientId)
    .single()

  if (clientWithInsightsError) throw clientWithInsightsError
  return enrichClientWithSessions(clientWithInsights)
}

// Mettre a jour le suivi commercial du client
export const updateClientFollowup = async ({ clientId, advisorId, followupStatus, advisorNotes, markContacted }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const payload = {}

  if (followupStatus) {
    payload.followup_status = followupStatus
  }

  if (typeof advisorNotes === 'string') {
    payload.advisor_notes = advisorNotes
  }

  if (markContacted) {
    payload.last_contacted_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error

  let eventType = 'followup_saved'
  if (markContacted) eventType = 'contact_marked'
  else if (typeof advisorNotes === 'string' && advisorNotes.trim().length > 0) eventType = 'note_updated'
  else if (followupStatus) eventType = 'status_changed'

  const { error: followupEventError } = await supabase.from('client_followup_events').insert({
    client_id: clientId,
    advisor_id: advisorId,
    event_type: eventType,
    followup_status: followupStatus || null,
    advisor_notes: typeof advisorNotes === 'string' ? advisorNotes : null,
    metadata: {
      markContacted: Boolean(markContacted)
    }
  })

  // Follow-up journal is best-effort: core status update must not be blocked by event logging issues.
  if (followupEventError && !isMissingClientFollowupEventsTableError(followupEventError)) {
    console.warn('Unable to log follow-up event:', followupEventError?.message || followupEventError)
  }

  const { data: clientWithInsights, error: clientWithInsightsError } = await supabase
    .from('clients')
    .select(
      `
      *,
      client_insights (
        id,
        type,
        concept
      )
    `
    )
    .eq('id', clientId)
    .single()

  if (clientWithInsightsError) throw clientWithInsightsError
  const enriched = await enrichClientWithSessions(clientWithInsights)
  const followupEvents = await fetchClientFollowupEvents(clientId)
  return {
    ...enriched,
    followup_events: followupEvents
  }
}

// Supprimer un client
export const deleteClient = async ({ clientId, advisorId }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('advisor_id', advisorId)

  if (error) throw error
  return { success: true }
}

// Creer une invitation client (creation en base + token de partage)
export const createClientInvitation = async ({ advisorId, name, email, questionnaireId }) => {
  const cleanedName = (name || '').trim()
  const cleanedEmail = normalizeEmail(email)

  if (!advisorId) {
    throw new Error('Conseiller introuvable')
  }

  if (!cleanedName) {
    throw new Error('Le nom du client est requis')
  }

  if (!cleanedEmail) {
    throw new Error("L'email du client est requis")
  }

  const { data: existingClient, error: existingError } = await supabase
    .from('clients')
    .select('id, name, email, quiz_status')
    .eq('advisor_id', advisorId)
    .eq('email', cleanedEmail)
    .maybeSingle()

  if (existingError) throw existingError
  if (existingClient) {
    const resolvedQuestionnaireId = await resolveQuestionnaireIdForInvitation(advisorId, questionnaireId)
    const invitation = await upsertClientInvitation(existingClient.id, resolvedQuestionnaireId)
    const questionnaire = await getQuestionnaireDetails(resolvedQuestionnaireId)
    return {
      client: existingClient,
      existingClient: true,
      token: invitation.token,
      questionnaireId: invitation.questionnaireId,
      questionnaireName: questionnaire?.name || 'Questionnaire standard',
      inviteUrl: invitation.inviteUrl,
      expiresAt: invitation.expiresAt,
      updatedAt: invitation.updatedAt,
      legacyMode: invitation.legacyMode
    }
  }

  const [{ access }, totalClients] = await Promise.all([
    getAdvisorPlanInfo(advisorId),
    getAdvisorClientCount(advisorId)
  ])
  const remainingSlots = getRemainingClientSlots({
    plan: access.code,
    clientCount: totalClients
  })
  if (remainingSlots !== null && remainingSlots <= 0) {
    throw new Error(
      `Limite atteinte pour le plan ${access.label}: ${access.maxClients} clients maximum. Passez a un plan superieur pour continuer.`
    )
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert([
      {
        advisor_id: advisorId,
        name: cleanedName,
        email: cleanedEmail,
        quiz_status: 'pending'
      }
    ])
    .select('*')
    .single()

  if (error) throw error

  if (totalClients === 0) {
    await recordFunnelMilestone(FUNNEL_ACTIONS.FIRST_CLIENT_CREATED, {
      advisorId,
      metadata: {
        source: 'single_invitation',
        clientId: client.id
      }
    })
  }

  const resolvedQuestionnaireId = await resolveQuestionnaireIdForInvitation(advisorId, questionnaireId)
  const invitation = await upsertClientInvitation(client.id, resolvedQuestionnaireId)
  const questionnaire = await getQuestionnaireDetails(resolvedQuestionnaireId)

  return {
    client,
    invitationId: invitation.invitationId || null,
    token: invitation.token,
    questionnaireId: invitation.questionnaireId,
    questionnaireName: questionnaire?.name || 'Questionnaire standard',
    inviteUrl: invitation.inviteUrl,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.updatedAt,
    updatedAt: invitation.updatedAt,
    legacyMode: invitation.legacyMode
  }
}

// Import batch clients (CSV/XLSX deja parse en front)
export const importClientsBatch = async ({ advisorId, clients }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  if (!Array.isArray(clients) || clients.length === 0) {
    return { created: 0, skippedExisting: 0, invalid: 0, createdRows: [], skippedRows: [], invalidRows: [] }
  }

  const [{ access }, totalClients] = await Promise.all([
    getAdvisorPlanInfo(advisorId),
    getAdvisorClientCount(advisorId)
  ])
  const remainingSlots = getRemainingClientSlots({
    plan: access.code,
    clientCount: totalClients
  })
  if (remainingSlots !== null && remainingSlots <= 0) {
    throw new Error(
      `Limite atteinte pour le plan ${access.label}: ${access.maxClients} clients maximum.`
    )
  }

  const invalidRows = []
  const dedupedByEmail = new Map()

  clients.forEach((row, index) => {
    const name = String(row?.name || '').trim()
    const email = normalizeEmail(row?.email)

    if (!name || !email || !isValidEmail(email)) {
      invalidRows.push({ index, row, reason: 'invalid_name_or_email' })
      return
    }

    if (!dedupedByEmail.has(email)) {
      dedupedByEmail.set(email, { name, email })
    }
  })

  const normalizedRows = [...dedupedByEmail.values()]
  if (normalizedRows.length === 0) {
    return {
      created: 0,
      skippedExisting: 0,
      invalid: invalidRows.length,
      createdRows: [],
      skippedRows: [],
      invalidRows
    }
  }

  const emails = normalizedRows.map((item) => item.email)
  const { data: existingRows, error: existingError } = await supabase
    .from('clients')
    .select('id, email')
    .eq('advisor_id', advisorId)
    .in('email', emails)

  if (existingError) throw existingError

  const existingEmails = new Set((existingRows || []).map((item) => normalizeEmail(item.email)))
  const rowsToInsert = normalizedRows.filter((item) => !existingEmails.has(item.email))
  const skippedRows = normalizedRows.filter((item) => existingEmails.has(item.email))

  if (remainingSlots !== null && rowsToInsert.length > remainingSlots) {
    throw new Error(
      `Import impossible: il reste ${remainingSlots} place(s) client sur votre plan ${access.label}.`
    )
  }

  let createdRows = []
  if (rowsToInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('clients')
      .insert(
        rowsToInsert.map((item) => ({
          advisor_id: advisorId,
          name: item.name,
          email: item.email,
          quiz_status: 'pending'
        }))
      )
      .select('id, name, email')

    if (insertError) throw insertError
    createdRows = inserted || []
  }

  if (totalClients === 0 && createdRows.length > 0) {
    await recordFunnelMilestone(FUNNEL_ACTIONS.FIRST_CLIENT_CREATED, {
      advisorId,
      metadata: {
        source: 'batch_import',
        insertedCount: createdRows.length,
        firstClientId: createdRows[0]?.id || null
      }
    })
  }

  return {
    created: createdRows.length,
    skippedExisting: skippedRows.length,
    invalid: invalidRows.length,
    createdRows,
    skippedRows,
    invalidRows
  }
}

// Lister les liens d'invitation d'un conseiller
export const getAdvisorInvitationLinks = async (advisorId) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, email, quiz_status, created_at, completed_at')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })

  if (clientsError) throw clientsError
  if (!clients || clients.length === 0) return []

  const clientIds = clients.map((client) => client.id)

  let { data: invitations, error: invitationsError } = await supabase
    .from('client_invitations')
    .select('client_id, token, questionnaire_id, expires_at, revoked_at, updated_at')
    .in('client_id', clientIds)

  if (invitationsError && isMissingInvitationQuestionnaireColumnError(invitationsError)) {
    const fallback = await supabase
      .from('client_invitations')
      .select('client_id, token, expires_at, revoked_at, updated_at')
      .in('client_id', clientIds)
    invitations = fallback.data
    invitationsError = fallback.error
  }

  if (invitationsError && !isMissingInvitationsTableError(invitationsError)) throw invitationsError

  const invitationByClientId = new Map((invitations || []).map((item) => [item.client_id, item]))
  const useLegacyMode = !!invitationsError && isMissingInvitationsTableError(invitationsError)
  const questionnaireIds = [...new Set((invitations || []).map((item) => item.questionnaire_id).filter(Boolean))]
  const questionnaireNameById = new Map()

  if (questionnaireIds.length > 0) {
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('advisor_questionnaires')
      .select('id, name')
      .in('id', questionnaireIds)

    if (!questionnairesError) {
      ;(questionnaires || []).forEach((item) => {
        questionnaireNameById.set(item.id, item.name)
      })
    }
  }

  return clients.map((client) => {
    if (useLegacyMode) {
      const legacyToken = buildLegacyToken(client.id)
        return {
          ...client,
          invitation: {
            token: legacyToken,
            questionnaireId: null,
            questionnaireName: 'Questionnaire standard',
            expiresAt: null,
            revokedAt: null,
            updatedAt: client.created_at,
          inviteUrl: buildInviteUrl(client.id, legacyToken),
          legacyMode: true
        }
      }
    }

    const invitation = invitationByClientId.get(client.id)

    return {
      ...client,
      invitation: invitation
        ? {
            token: invitation.token,
            questionnaireId: invitation.questionnaire_id || null,
            questionnaireName: invitation.questionnaire_id
              ? questionnaireNameById.get(invitation.questionnaire_id) || 'Questionnaire personnalise'
              : 'Questionnaire standard',
            expiresAt: invitation.expires_at,
            revokedAt: invitation.revoked_at,
            updatedAt: invitation.updated_at,
            inviteUrl: buildInviteUrl(client.id, invitation.token),
            legacyMode: false
          }
        : null
    }
  })
}

// Regenerer le lien d'invitation d'un client
export const regenerateInvitationLink = async (clientId) => {
  if (!clientId) throw new Error('Client introuvable')

  let { data: existing, error } = await supabase
    .from('client_invitations')
    .select('questionnaire_id')
    .eq('client_id', clientId)
    .maybeSingle()

  if (error && isMissingInvitationQuestionnaireColumnError(error)) {
    const fallback = await supabase
      .from('client_invitations')
      .select('client_id')
      .eq('client_id', clientId)
      .maybeSingle()
    existing = fallback.data
    error = fallback.error
  }

  if (error && !isMissingInvitationsTableError(error)) throw error
  return upsertClientInvitation(clientId, existing?.questionnaire_id || null)
}

export const createClientInvitationForExistingClient = async ({
  advisorId,
  clientId,
  questionnaireId = null
}) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  if (!clientId) throw new Error('Client introuvable')

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, advisor_id, name, email')
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (clientError) throw clientError
  if (!client) throw new Error('Client introuvable')

  const resolvedQuestionnaireId = await resolveQuestionnaireIdForInvitation(advisorId, questionnaireId)
  const invitation = await upsertClientInvitation(client.id, resolvedQuestionnaireId)
  const questionnaire = await getQuestionnaireDetails(resolvedQuestionnaireId)

  return {
    client,
    existingClient: true,
    invitationId: invitation.invitationId || null,
    token: invitation.token,
    questionnaireId: invitation.questionnaireId,
    questionnaireName: questionnaire?.name || 'Questionnaire standard',
    inviteUrl: invitation.inviteUrl,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.updatedAt,
    updatedAt: invitation.updatedAt,
    legacyMode: invitation.legacyMode
  }
}

export const deleteClientInvitationLink = async ({
  advisorId,
  clientId,
  linkId = null,
  token = null
}) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  if (!clientId) throw new Error('Client introuvable')

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, advisor_id')
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (clientError) throw clientError
  if (!client) throw new Error('Client introuvable')

  let targetToken = token || null

  if (linkId) {
    const { data: link, error: linkError } = await supabase
      .from('client_invitation_links')
      .select('id, token')
      .eq('id', linkId)
      .eq('client_id', clientId)
      .maybeSingle()

    if (linkError && !isMissingInvitationLinksTableError(linkError)) throw linkError
    if (link?.token) targetToken = link.token

    if (link?.id) {
      const { error: deleteLinkError } = await supabase
        .from('client_invitation_links')
        .delete()
        .eq('id', link.id)
        .eq('client_id', clientId)
      if (deleteLinkError && !isMissingInvitationLinksTableError(deleteLinkError)) throw deleteLinkError
    }
  }

  if (targetToken) {
    const { error: deleteHistoryError } = await supabase
      .from('client_invitation_links')
      .delete()
      .eq('client_id', clientId)
      .eq('token', targetToken)
    if (deleteHistoryError && !isMissingInvitationLinksTableError(deleteHistoryError)) throw deleteHistoryError

    const { data: activeInvitation, error: activeInvitationError } = await supabase
      .from('client_invitations')
      .select('id')
      .eq('client_id', clientId)
      .eq('token', targetToken)
      .maybeSingle()

    if (activeInvitationError && !isMissingInvitationsTableError(activeInvitationError)) {
      throw activeInvitationError
    }

    if (activeInvitation?.id) {
      const { error: deleteInvitationError } = await supabase
        .from('client_invitations')
        .delete()
        .eq('id', activeInvitation.id)
        .eq('client_id', clientId)
      if (deleteInvitationError && !isMissingInvitationsTableError(deleteInvitationError)) {
        throw deleteInvitationError
      }
    }
  }

  return { success: true }
}

export const getClientInvitationLinks = async ({ advisorId, clientId }) => {
  if (!advisorId) throw new Error('Conseiller introuvable')
  if (!clientId) throw new Error('Client introuvable')

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, advisor_id')
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .maybeSingle()

  if (clientError) throw clientError
  if (!client) throw new Error('Client introuvable')

  let { data: links, error: linksError } = await supabase
    .from('client_invitation_links')
    .select('id, invitation_id, token, questionnaire_id, expires_at, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (linksError && !isMissingInvitationLinksTableError(linksError)) throw linksError

  if (linksError && isMissingInvitationLinksTableError(linksError)) {
    let { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .select('id, token, questionnaire_id, expires_at, updated_at, created_at')
      .eq('client_id', clientId)
      .maybeSingle()

    if (invitationError && isMissingInvitationQuestionnaireColumnError(invitationError)) {
      const fallback = await supabase
        .from('client_invitations')
        .select('id, token, expires_at, updated_at, created_at')
        .eq('client_id', clientId)
        .maybeSingle()
      invitation = fallback.data
      invitationError = fallback.error
    }

    if (invitationError && !isMissingInvitationsTableError(invitationError)) throw invitationError

    links =
      invitation && invitation.token
        ? [
            {
              id: invitation.id,
              invitation_id: invitation.id,
              token: invitation.token,
              questionnaire_id: invitation.questionnaire_id || null,
              expires_at: invitation.expires_at || null,
              created_at: invitation.updated_at || invitation.created_at || null
            }
          ]
        : []
  }

  const safeLinks = links || []
  const questionnaireIds = [...new Set(safeLinks.map((item) => item.questionnaire_id).filter(Boolean))]
  const questionnaireNameById = new Map()

  if (questionnaireIds.length > 0) {
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('advisor_questionnaires')
      .select('id, name')
      .in('id', questionnaireIds)

    if (!questionnairesError) {
      ;(questionnaires || []).forEach((item) => {
        questionnaireNameById.set(item.id, item.name)
      })
    }
  }

  return safeLinks.map((item) => ({
    id: item.id,
    invitationId: item.invitation_id || null,
    token: item.token,
    questionnaireId: item.questionnaire_id || null,
    questionnaireName: item.questionnaire_id
      ? questionnaireNameById.get(item.questionnaire_id) || 'Questionnaire personnalise'
      : 'Questionnaire standard',
    expiresAt: item.expires_at || null,
    createdAt: item.created_at || null,
    inviteUrl: buildInviteUrl(clientId, item.token)
  }))
}

// Recuperer les informations publiques d'un client pour le quiz avec validation token
export const getQuizClient = async (clientId, token) => {
  if (!token) throw new Error("Lien d'invitation incomplet")
  const quizClient = createQuizSupabaseClient(token)

  let { data: invitation, error: invitationError } = await quizClient
    .from('client_invitations')
    .select('token, questionnaire_id, expires_at, revoked_at')
    .eq('client_id', clientId)
    .eq('token', token)
    .maybeSingle()

  if (invitationError && isMissingInvitationQuestionnaireColumnError(invitationError)) {
    const fallback = await quizClient
      .from('client_invitations')
      .select('token, expires_at, revoked_at')
      .eq('client_id', clientId)
      .eq('token', token)
      .maybeSingle()
    invitation = fallback.data
    invitationError = fallback.error
  }

  if (invitationError) {
    if (isMissingInvitationsTableError(invitationError)) {
      const legacyToken = buildLegacyToken(clientId)
      if (token !== legacyToken) {
        throw new Error("Lien d'invitation invalide")
      }
      return {
        client,
        invitation: {
          clientId,
          token,
          questionnaireId: null,
          questionnaire: null
        }
      }
    }
    throw invitationError
  }
  if (!invitation) throw new Error("Lien d'invitation invalide")

  if (invitation.revoked_at) {
    throw new Error("Lien d'invitation revoque")
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new Error("Lien d'invitation expire")
  }

  const { data: client, error: clientError } = await quizClient
    .from('clients')
    .select('id, name, email, quiz_status, score, completed_at')
    .eq('id', clientId)
    .single()

  if (clientError) throw clientError

  const questionnaire = await getQuestionnaireDetails(invitation.questionnaire_id)

  return {
    client,
    invitation: {
      clientId,
      token: invitation.token,
      questionnaireId: invitation.questionnaire_id || null,
      questionnaire
    }
  }
}

// Recuperer les informations publiques d'un client pour le quiz avec token seul
export const getQuizClientByToken = async (token) => {
  if (!token) throw new Error("Lien d'invitation incomplet")
  const quizClient = createQuizSupabaseClient(token)

  let { data: invitation, error: invitationError } = await quizClient
    .from('client_invitations')
    .select('client_id, token, questionnaire_id, expires_at, revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (invitationError && isMissingInvitationQuestionnaireColumnError(invitationError)) {
    const fallback = await quizClient
      .from('client_invitations')
      .select('client_id, token, expires_at, revoked_at')
      .eq('token', token)
      .maybeSingle()
    invitation = fallback.data
    invitationError = fallback.error
  }

  if (invitationError) {
    if (isMissingInvitationsTableError(invitationError)) {
      throw new Error("Lien d'invitation invalide")
    }
    throw invitationError
  }

  if (!invitation) throw new Error("Lien d'invitation invalide")
  if (invitation.revoked_at) throw new Error("Lien d'invitation revoque")
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new Error("Lien d'invitation expire")
  }

  const { data: client, error: clientError } = await quizClient
    .from('clients')
    .select('id, name, email, quiz_status, score, completed_at')
    .eq('id', invitation.client_id)
    .single()

  if (clientError) throw clientError

  const questionnaire = await getQuestionnaireDetails(invitation.questionnaire_id)

  return {
    client,
    invitation: {
      clientId: invitation.client_id,
      token: invitation.token,
      questionnaireId: invitation.questionnaire_id || null,
      questionnaire,
      expiresAt: invitation.expires_at,
      revokedAt: invitation.revoked_at
    }
  }
}

// Soumettre un quiz client (score + insights)
export const submitClientQuizResult = async ({
  clientId,
  token,
  score,
  strengths,
  weaknesses,
  questionResponses
}) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!token) throw new Error("Lien d'invitation invalide")

  const quizClient = createQuizSupabaseClient(token)
  const response = await quizClient.functions.invoke('submit-quiz-result', {
    body: {
      clientId,
      token,
      score,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      questionResponses: Array.isArray(questionResponses) ? questionResponses : []
    }
  })

  if (response.error) {
    const details = await extractFunctionErrorMessage(response.error, 'Impossible de soumettre le quiz')
    throw new Error(details)
  }
  if (!response.data?.success) {
    throw new Error(response.data?.error || 'Impossible de soumettre le quiz')
  }

  return response.data.client
}

// S'abonner aux changements clients/insights d'un conseiller
export const subscribeToAdvisorClients = (advisorId, onChange) => {
  if (!advisorId || typeof onChange !== 'function') {
    return () => {}
  }

  const channel = supabase
    .channel(`advisor-clients-${advisorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients', filter: `advisor_id=eq.${advisorId}` },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_insights' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_invitations' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_quiz_sessions' },
      () => onChange()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

const formatMonthKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

const emptyAnalytics = () => ({
  summary: {
    totalClients: 0,
    completed: 0,
    pending: 0,
    avgScore: 0,
    completionRate: 0
  },
  progress: {
    totalSessions: 0,
    trackedClients: 0,
    avgDelta: 0,
    improvedClients: 0,
    regressedClients: 0
  },
  scoreDistribution: [
    { label: '0-49', min: 0, max: 49, count: 0 },
    { label: '50-74', min: 50, max: 74, count: 0 },
    { label: '75-100', min: 75, max: 100, count: 0 }
  ],
  monthlyEvolution: [],
  pipeline: {
    invited: 0,
    completed: 0,
    rdvPlanifie: 0,
    clos: 0
  },
  segmentation: {
    chaud: 0,
    tiede: 0,
    froid: 0
  },
  priorities: [],
  conceptStats: {
    strengths: [],
    weaknesses: []
  }
})

const daysSince = (dateString) => {
  if (!dateString) return 999
  const diff = Date.now() - new Date(dateString).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const segmentClient = (client) => {
  const score = typeof client.score === 'number' ? client.score : 0
  const status = client.followup_status || 'a_contacter'
  const contactDelay = daysSince(client.last_contacted_at)

  if (status === 'clos' || status === 'rdv_planifie') return 'chaud'
  if (score >= 75 && status !== 'a_contacter') return 'chaud'
  if (score >= 50 || status === 'en_cours' || contactDelay <= 10) return 'tiede'
  return 'froid'
}

const computePriority = (client) => {
  const isCompleted = client.quiz_status === 'completed'
  const score = typeof client.score === 'number' ? client.score : 0
  const status = client.followup_status || 'a_contacter'
  const contactDelay = daysSince(client.last_contacted_at || client.created_at)

  if (status === 'clos') {
    return { value: 0, label: 'Clos', reason: 'Dossier deja clos' }
  }

  let value = 0
  if (status === 'a_contacter') value += 40
  if (status === 'en_cours') value += 25
  if (status === 'rdv_planifie') value += 10
  value += isCompleted ? 25 : 10
  value += Math.min(25, contactDelay)
  value += Math.max(0, Math.floor((80 - score) / 4))

  if (value >= 85) return { value, label: 'Urgent', reason: 'Relance immediate recommandee' }
  if (value >= 60) return { value, label: 'Haute', reason: 'A traiter cette semaine' }
  return { value, label: 'Normale', reason: 'Suivi standard' }
}

// Récupérer les données analytics d'un conseiller
export const getAdvisorAnalytics = async (advisorId, options = {}) => {
  const includeCrmRows = options?.includeCrmRows !== false
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      email,
      quiz_status,
      followup_status,
      advisor_notes,
      score,
      created_at,
      completed_at,
      last_contacted_at,
      client_insights (
        type,
        concept
      )
    `)
    .eq('advisor_id', advisorId)

  if (error) throw error
  if (!clients || clients.length === 0) return emptyAnalytics()

  const clientIds = clients.map((client) => client.id)
  const { byClientId } = await fetchQuizSessionsByClientIds(clientIds)

  const latestSessionByClient = new Map()
  const progressByClient = new Map()
  let allSessions = []

  clients.forEach((client) => {
    const sessions = byClientId.get(client.id) || []
    if (sessions.length > 0) {
      latestSessionByClient.set(client.id, sessions[0])
      allSessions = allSessions.concat(sessions)
    }
    progressByClient.set(client.id, buildProgressFromSessions(sessions))
  })

  const clientsWithEffectiveScore = clients
    .map((client) => {
      const latestSession = latestSessionByClient.get(client.id)
      const effectiveScore =
        typeof latestSession?.score === 'number'
          ? latestSession.score
          : typeof client.score === 'number'
            ? client.score
            : null
      const effectiveCompletedAt = latestSession?.completed_at || client.completed_at || null
      return {
        ...client,
        effectiveScore,
        effectiveCompletedAt
      }
    })
    .filter((client) => typeof client.effectiveScore === 'number')

  const avgScore =
    clientsWithEffectiveScore.length > 0
      ? Math.round(
          clientsWithEffectiveScore.reduce((sum, client) => sum + client.effectiveScore, 0) /
            clientsWithEffectiveScore.length
        )
      : 0

  const summary = {
    totalClients: clients.length,
    completed: clientsWithEffectiveScore.length,
    pending: clients.length - clientsWithEffectiveScore.length,
    avgScore,
    completionRate:
      clients.length > 0 ? Math.round((clientsWithEffectiveScore.length / clients.length) * 100) : 0
  }

  const scoreDistribution = [
    {
      label: '0-49',
      min: 0,
      max: 49,
      count: clientsWithEffectiveScore.filter((client) => client.effectiveScore <= 49).length
    },
    {
      label: '50-74',
      min: 50,
      max: 74,
      count: clientsWithEffectiveScore.filter(
        (client) => client.effectiveScore >= 50 && client.effectiveScore <= 74
      ).length
    },
    {
      label: '75-100',
      min: 75,
      max: 100,
      count: clientsWithEffectiveScore.filter((client) => client.effectiveScore >= 75).length
    }
  ]

  const now = new Date()
  const monthBuckets = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthBuckets.push(formatMonthKey(d))
  }

  const scoreByMonth = new Map(monthBuckets.map((monthKey) => [monthKey, { totalScore: 0, count: 0 }]))

  const sessionsForEvolution =
    allSessions.length > 0
      ? allSessions
      : clientsWithEffectiveScore.map((client) => ({
          score: client.effectiveScore,
          completed_at: client.effectiveCompletedAt || client.created_at
        }))

  sessionsForEvolution.forEach((session) => {
    const rawDate = session.completed_at || session.created_at
    if (!rawDate || typeof session.score !== 'number') return

    const monthKey = formatMonthKey(new Date(rawDate))
    if (!scoreByMonth.has(monthKey)) return

    const aggregate = scoreByMonth.get(monthKey)
    aggregate.totalScore += session.score
    aggregate.count += 1
  })

  const monthlyEvolution = monthBuckets.map((monthKey) => {
    const aggregate = scoreByMonth.get(monthKey)
    const averageScore = aggregate.count > 0 ? Math.round(aggregate.totalScore / aggregate.count) : 0
    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      averageScore,
      completedCount: aggregate.count
    }
  })

  const strengthCounts = new Map()
  const weaknessCounts = new Map()

  if (allSessions.length > 0) {
    clients.forEach((client) => {
      const latestSession = latestSessionByClient.get(client.id)
      if (!latestSession) return
      normalizeInsightArray(latestSession.strengths).forEach((concept) => {
        strengthCounts.set(concept, (strengthCounts.get(concept) || 0) + 1)
      })
      normalizeInsightArray(latestSession.weaknesses).forEach((concept) => {
        weaknessCounts.set(concept, (weaknessCounts.get(concept) || 0) + 1)
      })
    })
  } else {
    clientsWithEffectiveScore.forEach((client) => {
      const insights = client.client_insights || []
      insights.forEach((insight) => {
        if (!insight?.concept || !insight?.type) return
        if (insight.type === 'strength') {
          strengthCounts.set(insight.concept, (strengthCounts.get(insight.concept) || 0) + 1)
        } else if (insight.type === 'weakness') {
          weaknessCounts.set(insight.concept, (weaknessCounts.get(insight.concept) || 0) + 1)
        }
      })
    })
  }

  const toTopList = (counterMap) =>
    [...counterMap.entries()]
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

  const conceptStats = {
    strengths: toTopList(strengthCounts),
    weaknesses: toTopList(weaknessCounts)
  }

  const progressDeltas = clients
    .map((client) => progressByClient.get(client.id)?.progressDelta)
    .filter((delta) => typeof delta === 'number')

  const progress = {
    totalSessions: allSessions.length,
    trackedClients: progressDeltas.length,
    avgDelta:
      progressDeltas.length > 0
        ? Math.round(progressDeltas.reduce((sum, delta) => sum + delta, 0) / progressDeltas.length)
        : 0,
    improvedClients: progressDeltas.filter((delta) => delta > 0).length,
    regressedClients: progressDeltas.filter((delta) => delta < 0).length
  }

  const pipeline = {
    invited: clients.length,
    completed: clients.filter((client) => client.quiz_status === 'completed').length,
    rdvPlanifie: clients.filter((client) => client.followup_status === 'rdv_planifie').length,
    clos: clients.filter((client) => client.followup_status === 'clos').length
  }

  const segmentation = clients.reduce(
    (acc, client) => {
      const segment = segmentClient(client)
      acc[segment] += 1
      return acc
    },
    { chaud: 0, tiede: 0, froid: 0 }
  )

  let priorities = []
  let topPriorities = []
  if (includeCrmRows) {
    priorities = clients
      .map((client) => {
        const effectiveScore =
          typeof latestSessionByClient.get(client.id)?.score === 'number'
            ? latestSessionByClient.get(client.id).score
            : typeof client.score === 'number'
              ? client.score
              : null

        const priority = computePriority({
          ...client,
          score: typeof effectiveScore === 'number' ? effectiveScore : 0
        })

        return {
          ...(progressByClient.get(client.id) || {}),
          id: client.id,
          name: client.name,
          email: client.email,
          quizStatus: client.quiz_status,
          followupStatus: client.followup_status || 'a_contacter',
          score: effectiveScore,
          lastContactedAt: client.last_contacted_at,
          createdAt: client.created_at,
          advisorNotes: client.advisor_notes || '',
          priority
        }
      })
      .sort((a, b) => b.priority.value - a.priority.value)

    topPriorities = priorities.filter((client) => client.followupStatus !== 'clos').slice(0, 10)
  }

  return {
    summary,
    progress,
    scoreDistribution,
    monthlyEvolution,
    pipeline,
    segmentation,
    priorities: topPriorities,
    crmRows: priorities,
    conceptStats
  }
}

export const getAdvisorAnalyticsPriorities = async ({
  advisorId,
  page = 1,
  pageSize = 10,
  limit = 10,
  followupFilter = 'all',
  search = ''
}) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const normalizedSearch = String(search || '').trim()

  let query = supabase
    .from('clients')
    .select(
      `
      id,
      name,
      email,
      quiz_status,
      followup_status,
      advisor_notes,
      score,
      created_at,
      completed_at,
      last_contacted_at
    `
    )
    .eq('advisor_id', advisorId)

  if (followupFilter && followupFilter !== 'all') {
    query = query.eq('followup_status', followupFilter)
  }

  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[%_]/g, '\\$&')
    query = query.or(
      `name.ilike.%${escaped}%,email.ilike.%${escaped}%,advisor_notes.ilike.%${escaped}%`
    )
  }

  const { data: clients, error } = await query
  if (error) throw error

  const safeClients = clients || []
  if (safeClients.length === 0) {
    return { rows: [], totalItems: 0 }
  }

  const clientIds = safeClients.map((client) => client.id)
  const { byClientId } = await fetchQuizSessionsByClientIds(clientIds)
  const latestSessionByClient = new Map()
  const progressByClient = new Map()

  safeClients.forEach((client) => {
    const sessions = byClientId.get(client.id) || []
    if (sessions.length > 0) latestSessionByClient.set(client.id, sessions[0])
    progressByClient.set(client.id, buildProgressFromSessions(sessions))
  })

  const priorities = safeClients
    .map((client) => {
      const effectiveScore =
        typeof latestSessionByClient.get(client.id)?.score === 'number'
          ? latestSessionByClient.get(client.id).score
          : typeof client.score === 'number'
            ? client.score
            : null

      const priority = computePriority({
        ...client,
        score: typeof effectiveScore === 'number' ? effectiveScore : 0
      })

      return {
        ...(progressByClient.get(client.id) || {}),
        id: client.id,
        name: client.name,
        email: client.email,
        quizStatus: client.quiz_status,
        followupStatus: client.followup_status || 'a_contacter',
        score: effectiveScore,
        lastContactedAt: client.last_contacted_at,
        createdAt: client.created_at,
        advisorNotes: client.advisor_notes || '',
        priority
      }
    })
    .filter((row) => row.followupStatus !== 'clos')
    .sort((a, b) => b.priority.value - a.priority.value)

  const limited = Number.isFinite(limit) && limit > 0 ? priorities.slice(0, limit) : priorities
  const totalItems = limited.length
  const from = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, pageSize))
  const to = from + Math.max(1, pageSize)
  const rows = limited.slice(from, to)

  return { rows, totalItems }
}
