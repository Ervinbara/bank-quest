import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-quiz-token'
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

const normalizeConceptList = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10)
}

const normalizeQuestionResponses = (input: unknown) => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => {
      const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
      const questionId = String(row.questionId || row.id || '').trim()
      const prompt = String(row.prompt || row.questionText || '').trim()
      const concept = String(row.concept || '').trim()
      const answerLabel = String(row.answerLabel || row.optionLabel || row.answer || '').trim()
      const pointsRaw = Number(row.points)
      const points = Number.isFinite(pointsRaw) ? Math.max(0, Math.min(5, Math.round(pointsRaw))) : null
      if (!questionId && !prompt) return null
      return {
        questionId: questionId || null,
        prompt: prompt || null,
        concept: concept || null,
        answerLabel: answerLabel || null,
        points
      }
    })
    .filter(Boolean)
    .slice(0, 200)
}

const isMissingSessionsTableError = (message: string) => {
  const lower = String(message || '').toLowerCase()
  return (
    lower.includes("could not find the table 'public.client_quiz_sessions'") ||
    lower.includes('relation "public.client_quiz_sessions" does not exist')
  )
}

const isMissingInvitationQuestionnaireColumnError = (message: string) => {
  const lower = String(message || '').toLowerCase()
  return lower.includes("column 'questionnaire_id' does not exist") || lower.includes('questionnaire_id')
}

const isMissingSessionAnswersColumnError = (message: string) => {
  const lower = String(message || '').toLowerCase()
  return lower.includes("column 'question_answers' does not exist") || lower.includes('question_answers')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuration Supabase incomplete' }, 500)

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json().catch(() => ({}))

    const providedClientId = String(body?.clientId || '').trim()
    const token = String(body?.token || '').trim()
    const score = Number(body?.score)
    const strengths = normalizeConceptList(body?.strengths)
    const weaknesses = normalizeConceptList(body?.weaknesses)
    const questionResponses = normalizeQuestionResponses(body?.questionResponses)

    if (!token) return json({ error: "Lien d'invitation invalide" }, 400)
    if (!Number.isFinite(score) || score < 0 || score > 100) return json({ error: 'Score invalide' }, 400)

    let { data: invitation, error: invitationError } = await admin
      .from('client_invitations')
      .select('id, client_id, questionnaire_id, revoked_at, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (invitationError && isMissingInvitationQuestionnaireColumnError(invitationError.message)) {
      const fallback = await admin
        .from('client_invitations')
        .select('id, client_id, revoked_at, expires_at')
        .eq('token', token)
        .maybeSingle()
      invitation = fallback.data as
        | {
            id: string
            client_id: string
            revoked_at: string | null
            expires_at: string | null
            questionnaire_id?: string | null
          }
        | null
      invitationError = fallback.error
    }

    if (invitationError) return json({ error: invitationError.message }, 400)
    if (!invitation) return json({ error: "Lien d'invitation invalide" }, 403)
    const clientId = invitation.client_id
    if (!clientId) return json({ error: 'Client introuvable' }, 400)
    if (providedClientId && providedClientId !== clientId) {
      console.warn(
        `submit-quiz-result: provided clientId mismatch. provided=${providedClientId} tokenClient=${clientId}`
      )
    }
    if (invitation.revoked_at) return json({ error: "Lien d'invitation revoque" }, 403)
    if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
      return json({ error: "Lien d'invitation expire" }, 403)
    }

    const { data: clientBeforeUpdate, error: clientBeforeUpdateError } = await admin
      .from('clients')
      .select('id, advisor_id, quiz_status')
      .eq('id', clientId)
      .maybeSingle()
    if (clientBeforeUpdateError) return json({ error: clientBeforeUpdateError.message }, 400)
    if (!clientBeforeUpdate) return json({ error: 'Client introuvable' }, 404)

    const advisorId = clientBeforeUpdate.advisor_id as string | null
    let completedBeforeCount = 0
    if (advisorId) {
      const { count, error: completedBeforeError } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('advisor_id', advisorId)
        .eq('quiz_status', 'completed')
      if (completedBeforeError) return json({ error: completedBeforeError.message }, 400)
      completedBeforeCount = count || 0
    }

    const roundedScore = Math.round(score)
    const completionTime = new Date().toISOString()

    let createdSession: Record<string, unknown> | null = null
    let { data: insertedSession, error: insertSessionError } = await admin
      .from('client_quiz_sessions')
      .insert({
        client_id: clientId,
        invitation_id: invitation.id,
        questionnaire_id: invitation.questionnaire_id,
        score: roundedScore,
        strengths,
        weaknesses,
        question_answers: questionResponses,
        completed_at: completionTime
      })
      .select('id, client_id, questionnaire_id, score, strengths, weaknesses, question_answers, completed_at')
      .single()

    if (insertSessionError && isMissingSessionAnswersColumnError(insertSessionError.message)) {
      const fallbackInsert = await admin
        .from('client_quiz_sessions')
        .insert({
          client_id: clientId,
          invitation_id: invitation.id,
          questionnaire_id: invitation.questionnaire_id,
          score: roundedScore,
          strengths,
          weaknesses,
          completed_at: completionTime
        })
        .select('id, client_id, questionnaire_id, score, strengths, weaknesses, completed_at')
        .single()
      insertedSession = fallbackInsert.data
      insertSessionError = fallbackInsert.error
    }

    if (!insertSessionError) {
      createdSession = insertedSession
    } else if (!isMissingSessionsTableError(insertSessionError.message)) {
      console.error(`submit-quiz-result: session insert failed, fallback to snapshot only: ${insertSessionError.message}`)
    }

    const { data: updatedClient, error: updateError } = await admin
      .from('clients')
      .update({
        quiz_status: 'completed',
        score: roundedScore,
        completed_at: completionTime
      })
      .eq('id', clientId)
      .select('*')
      .single()

    if (updateError) return json({ error: updateError.message }, 400)

    const { error: deleteInsightsError } = await admin.from('client_insights').delete().eq('client_id', clientId)
    if (deleteInsightsError) return json({ error: deleteInsightsError.message }, 400)

    const insightsPayload = [
      ...strengths.map((concept) => ({ client_id: clientId, type: 'strength', concept })),
      ...weaknesses.map((concept) => ({ client_id: clientId, type: 'weakness', concept }))
    ]

    if (insightsPayload.length > 0) {
      const { error: insertInsightsError } = await admin.from('client_insights').insert(insightsPayload)
      if (insertInsightsError) return json({ error: insertInsightsError.message }, 400)
    }

    if (advisorId && completedBeforeCount === 0 && clientBeforeUpdate.quiz_status !== 'completed') {
      try {
        const { data: existingFirstQuizEvent, error: existingFirstQuizEventError } = await admin
          .from('advisor_audit_logs')
          .select('id')
          .eq('advisor_id', advisorId)
          .eq('action', 'funnel_first_quiz_completed')
          .limit(1)
          .maybeSingle()

        if (!existingFirstQuizEventError && !existingFirstQuizEvent?.id) {
          await admin.from('advisor_audit_logs').insert({
            advisor_id: advisorId,
            action: 'funnel_first_quiz_completed',
            category: 'funnel',
            severity: 'info',
            metadata: {
              source: 'submit_quiz_result',
              client_id: clientId,
              session_id: createdSession?.id || null
            }
          })
        }
      } catch (eventError) {
        console.warn(`submit-quiz-result: unable to store first quiz funnel event: ${String(eventError)}`)
      }
    }

    return json({ success: true, client: updatedClient, session: createdSession }, 200)
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})
