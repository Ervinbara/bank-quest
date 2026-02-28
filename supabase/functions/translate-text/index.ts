// deno-lint-ignore-file no-explicit-any
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

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const normalizeLang = (lang: string, provider: 'deepl' | 'libretranslate' | 'google') => {
  const raw = String(lang || '').trim().toLowerCase()
  if (!['fr', 'en'].includes(raw)) return ''
  if (provider === 'deepl') return raw === 'fr' ? 'FR' : 'EN'
  return raw
}

const parseProviderOrder = () => {
  const raw = Deno.env.get('TRANSLATION_PROVIDER_ORDER') || 'deepl_free,libretranslate,google'
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const isTrue = (value: string | undefined) => String(value || '').trim().toLowerCase() === 'true'

const translateWithDeepLFree = async ({
  text,
  sourceLang,
  targetLang
}: {
  text: string
  sourceLang: string
  targetLang: string
}) => {
  const deeplKey = String(Deno.env.get('DEEPL_API_KEY') || '').trim()
  if (!deeplKey) throw new Error('DEEPL_API_KEY manquante')

  // Safety: Free API keys should end with :fx.
  if (!deeplKey.endsWith(':fx')) {
    throw new Error('Cle DeepL refusee: seule une cle Free (suffixe :fx) est autorisee')
  }

  const deeplSource = normalizeLang(sourceLang, 'deepl')
  const deeplTarget = normalizeLang(targetLang, 'deepl')
  if (!deeplSource || !deeplTarget) throw new Error('Langues non supportees (fr/en)')

  const hardMonthlyLimit = parsePositiveInt(Deno.env.get('TRANSLATION_HARD_MONTHLY_LIMIT'), 400000)
  const usageRes = await fetch('https://api-free.deepl.com/v2/usage', {
    method: 'GET',
    headers: { Authorization: `DeepL-Auth-Key ${deeplKey}` }
  })
  if (!usageRes.ok) throw new Error('Impossible de verifier le quota DeepL')
  const usage = await usageRes.json()
  const used = Number(usage?.character_count || 0)
  if (used + text.length > hardMonthlyLimit) {
    throw new Error(`Quota DeepL de securite atteint (${hardMonthlyLimit} caracteres/mois)`)
  }

  const form = new URLSearchParams()
  form.append('text', text)
  form.append('source_lang', deeplSource)
  form.append('target_lang', deeplTarget)

  const translateRes = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${deeplKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  })

  if (!translateRes.ok) {
    const details = await translateRes.text()
    throw new Error(`DeepL error: ${details}`)
  }
  const payload = await translateRes.json()
  const translatedText = String(payload?.translations?.[0]?.text || '')
  if (!translatedText) throw new Error('Traduction DeepL vide')
  return translatedText
}

const translateWithLibreTranslate = async ({
  text,
  sourceLang,
  targetLang
}: {
  text: string
  sourceLang: string
  targetLang: string
}) => {
  const libreUrl = String(Deno.env.get('LIBRETRANSLATE_URL') || '').trim()
  if (!libreUrl) throw new Error('LIBRETRANSLATE_URL manquante')

  const source = normalizeLang(sourceLang, 'libretranslate')
  const target = normalizeLang(targetLang, 'libretranslate')
  if (!source || !target) throw new Error('Langues non supportees (fr/en)')

  const libreApiKey = String(Deno.env.get('LIBRETRANSLATE_API_KEY') || '').trim()
  const payload: Record<string, unknown> = {
    q: text,
    source,
    target,
    format: 'text'
  }
  if (libreApiKey) payload.api_key = libreApiKey

  const translateRes = await fetch(libreUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!translateRes.ok) {
    const details = await translateRes.text()
    throw new Error(`LibreTranslate error: ${details}`)
  }
  const result = await translateRes.json()
  const translatedText = String(result?.translatedText || '')
  if (!translatedText) throw new Error('Traduction LibreTranslate vide')
  return translatedText
}

const translateWithGoogle = async ({
  text,
  sourceLang,
  targetLang
}: {
  text: string
  sourceLang: string
  targetLang: string
}) => {
  const source = normalizeLang(sourceLang, 'google')
  const target = normalizeLang(targetLang, 'google')
  if (!source || !target) throw new Error('Langues non supportees (fr/en)')

  const googleApiKey = String(Deno.env.get('GOOGLE_TRANSLATE_API_KEY') || '').trim()
  const googleBillingAllowed = isTrue(Deno.env.get('GOOGLE_TRANSLATE_ALLOW_BILLING'))

  // Safe default: if billing not explicitly allowed, use unofficial free endpoint.
  if (!googleApiKey || !googleBillingAllowed) {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}` +
      `&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      const details = await res.text()
      throw new Error(`Google free endpoint error: ${details}`)
    }
    const payload = await res.json()
    const translatedText = String(payload?.[0]?.[0]?.[0] || '')
    if (!translatedText) throw new Error('Traduction Google vide')
    return translatedText
  }

  // Paid endpoint enabled only if GOOGLE_TRANSLATE_ALLOW_BILLING=true.
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
    googleApiKey
  )}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' })
  })
  if (!res.ok) {
    const details = await res.text()
    throw new Error(`Google API error: ${details}`)
  }
  const payload = await res.json()
  const translatedText = String(payload?.data?.translations?.[0]?.translatedText || '')
  if (!translatedText) throw new Error('Traduction Google API vide')
  return translatedText
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    if (!token) return json({ error: 'Token utilisateur manquant' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Configuration Supabase incomplete' }, 500)

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user?.id) return json({ error: 'Session invalide' }, 401)

    const body = await req.json()
    const text = String(body?.text || '').trim()
    const sourceLang = String(body?.sourceLang || '').trim().toLowerCase()
    const targetLang = String(body?.targetLang || '').trim().toLowerCase()

    if (!text) return json({ error: 'Texte vide' }, 400)
    if (sourceLang === targetLang) return json({ success: true, provider: 'local', translatedText: text }, 200)

    const mode = String(Deno.env.get('TRANSLATION_MODE') || 'disabled').trim().toLowerCase()
    if (mode === 'disabled') {
      return json(
        {
          error: 'Traduction automatique desactivee (TRANSLATION_MODE=disabled)',
          hint: 'Activer TRANSLATION_MODE=enabled'
        },
        403
      )
    }

    const maxCharsPerRequest = parsePositiveInt(
      Deno.env.get('TRANSLATION_MAX_CHARS_PER_REQUEST'),
      1200
    )
    if (text.length > maxCharsPerRequest) {
      return json({ error: `Texte trop long (max ${maxCharsPerRequest} caracteres par requete)` }, 400)
    }

    const availableProviders = new Map<
      string,
      (payload: { text: string; sourceLang: string; targetLang: string }) => Promise<string>
    >()
    availableProviders.set('deepl_free', translateWithDeepLFree)
    availableProviders.set('libretranslate', translateWithLibreTranslate)
    availableProviders.set('google', translateWithGoogle)

    const configuredOrder = parseProviderOrder()
    const finalOrder = configuredOrder.filter((provider) => availableProviders.has(provider))
    if (finalOrder.length === 0) {
      return json(
        {
          error: 'TRANSLATION_PROVIDER_ORDER invalide',
          allowed: ['deepl_free', 'libretranslate', 'google']
        },
        400
      )
    }

    const tried: Array<{ provider: string; error: string }> = []
    for (const provider of finalOrder) {
      const translate = availableProviders.get(provider)
      if (!translate) continue

      try {
        const translatedText = await translate({ text, sourceLang, targetLang })
        return json({ success: true, provider, translatedText }, 200)
      } catch (error: any) {
        tried.push({ provider, error: String(error?.message || error) })
      }
    }

    return json(
      {
        error: 'Tous les providers de traduction ont echoue',
        tried
      },
      502
    )
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 500)
  }
})
