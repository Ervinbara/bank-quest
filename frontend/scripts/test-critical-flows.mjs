import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ADVISOR_EMAIL = process.env.TEST_ADVISOR_EMAIL
const ADVISOR_PASSWORD = process.env.TEST_ADVISOR_PASSWORD
const SECONDARY_EMAIL = process.env.TEST_SECONDARY_ADVISOR_EMAIL || ''
const SECONDARY_PASSWORD = process.env.TEST_SECONDARY_ADVISOR_PASSWORD || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[FAIL] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

if (!ADVISOR_EMAIL || !ADVISOR_PASSWORD) {
  console.error('[FAIL] Missing TEST_ADVISOR_EMAIL or TEST_ADVISOR_PASSWORD')
  process.exit(1)
}

const waitWithTimeout = async (factory, timeoutMs = 15000) => {
  let timeoutId
  try {
    return await Promise.race([
      Promise.resolve().then(factory),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

const logStep = (name) => console.log(`\n[STEP] ${name}`)
const logPass = (name) => console.log(`[PASS] ${name}`)
const logSkip = (name, reason) => console.log(`[SKIP] ${name} (${reason})`)

const main = async () => {
  const advisorClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const secondaryClient = SECONDARY_EMAIL && SECONDARY_PASSWORD ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null

  let advisorId = null
  let tempClientId = null
  let inviteToken = null

  try {
    logStep('Auth advisor')
    const auth = await waitWithTimeout(
      () =>
        advisorClient.auth.signInWithPassword({
          email: ADVISOR_EMAIL,
          password: ADVISOR_PASSWORD
        }),
      20000
    )
    if (auth.error) throw auth.error
    if (!auth.data?.session?.access_token) throw new Error('Session missing after auth')
    logPass('Auth advisor')

    logStep('Resolve advisor profile')
    const advisorRes = await waitWithTimeout(
      () =>
        advisorClient
          .from('advisors')
          .select('id, email, role')
          .ilike('email', ADVISOR_EMAIL.toLowerCase())
          .maybeSingle(),
      15000
    )
    if (advisorRes.error) throw advisorRes.error
    if (!advisorRes.data?.id) throw new Error('Advisor profile not found')
    advisorId = advisorRes.data.id
    logPass(`Resolve advisor profile (${advisorRes.data.role || 'advisor'})`)

    logStep('Create temp client')
    const unique = Date.now()
    const createClientRes = await waitWithTimeout(
      () =>
        advisorClient
          .from('clients')
          .insert([
            {
              advisor_id: advisorId,
              name: `Smoke Test ${unique}`,
              email: `smoke.${unique}@example.test`
            }
          ])
          .select('id')
          .single(),
      15000
    )
    if (createClientRes.error) throw createClientRes.error
    tempClientId = createClientRes.data.id
    logPass(`Create temp client (${tempClientId})`)

    logStep('Create invitation link')
    inviteToken = crypto.randomBytes(16).toString('hex')
    const invitationRes = await waitWithTimeout(
      () =>
        advisorClient
          .from('client_invitations')
          .upsert(
            [
              {
                client_id: tempClientId,
                token: inviteToken,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                revoked_at: null
              }
            ],
            { onConflict: 'client_id' }
          )
          .select('client_id, token')
          .single(),
      15000
    )
    if (invitationRes.error) throw invitationRes.error
    logPass('Create invitation link')

    logStep('RLS anon token read (clients + invitations)')
    const anonQuizClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          'x-quiz-token': inviteToken
        }
      }
    })

    const anonInvitation = await waitWithTimeout(
      () =>
        anonQuizClient
          .from('client_invitations')
          .select('client_id, token')
          .eq('token', inviteToken)
          .maybeSingle(),
      15000
    )
    if (anonInvitation.error) throw anonInvitation.error
    if (!anonInvitation.data?.client_id) throw new Error('Anon cannot read invitation with token')

    const anonClient = await waitWithTimeout(
      () =>
        anonQuizClient
          .from('clients')
          .select('id, name')
          .eq('id', tempClientId)
          .maybeSingle(),
      15000
    )
    if (anonClient.error) throw anonClient.error
    if (!anonClient.data?.id) throw new Error('Anon cannot read client with token')
    logPass('RLS anon token read')

    logStep('Questionnaire flow read')
    const questionnaireRes = await waitWithTimeout(
      () =>
        advisorClient
          .from('advisor_questionnaires')
          .select('id, name')
          .eq('advisor_id', advisorId)
          .limit(1),
      15000
    )
    if (questionnaireRes.error) throw questionnaireRes.error
    logPass(`Questionnaire flow read (${questionnaireRes.data?.length || 0} found)`)

    logStep('Quiz submit edge function')
    const quizSubmitRes = await waitWithTimeout(
      () =>
        anonQuizClient.functions.invoke('submit-quiz-result', {
          body: {
            clientId: tempClientId,
            token: inviteToken,
            score: 78,
            strengths: ['Budget'],
            weaknesses: ['Fiscalite'],
            questionResponses: []
          }
        }),
      20000
    )
    if (quizSubmitRes.error) throw quizSubmitRes.error
    if (!quizSubmitRes.data?.success) {
      throw new Error(quizSubmitRes.data?.error || 'submit-quiz-result failed')
    }
    logPass('Quiz submit edge function')

    if (secondaryClient) {
      logStep('RLS isolation (secondary advisor cannot read temp client)')
      const secondAuth = await waitWithTimeout(
        () =>
          secondaryClient.auth.signInWithPassword({
            email: SECONDARY_EMAIL,
            password: SECONDARY_PASSWORD
          }),
        20000
      )
      if (secondAuth.error) throw secondAuth.error

      const secondRead = await waitWithTimeout(
        () => secondaryClient.from('clients').select('id').eq('id', tempClientId),
        15000
      )
      if (secondRead.error) throw secondRead.error
      if ((secondRead.data || []).length > 0) {
        throw new Error('RLS leak: secondary advisor can read foreign client')
      }
      logPass('RLS isolation')
    } else {
      logSkip('RLS isolation', 'secondary advisor credentials not provided')
    }

    console.log('\n[OK] Critical-flow smoke tests completed.')
  } finally {
    if (tempClientId) {
      try {
        await advisorClient.from('clients').delete().eq('id', tempClientId)
        console.log('[CLEANUP] temp client deleted')
      } catch (error) {
        console.warn('[WARN] cleanup failed:', error?.message || error)
      }
    }

    try {
      await advisorClient.auth.signOut()
    } catch {
      // ignore
    }
    if (secondaryClient) {
      try {
        await secondaryClient.auth.signOut()
      } catch {
        // ignore
      }
    }
  }
}

main().catch((error) => {
  console.error('\n[FAIL] Critical-flow smoke tests failed')
  console.error(error?.message || error)
  process.exit(1)
})
