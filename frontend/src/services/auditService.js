import { supabase } from '@/lib/supabase'

const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error'])
export const FUNNEL_ACTIONS = {
  SIGNUP_COMPLETED: 'funnel_signup_completed',
  FIRST_CLIENT_CREATED: 'funnel_first_client_created',
  FIRST_QUIZ_COMPLETED: 'funnel_first_quiz_completed'
}

const cleanMetadata = (value) => {
  if (!value || typeof value !== 'object') return {}
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

export const logAdvisorEvent = async (action, options = {}) => {
  if (!action) return

  const category = options.category || 'general'
  const severity = ALLOWED_SEVERITIES.has(options.severity) ? options.severity : 'info'
  const metadata = cleanMetadata(options.metadata)

  try {
    const { error } = await supabase.rpc('log_advisor_event', {
      p_action: action,
      p_category: category,
      p_severity: severity,
      p_metadata: metadata
    })
    if (error) throw error
  } catch (error) {
    console.warn('Unable to log advisor event:', error?.message || error)
  }
}

export const getAdvisorAuditLogs = async (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))
  const { data, error } = await supabase
    .from('advisor_audit_logs')
    .select('id, action, category, severity, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) throw error
  return data || []
}

const isMissingQuizSessionsTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_quiz_sessions'") ||
    message.includes('relation "public.client_quiz_sessions" does not exist')
  )
}

const diffDays = (from, to) => {
  if (!from || !to) return null
  const fromTs = new Date(from).getTime()
  const toTs = new Date(to).getTime()
  if (!Number.isFinite(fromTs) || !Number.isFinite(toTs) || toTs < fromTs) return null
  return Math.round(((toTs - fromTs) / (1000 * 60 * 60 * 24)) * 10) / 10
}

export const recordFunnelMilestone = async (action, options = {}) => {
  if (!action) return false

  const advisorId = options?.advisorId
  if (!advisorId) return false

  try {
    const { data: existing, error: existingError } = await supabase
      .from('advisor_audit_logs')
      .select('id')
      .eq('advisor_id', advisorId)
      .eq('action', action)
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing?.id) return false

    const { error: insertError } = await supabase
      .from('advisor_audit_logs')
      .insert({
        advisor_id: advisorId,
        action,
        category: 'funnel',
        severity: 'info',
        metadata: cleanMetadata(options?.metadata)
      })

    if (insertError) throw insertError
    return true
  } catch (error) {
    console.warn('Unable to record funnel milestone:', error?.message || error)
    return false
  }
}

export const getAdvisorConversionMetrics = async (advisorId) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const [{ data: advisor, error: advisorError }, { data: firstClient, error: firstClientError }] = await Promise.all([
    supabase.from('advisors').select('created_at').eq('id', advisorId).maybeSingle(),
    supabase
      .from('clients')
      .select('created_at')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
  ])

  if (advisorError) throw advisorError
  if (firstClientError) throw firstClientError

  let firstCompletedQuizAt = null
  let { data: firstSession, error: sessionError } = await supabase
    .from('client_quiz_sessions')
    .select('completed_at, created_at, clients!inner(advisor_id)')
    .eq('clients.advisor_id', advisorId)
    .order('completed_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (sessionError && isMissingQuizSessionsTableError(sessionError)) {
    firstSession = null
    sessionError = null
  }
  if (sessionError) throw sessionError

  if (firstSession) {
    firstCompletedQuizAt = firstSession.completed_at || firstSession.created_at || null
  } else {
    const { data: fallbackCompleted, error: fallbackError } = await supabase
      .from('clients')
      .select('completed_at')
      .eq('advisor_id', advisorId)
      .eq('quiz_status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (fallbackError) throw fallbackError
    firstCompletedQuizAt = fallbackCompleted?.completed_at || null
  }

  const signupAt = advisor?.created_at || null
  const firstClientAt = firstClient?.created_at || null

  const stepsReached = [Boolean(signupAt), Boolean(firstClientAt), Boolean(firstCompletedQuizAt)].filter(Boolean).length
  const fullFunnelRate = Math.round((stepsReached / 3) * 100)

  return {
    signupAt,
    firstClientAt,
    firstCompletedQuizAt,
    completion: {
      signup: Boolean(signupAt),
      firstClient: Boolean(firstClientAt),
      firstCompletedQuiz: Boolean(firstCompletedQuizAt)
    },
    rates: {
      signupToFirstClient: firstClientAt ? 100 : 0,
      firstClientToFirstCompletedQuiz: firstClientAt ? (firstCompletedQuizAt ? 100 : 0) : 0,
      fullFunnel: fullFunnelRate
    },
    durationsDays: {
      signupToFirstClient: diffDays(signupAt, firstClientAt),
      firstClientToFirstCompletedQuiz: diffDays(firstClientAt, firstCompletedQuizAt),
      signupToFirstCompletedQuiz: diffDays(signupAt, firstCompletedQuizAt)
    }
  }
}
