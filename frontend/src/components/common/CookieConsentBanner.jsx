import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { logAdvisorEvent } from '@/services/auditService'

const STORAGE_KEY = 'finmate-cookie-consent-v1'

const readStoredConsent = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      version: parsed.version || 'v1',
      analytics: Boolean(parsed.analytics),
      updatedAt: parsed.updatedAt || new Date().toISOString()
    }
  } catch {
    return null
  }
}

const persistConsent = (consent) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
  window.dispatchEvent(new CustomEvent('finmate-cookie-consent-changed', { detail: consent }))
}

export default function CookieConsentBanner() {
  const { advisor, updateProfile } = useAuth()
  const { tr } = useLanguage()
  const [open, setOpen] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [analyticsChecked, setAnalyticsChecked] = useState(false)

  useEffect(() => {
    const stored = readStoredConsent()
    if (!stored) {
      setOpen(true)
      return
    }
    setAnalyticsChecked(Boolean(stored.analytics))
  }, [])

  const saveConsent = async (analyticsEnabled, source) => {
    const next = {
      version: 'v1',
      analytics: Boolean(analyticsEnabled),
      updatedAt: new Date().toISOString()
    }

    persistConsent(next)
    setAnalyticsChecked(next.analytics)
    setOpen(false)
    setShowCustomize(false)

    if (advisor?.id) {
      try {
        await updateProfile({
          analytics_cookies_enabled: next.analytics,
          analytics_cookies_updated_at: next.updatedAt
        })
      } catch (error) {
        console.warn('Failed to sync cookie consent to profile:', error?.message || error)
      }
      await logAdvisorEvent('cookie_consent_updated', {
        category: 'consent',
        metadata: { analyticsEnabled: next.analytics, source }
      })
    }
  }

  const consentSummary = useMemo(
    () =>
      analyticsChecked
        ? tr('Cookies analytiques actifs', 'Analytics cookies enabled')
        : tr('Cookies analytiques desactives', 'Analytics cookies disabled'),
    [analyticsChecked, tr]
  )

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {tr('Gestion des cookies', 'Cookie settings')}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {tr(
                'Nous utilisons des cookies strictement necessaires et, avec votre accord, des cookies analytiques pour ameliorer FinMate.',
                'We use strictly necessary cookies and, with your consent, analytics cookies to improve FinMate.'
              )}
            </p>
            <p className="text-xs text-slate-500 mt-2">{consentSummary}</p>
          </div>

          {showCustomize ? (
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={analyticsChecked}
                onChange={(event) => setAnalyticsChecked(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">
                {tr(
                  "Autoriser les cookies analytiques (mesure d'utilisation)",
                  'Allow analytics cookies (usage measurement)'
                )}
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveConsent(false, 'essential_only')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {tr('Uniquement necessaires', 'Necessary only')}
            </button>
            <button
              type="button"
              onClick={() => saveConsent(true, 'accept_all')}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {tr('Tout accepter', 'Accept all')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!showCustomize) {
                  setShowCustomize(true)
                  return
                }
                void saveConsent(analyticsChecked, 'customize')
              }}
              className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {showCustomize ? tr('Enregistrer mes choix', 'Save my choices') : tr('Personnaliser', 'Customize')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
