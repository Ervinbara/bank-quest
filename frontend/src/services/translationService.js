import { supabase } from '@/lib/supabase'

const LOCAL_DICTIONARY = {
  'questionnaire': { fr: 'questionnaire', en: 'questionnaire' },
  'conseiller financier': { fr: 'conseiller financier', en: 'financial advisor' },
  'profil de risque': { fr: 'profil de risque', en: 'risk profile' },
  'objectif retraite': { fr: 'objectif retraite', en: 'retirement goal' }
}

const normalize = (value) => String(value || '').trim().toLowerCase()

export const localTranslate = ({ text, sourceLang, targetLang }) => {
  if (!text || sourceLang === targetLang) return text || ''
  const key = normalize(text)
  const match = LOCAL_DICTIONARY[key]
  if (!match) return ''
  return match[targetLang] || ''
}

export const translateText = async ({ text, sourceLang = 'fr', targetLang = 'en' }) => {
  const localResult = localTranslate({ text, sourceLang, targetLang })
  if (localResult) return { translatedText: localResult, provider: 'local' }

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token
  if (!token) throw new Error('Session utilisateur invalide')

  const response = await supabase.functions.invoke('translate-text', {
    headers: { Authorization: `Bearer ${token}` },
    body: { text, sourceLang, targetLang }
  })

  if (response.error) {
    throw new Error(response.error.message || 'Erreur traduction')
  }
  if (!response.data?.success || !response.data?.translatedText) {
    throw new Error(response.data?.error || 'Traduction indisponible')
  }

  return {
    translatedText: response.data.translatedText,
    provider: response.data.provider || 'unknown'
  }
}
