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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Token utilisateur manquant' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuration Supabase incomplete' }, 500)

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const {
      data: { user },
      error: userError
    } = await admin.auth.getUser(token)

    if (userError || !user?.id || !user?.email) {
      return json({ error: 'Session invalide' }, 401)
    }

    const { data: advisor, error: advisorError } = await admin
      .from('advisors')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (advisorError) return json({ error: advisorError.message }, 400)

    if (advisor?.id) {
      const { error: deleteAdvisorError } = await admin.from('advisors').delete().eq('id', advisor.id)
      if (deleteAdvisorError) return json({ error: deleteAdvisorError.message }, 400)
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteAuthError) return json({ error: deleteAuthError.message }, 400)

    return json({ success: true }, 200)
  } catch (error) {
    return json({ error: String(error) }, 500)
  }
})

