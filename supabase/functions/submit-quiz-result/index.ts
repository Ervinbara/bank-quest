import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
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

const normalizeConceptList = (input: unknown): string[] => {
  if (!Array.isArray(input)) return []
  return input
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 10)
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

    const clientId = String(body?.clientId || '').trim()
    const token = String(body?.token || '').trim()
    const score = Number(body?.score)
    const strengths = normalizeConceptList(body?.strengths)
    const weaknesses = normalizeConceptList(body?.weaknesses)

    if (!clientId) return json({ error: 'Client introuvable' }, 400)
    if (!token) return json({ error: "Lien d'invitation invalide" }, 400)
    if (!Number.isFinite(score) || score < 0 || score > 100) return json({ error: 'Score invalide' }, 400)

    const { data: invitation, error: invitationError } = await admin
      .from('client_invitations')
      .select('client_id, revoked_at, expires_at')
      .eq('token', token)
      .maybeSingle()

    if (invitationError) return json({ error: invitationError.message }, 400)
    if (!invitation || invitation.client_id !== clientId) return json({ error: "Lien d'invitation invalide" }, 403)
    if (invitation.revoked_at) return json({ error: "Lien d'invitation revoque" }, 403)
    if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
      return json({ error: "Lien d'invitation expire" }, 403)
    }

    const { data: updatedClient, error: updateError } = await admin
      .from('clients')
      .update({
        quiz_status: 'completed',
        score: Math.round(score),
        completed_at: new Date().toISOString()
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

    return json({ success: true, client: updatedClient }, 200)
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

