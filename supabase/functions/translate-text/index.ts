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

const normalizeLang = (lang: string, provider: 'deepl' | 'libretranslate') => {
  const raw = String(lang || '').trim().toLowerCase()
  if (!['fr', 'en'].includes(raw)) return ''
  if (provider === 'deepl') return raw === 'fr' ? 'FR' : 'EN'
  return raw
}

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
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
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Configuration Supabase incomplete' }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData?.user?.id) return json({ error: 'Session invalide' }, 401)

    const body = await req.json()
    const text = String(body?.text || '').trim()
    const sourceLang = String(body?.sourceLang || '').trim()
    const targetLang = String(body?.targetLang || '').trim()

    if (!text) return json({ error: 'Texte vide' }, 400)
    if (sourceLang === targetLang) return json({ success: true, translatedText: text }, 200)

    const mode = String(Deno.env.get('TRANSLATION_MODE') || 'disabled').trim().toLowerCase()
    const maxCharsPerRequest = parsePositiveInt(
      Deno.env.get('TRANSLATION_MAX_CHARS_PER_REQUEST'),
      1200
    )
    if (text.length > maxCharsPerRequest) {
      return json(
        {
          error: `Texte trop long (max ${maxCharsPerRequest} caracteres par requete)`
        },
        400
      )
    }

    if (mode === 'disabled') {
      return json(
        {
          error: "Traduction automatique desactivee (TRANSLATION_MODE=disabled).",
          hint: 'Choisir libretranslate ou deepl_free.'
        },
        403
      )
    }

    if (mode === 'deepl_free') {
      const deeplKey = String(Deno.env.get('DEEPL_API_KEY') || '').trim()
      if (!deeplKey) return json({ error: 'DEEPL_API_KEY manquante' }, 500)

      // Safety guard: DeepL Free API keys end with ":fx". Reject Pro keys.
      if (!deeplKey.endsWith(':fx')) {
        return json(
          {
            error:
              'Cle DeepL refusee: seule une cle API Free (suffixe :fx) est autorisee.'
          },
          403
        )
      }

      const deeplSource = normalizeLang(sourceLang, 'deepl')
      const deeplTarget = normalizeLang(targetLang, 'deepl')
      if (!deeplSource || !deeplTarget) return json({ error: 'Langues non supportees (fr/en)' }, 400)

      const hardMonthlyLimit = parsePositiveInt(
        Deno.env.get('TRANSLATION_HARD_MONTHLY_LIMIT'),
        400000
      )

      const usageRes = await fetch('https://api-free.deepl.com/v2/usage', {
        method: 'GET',
        headers: { Authorization: `DeepL-Auth-Key ${deeplKey}` }
      })
      if (!usageRes.ok) return json({ error: 'Impossible de verifier le quota DeepL' }, 502)
      const usage = await usageRes.json()
      const used = Number(usage?.character_count || 0)
      if (used + text.length > hardMonthlyLimit) {
        return json(
          {
            error: `Quota de securite atteint (${hardMonthlyLimit} caracteres/mois).`
          },
          429
        )
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
        return json({ error: `DeepL error: ${details}` }, 502)
      }
      const payload = await translateRes.json()
      const translatedText = String(payload?.translations?.[0]?.text || '')
      if (!translatedText) return json({ error: 'Traduction vide' }, 502)
      return json({ success: true, provider: 'deepl_free', translatedText })
    }

    if (mode === 'libretranslate') {
      const libreUrl = String(Deno.env.get('LIBRETRANSLATE_URL') || '').trim()
      const libreApiKey = String(Deno.env.get('LIBRETRANSLATE_API_KEY') || '').trim()
      if (!libreUrl) return json({ error: 'LIBRETRANSLATE_URL manquante' }, 500)

      const source = normalizeLang(sourceLang, 'libretranslate')
      const target = normalizeLang(targetLang, 'libretranslate')
      if (!source || !target) return json({ error: 'Langues non supportees (fr/en)' }, 400)

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
        return json({ error: `LibreTranslate error: ${details}` }, 502)
      }

      const result = await translateRes.json()
      const translatedText = String(result?.translatedText || '')
      if (!translatedText) return json({ error: 'Traduction vide' }, 502)
      return json({ success: true, provider: 'libretranslate', translatedText })
    }

    return json(
      {
        error: `TRANSLATION_MODE invalide: ${mode}`,
        allowed: ['disabled', 'libretranslate', 'deepl_free']
      },
      400
    )
  } catch (error: any) {
    return json({ error: String(error?.message || error) }, 500)
  }
})
