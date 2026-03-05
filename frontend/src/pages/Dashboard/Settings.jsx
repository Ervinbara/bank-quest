import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { TEST_PLAN_ALLOWED_EMAILS, getPlanAccess } from '@/lib/planAccess'
import SettingsTabs from '@/components/Dashboard/SettingsTabs'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import { dashboardGuides } from '@/data/dashboardGuides'
import { getMfaStatus, reauthenticateUser, validatePassword } from '@/services/authService'
import { getAdvisorAuditLogs, logAdvisorEvent } from '@/services/auditService'
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  syncStripeSubscription
} from '@/services/billingService'
import { deleteAdvisorAccount, exportAdvisorDataAsJson } from '@/services/privacyService'
import { Save, Loader2, Check, AlertCircle, Lock, ShieldCheck } from 'lucide-react'

const PLAN_DETAILS = {
  solo: { price: '19.99 EUR/mois', limit: '50 clients + 100 emails/mois', icon: 'S' },
  pro: { price: '49.99 EUR/mois', limit: '200 clients + 500 emails/mois', icon: 'P' },
  cabinet: { price: '99.99 EUR/mois', limit: 'Clients illimites + 2000 emails/mois', icon: 'C' },
  test: { price: '1 EUR/mois', limit: 'Plan interne (emails illimites)', icon: 'T' }
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])
const SUBSCRIPTION_STATUS_COLORS = {
  active: 'text-green-700 bg-green-100',
  trialing: 'text-emerald-700 bg-emerald-100',
  past_due: 'text-amber-700 bg-amber-100',
  unpaid: 'text-red-700 bg-red-100',
  incomplete: 'text-orange-700 bg-orange-100',
  inactive: 'text-gray-700 bg-gray-100'
}
const RECENT_AUTH_WINDOW_MS = 10 * 60 * 1000

export default function Settings() {
  const { user, advisor, updateProfile, refreshAdvisor } = useAuth()
  const { tr, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [testPlanTarget, setTestPlanTarget] = useState('none')
  const [securityOverview, setSecurityOverview] = useState({
    recentAuthAt: null,
    mfaVerifiedCount: 0
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [message, setMessage] = useState(null)

  const [profileData, setProfileData] = useState({
    name: advisor?.name || '',
    company: advisor?.company || '',
    phone: advisor?.phone || ''
  })

  useEffect(() => {
    if (!advisor) return
    setProfileData({
      name: advisor.name || '',
      company: advisor.company || '',
      phone: advisor.phone || ''
    })
    setTestPlanTarget(String(advisor.plan || 'none').toLowerCase())
    setConsentData({
      marketingOptIn: Boolean(advisor.marketing_opt_in),
      analyticsCookiesEnabled: Boolean(advisor.analytics_cookies_enabled),
      gamificationEnabled: advisor.gamification_enabled !== false,
      smartAlertsEnabled: advisor.smart_alerts_enabled !== false,
      smartAlertsDelayDays: Math.max(1, Number(advisor.smart_alerts_delay_days || 7))
    })
  }, [advisor])

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [consentData, setConsentData] = useState({
    marketingOptIn: Boolean(advisor?.marketing_opt_in),
    analyticsCookiesEnabled: Boolean(advisor?.analytics_cookies_enabled),
    gamificationEnabled: advisor?.gamification_enabled !== false,
    smartAlertsEnabled: advisor?.smart_alerts_enabled !== false,
    smartAlertsDelayDays: Math.max(1, Number(advisor?.smart_alerts_delay_days || 7))
  })

  const [errors, setErrors] = useState({})

  const formatDate = (value) => {
    if (!value) return null
    const locale = language === 'fr' ? 'fr-FR' : 'en-US'
    return new Date(value).toLocaleDateString(locale)
  }

  const currentPlan = advisor?.plan || 'none'
  const planAccess = getPlanAccess(currentPlan)
  const subscriptionStatus = String(advisor?.subscription_status || 'inactive').toLowerCase()
  const hasActiveSubscription = ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)
  const hasStripeCustomer = Boolean(advisor?.stripe_customer_id)
  const currentPeriodStart = formatDate(advisor?.current_period_start)
  const currentPeriodEnd = formatDate(advisor?.current_period_end)
  const subscriptionStartedAt = formatDate(advisor?.subscription_started_at)
  const subscriptionEndedAt = formatDate(advisor?.subscription_ended_at)
  const cancelAt = formatDate(advisor?.cancel_at)
  const canceledAt = formatDate(advisor?.canceled_at)
  const statusLabel = {
    active: tr('Actif', 'Active'),
    trialing: tr('Essai', 'Trialing'),
    past_due: tr('Paiement en retard', 'Past due'),
    unpaid: tr('Impayes', 'Unpaid'),
    incomplete: tr('En attente', 'Incomplete'),
    inactive: tr('Inactif', 'Inactive')
  }[subscriptionStatus] || subscriptionStatus
  const planTitle = currentPlan === 'none' ? tr('Aucun plan payant', 'No paid plan') : `Plan ${currentPlan}`
  const currentUserEmail = String(user?.email || advisor?.email || '').toLowerCase()
  const canUseTestPlan = TEST_PLAN_ALLOWED_EMAILS.has(currentUserEmail)
  const availablePlans = canUseTestPlan
    ? ['none', 'solo', 'pro', 'cabinet', 'test']
    : ['solo', 'pro', 'cabinet']

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    const portalStatus = searchParams.get('portal')
    if (!checkoutStatus && !portalStatus) return

    if (checkoutStatus === 'success') {
      void (async () => {
        try {
          await syncStripeSubscription()
          await refreshAdvisor()
          setMessage({ type: 'success', text: tr('Paiement confirme. Formule mise a jour.', 'Payment confirmed. Plan updated.') })
        } catch {
          await refreshAdvisor()
          setMessage({
            type: 'success',
            text: tr(
              'Paiement confirme. Synchronisation en cours, rafraichissez si besoin.',
              'Payment confirmed. Sync in progress, refresh if needed.'
            )
          })
        }
      })()
    } else if (checkoutStatus === 'cancel') {
      setMessage({ type: 'error', text: tr('Paiement annule.', 'Payment canceled.') })
    } else if (portalStatus === 'return') {
      void (async () => {
        try {
          await syncStripeSubscription()
        } catch {
          // fallback: rely on webhook
        }
        await refreshAdvisor()
        setMessage({ type: 'success', text: tr('Retour du portail de facturation.', 'Returned from billing portal.') })
      })()
    }

    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    next.delete('portal')
    setSearchParams(next, { replace: true })
    setTimeout(() => setMessage(null), 3000)
  }, [searchParams, setSearchParams, refreshAdvisor, tr])

  useEffect(() => {
    if (activeTab !== 'security') return

    const run = async () => {
      try {
        setMfaLoading(true)
        const { verifiedCount } = await getMfaStatus()
        setSecurityOverview((prev) => ({ ...prev, mfaVerifiedCount: verifiedCount }))
      } catch {
        setSecurityOverview((prev) => ({ ...prev, mfaVerifiedCount: 0 }))
      } finally {
        setMfaLoading(false)
      }

      try {
        const rows = await getAdvisorAuditLogs(8)
        setAuditLogs(rows)
      } catch {
        setAuditLogs([])
      }
    }

    void run()
  }, [activeTab])

  const hasRecentAuth = () => {
    if (!securityOverview.recentAuthAt) return false
    return Date.now() - securityOverview.recentAuthAt < RECENT_AUTH_WINDOW_MS
  }

  const ensureRecentAuth = async () => {
    if (hasRecentAuth()) return true

    const password = window.prompt(
      tr(
        'Pour des raisons de securite, saisissez votre mot de passe pour confirmer cette action.',
        'For security reasons, enter your password to confirm this action.'
      )
    )

    if (!password) return false

    await reauthenticateUser(advisor.email, password)
    const now = Date.now()
    setSecurityOverview((prev) => ({ ...prev, recentAuthAt: now }))
    await logAdvisorEvent('security_reauthentication', {
      category: 'security',
      metadata: { reason: 'sensitive_action' }
    })
    return true
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSecurityChange = (e) => {
    const { name, value } = e.target
    setSecurityData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleConsentChange = (e) => {
    const { name, checked } = e.target
    setConsentData((prev) => ({ ...prev, [name]: checked }))
  }

  const validateProfile = () => {
    const newErrors = {}
    if (!profileData.name.trim()) newErrors.name = 'Le nom est requis'
    if (!profileData.company.trim()) newErrors.company = 'La societe est requise'
    return newErrors
  }

  const validateSecurity = () => {
    const newErrors = {}

    if (!securityData.currentPassword) newErrors.currentPassword = 'Le mot de passe actuel est requis'

    if (!securityData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis'
    } else {
      const passwordError = validatePassword(securityData.newPassword)
      if (passwordError) newErrors.newPassword = passwordError
    }

    if (!securityData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (securityData.newPassword !== securityData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    return newErrors
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const newErrors = validateProfile()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await updateProfile({
        name: profileData.name,
        company: profileData.company,
        phone: profileData.phone
      })
      await logAdvisorEvent('profile_updated', {
        category: 'account',
        metadata: { fields: ['name', 'company', 'phone'] }
      })
      setMessage({ type: 'success', text: tr('Profil mis a jour avec succes.', 'Profile updated successfully.') })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur mise a jour profil:', error)
      setMessage({ type: 'error', text: tr('Erreur lors de la mise a jour', 'Update failed') })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    const newErrors = validateSecurity()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: advisor.email,
        password: securityData.currentPassword
      })

      if (signInError) {
        setErrors({ currentPassword: 'Mot de passe actuel incorrect' })
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: securityData.newPassword })
      if (error) throw error

      await logAdvisorEvent('password_changed', {
        category: 'security'
      })

      setMessage({ type: 'success', text: tr('Mot de passe modifie avec succes.', 'Password updated successfully.') })
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur changement mot de passe:', error)
      setMessage({ type: 'error', text: tr('Erreur lors du changement de mot de passe', 'Password change failed') })
    } finally {
      setLoading(false)
    }
  }

  const goToCheckout = async (plan) => {
    try {
      setCheckoutLoadingPlan(plan)
      setMessage(null)
      const url = await createStripeCheckoutSession(plan)
      window.location.href = url
    } catch (error) {
      setMessage({ type: 'error', text: error.message || tr('Erreur Stripe checkout', 'Stripe checkout error') })
    } finally {
      setCheckoutLoadingPlan(null)
    }
  }

  const openCustomerPortal = async () => {
    if (!hasStripeCustomer) {
      setMessage({
        type: 'error',
        text: tr('Aucun compte Stripe associe. Souscrivez d abord a un plan.', 'No Stripe customer linked yet. Subscribe to a plan first.')
      })
      return
    }

    try {
      setPortalLoading(true)
      setMessage(null)
      const url = await createStripeCustomerPortalSession()
      window.location.href = url
    } catch (error) {
      setMessage({ type: 'error', text: error.message || tr('Erreur portail Stripe', 'Stripe portal error') })
    } finally {
      setPortalLoading(false)
    }
  }

  const switchPlanForTestAdmin = async (plan) => {
    if (!canUseTestPlan) return
    const normalized = String(plan || 'none').trim().toLowerCase()
    const now = new Date().toISOString()
    const isFree = normalized === 'none'

    const updates = {
      plan: normalized,
      subscription_status: isFree ? 'inactive' : 'active',
      subscription_started_at: isFree ? null : now,
      current_period_start: isFree ? null : now,
      current_period_end: isFree ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      cancel_at: null,
      canceled_at: null,
      subscription_ended_at: isFree ? now : null,
      subscription_updated_at: now
    }

    try {
      setCheckoutLoadingPlan(normalized)
      setMessage(null)
      const { error } = await supabase.from('advisors').update(updates).eq('id', advisor.id)
      if (error) throw error
      await refreshAdvisor()
      setMessage({
        type: 'success',
        text: tr(`Plan bascule en mode test: ${normalized}`, `Plan switched in test mode: ${normalized}`)
      })
      setTestPlanTarget(normalized)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || tr('Bascule test impossible', 'Unable to switch plan in test mode')
      })
    } finally {
      setCheckoutLoadingPlan(null)
    }
  }

  const saveConsentSettings = async () => {
    const now = new Date().toISOString()
    setConsentLoading(true)
    setMessage(null)

    try {
      await updateProfile({
        marketing_opt_in: Boolean(consentData.marketingOptIn),
        marketing_opt_in_updated_at: now,
        analytics_cookies_enabled: Boolean(consentData.analyticsCookiesEnabled),
        analytics_cookies_updated_at: now,
        gamification_enabled: Boolean(consentData.gamificationEnabled),
        gamification_updated_at: now,
        smart_alerts_enabled: Boolean(consentData.smartAlertsEnabled),
        smart_alerts_delay_days: Math.max(1, Number(consentData.smartAlertsDelayDays || 7)),
        smart_alerts_updated_at: now
      })

      await Promise.all([
        supabase.from('advisor_consent_events').insert([
          {
            advisor_id: advisor.id,
            consent_type: 'marketing',
            status: Boolean(consentData.marketingOptIn),
            legal_version: advisor?.terms_version || null,
            metadata: { source: 'settings' }
          },
          {
            advisor_id: advisor.id,
            consent_type: 'cookies_analytics',
            status: Boolean(consentData.analyticsCookiesEnabled),
            legal_version: advisor?.privacy_policy_version || null,
            metadata: { source: 'settings' }
          }
        ]),
        logAdvisorEvent('consent_preferences_updated', {
          category: 'consent',
          metadata: {
            marketingOptIn: Boolean(consentData.marketingOptIn),
            analyticsCookiesEnabled: Boolean(consentData.analyticsCookiesEnabled),
            gamificationEnabled: Boolean(consentData.gamificationEnabled),
            smartAlertsEnabled: Boolean(consentData.smartAlertsEnabled),
            smartAlertsDelayDays: Math.max(1, Number(consentData.smartAlertsDelayDays || 7))
          }
        })
      ])

      setMessage({
        type: 'success',
        text: tr('Preferences de consentement enregistrees.', 'Consent preferences saved.')
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || tr('Mise a jour des consentements impossible', 'Unable to update consent preferences')
      })
    } finally {
      setConsentLoading(false)
    }
  }

  const handleDataExport = async () => {
    try {
      const allowed = await ensureRecentAuth()
      if (!allowed) return
      setExportLoading(true)
      setMessage(null)
      await exportAdvisorDataAsJson(advisor)
      await logAdvisorEvent('gdpr_export_requested', {
        category: 'privacy'
      })
      setMessage({
        type: 'success',
        text: tr('Export termine. Le fichier JSON a ete telecharge.', 'Export completed. JSON file has been downloaded.')
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || tr('Export impossible', 'Export failed')
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      tr(
        'Cette action supprimera definitivement votre compte et toutes vos donnees. Confirmer ?',
        'This action will permanently delete your account and all data. Confirm?'
      )
    )
    if (!confirmed) return

    try {
      const allowed = await ensureRecentAuth()
      if (!allowed) return
      setDeleteLoading(true)
      setMessage(null)
      await logAdvisorEvent('account_deletion_requested', {
        category: 'privacy',
        severity: 'warning'
      })
      await deleteAdvisorAccount()
      try {
        await supabase.auth.signOut()
      } catch {
        // user may already be invalidated server-side
      }
      window.location.href = '/'
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || tr('Suppression du compte impossible', 'Account deletion failed')
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{tr('Parametres', 'Settings')}</h2>
          <p className="text-gray-600">{tr('Gerez votre compte et vos preferences', 'Manage your account and preferences')}</p>
        </div>
        <DashboardGuide guide={dashboardGuides.settings} />
      </div>

      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Informations personnelles</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email professionnel</label>
                  <input
                    type="email"
                    value={advisor?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                    } focus:outline-none`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                    Societe / Cabinet *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      errors.company
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-emerald-500'
                    } focus:outline-none`}
                  />
                  {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? tr('Enregistrement...', 'Saving...') : tr('Enregistrer les modifications', 'Save changes')}
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 p-4 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">{tr('Experience utilisateur', 'User experience')}</h3>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="gamificationEnabled"
                checked={consentData.gamificationEnabled}
                onChange={handleConsentChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {tr(
                  'Afficher la gamification (missions, niveaux, badges) sur le tableau de bord.',
                  'Show gamification (missions, levels, badges) on the dashboard.'
                )}
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="smartAlertsEnabled"
                checked={consentData.smartAlertsEnabled}
                onChange={handleConsentChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {tr(
                  'Activer les alertes intelligentes (sans reponse et score en baisse).',
                  'Enable smart alerts (no response and score drop).'
                )}
              </span>
            </label>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {tr('Delai alerte sans reponse (jours)', 'No-response alert delay (days)')}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={consentData.smartAlertsDelayDays}
                onChange={(e) =>
                  setConsentData((prev) => ({
                    ...prev,
                    smartAlertsDelayDays: Math.min(60, Math.max(1, Number(e.target.value || 7)))
                  }))
                }
                disabled={!consentData.smartAlertsEnabled}
                className="w-32 px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <button
              type="button"
              onClick={saveConsentSettings}
              disabled={consentLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {consentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {tr('Enregistrer ce choix', 'Save this preference')}
            </button>
          </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{tr('Changer le mot de passe', 'Change password')}</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe actuel *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    onChange={handleSecurityChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      errors.currentPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-emerald-500'
                    } focus:outline-none`}
                  />
                  {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={securityData.newPassword}
                    onChange={handleSecurityChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      errors.newPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-emerald-500'
                    } focus:outline-none`}
                  />
                  {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityChange}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-emerald-500'
                    } focus:outline-none`}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {loading ? tr('Modification...', 'Updating...') : tr('Changer le mot de passe', 'Change password')}
            </button>
            </form>

            <div className="border-t pt-8 space-y-6">
              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{tr('Consentements', 'Consents')}</h3>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="marketingOptIn"
                    checked={consentData.marketingOptIn}
                    onChange={handleConsentChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    {tr(
                      'Recevoir les communications produit (optionnel).',
                      'Receive product communications (optional).'
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="analyticsCookiesEnabled"
                    checked={consentData.analyticsCookiesEnabled}
                    onChange={handleConsentChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    {tr(
                      "Autoriser les cookies analytiques pour ameliorer l'application.",
                      'Allow analytics cookies to improve the app.'
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="gamificationEnabled"
                    checked={consentData.gamificationEnabled}
                    onChange={handleConsentChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    {tr(
                      'Activer le parcours ludique (missions, niveaux, badges) sur le tableau de bord.',
                      'Enable playful journey (missions, levels, badges) on the dashboard.'
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="smartAlertsEnabled"
                    checked={consentData.smartAlertsEnabled}
                    onChange={handleConsentChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    {tr(
                      'Activer les alertes intelligentes (sans reponse et score en baisse).',
                      'Enable smart alerts (no response and score drop).'
                    )}
                  </span>
                </label>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {tr('Delai alerte sans reponse (jours)', 'No-response alert delay (days)')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={consentData.smartAlertsDelayDays}
                    onChange={(e) =>
                      setConsentData((prev) => ({
                        ...prev,
                        smartAlertsDelayDays: Math.min(60, Math.max(1, Number(e.target.value || 7)))
                      }))
                    }
                    disabled={!consentData.smartAlertsEnabled}
                    className="w-32 px-3 py-2 rounded-lg border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveConsentSettings}
                  disabled={consentLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-4 py-2 font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {consentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {tr('Enregistrer mes consentements', 'Save my consents')}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-xl font-bold text-gray-800">{tr('Securite avancee', 'Advanced security')}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    {tr('Re-authentification recente', 'Recent re-authentication')}:{' '}
                    <span className="font-semibold">
                      {hasRecentAuth()
                        ? tr('Oui (moins de 10 min)', 'Yes (less than 10 min)')
                        : tr('Non', 'No')}
                    </span>
                  </p>
                  <p>
                    {tr('Facteurs MFA verifies', 'Verified MFA factors')}:{' '}
                    <span className="font-semibold">
                      {mfaLoading ? tr('Chargement...', 'Loading...') : securityOverview.mfaVerifiedCount}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {tr('Rafraichir securite', 'Refresh security')}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-4">
                <h3 className="text-xl font-bold text-gray-800">{tr('RGPD et donnees personnelles', 'GDPR and personal data')}</h3>
                <p className="text-sm text-gray-600">
                  {tr(
                    'Actions sensibles: une re-authentification peut etre demandee.',
                    'Sensitive actions: re-authentication may be required.'
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleDataExport}
                    disabled={exportLoading || deleteLoading}
                    className="px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {exportLoading ? tr('Export en cours...', 'Exporting...') : tr('Exporter mes donnees (JSON)', 'Export my data (JSON)')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAccountDeletion}
                    disabled={deleteLoading || exportLoading}
                    className="px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleteLoading ? tr('Suppression en cours...', 'Deleting...') : tr('Supprimer mon compte', 'Delete my account')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">{tr('Journal des actions recentes', 'Recent activity log')}</h3>
                {auditLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">{tr('Aucun evenement recent.', 'No recent events.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {auditLogs.map((event) => (
                      <li key={event.id} className="text-sm rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">{event.action}</span>
                          <span className="text-xs text-slate-500">{event.category}</span>
                          <span className="text-xs text-slate-500">
                            {formatDate(event.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{tr('Formule actuelle', 'Current plan')}</h3>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800 capitalize">{planTitle}</h4>
                    {currentPlan !== 'none' ? (
                      <p className="text-gray-600">
                        {PLAN_DETAILS[currentPlan]?.price || PLAN_DETAILS.solo.price} -{' '}
                        {PLAN_DETAILS[currentPlan]?.limit || PLAN_DETAILS.solo.limit}
                      </p>
                    ) : (
                      <p className="text-gray-600">
                        {tr('Demarrez sans abonnement puis activez un plan a tout moment.', 'Start without a subscription and activate a plan anytime.')}
                      </p>
                    )}
                  </div>
                  <div className="text-4xl">{PLAN_DETAILS[currentPlan]?.icon || '0'}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-600">{tr('Statut', 'Status')}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${SUBSCRIPTION_STATUS_COLORS[subscriptionStatus] || SUBSCRIPTION_STATUS_COLORS.inactive}`}>
                    {statusLabel}
                  </span>
                  {advisor?.cancel_at_period_end ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-100">
                      {tr('Resiliation programmee fin de periode', 'Cancellation scheduled at period end')}
                    </span>
                  ) : null}
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <p>{tr('Souscrit le', 'Subscribed on')}: <span className="font-semibold">{subscriptionStartedAt || tr('Non renseigne', 'Not available')}</span></p>
                  <p>{tr('Periode en cours depuis', 'Current period starts')}: <span className="font-semibold">{currentPeriodStart || tr('Non renseigne', 'Not available')}</span></p>
                  <p>{tr('Prochaine echeance', 'Next billing date')}: <span className="font-semibold">{currentPeriodEnd || tr('Aucune', 'None')}</span></p>
                  <p>{tr('Fin d abonnement', 'Subscription end')}: <span className="font-semibold">{subscriptionEndedAt || tr('Non terminee', 'Not ended')}</span></p>
                  <p>{tr('Resiliation demandee pour', 'Cancellation date')}: <span className="font-semibold">{cancelAt || tr('Aucune', 'None')}</span></p>
                  <p>{tr('Resilie le', 'Canceled on')}: <span className="font-semibold">{canceledAt || tr('Non', 'No')}</span></p>
                </div>

                <div className="mt-4 rounded-lg border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-1">{tr('Droits inclus dans votre plan', 'Rights included in your plan')}</p>
                  <p>
                    {planAccess.maxClients === null
                      ? tr('Clients: illimites', 'Clients: unlimited')
                      : tr(`Clients: jusqu a ${planAccess.maxClients}`, `Clients: up to ${planAccess.maxClients}`)}
                  </p>
                  <p>
                    {tr('Envoi email invitation', 'Invitation email sending')}: {planAccess.canSendInvitationEmails ? tr('Autorise', 'Allowed') : tr('Non inclus', 'Not included')}
                  </p>
                </div>

                {!hasActiveSubscription ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>{tr('Aucun abonnement actif. Choisissez un plan ci-dessous pour activer la facturation.', 'No active subscription. Choose a plan below to activate billing.')}</span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">{tr('Changer de plan', 'Change plan')}</h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900 mb-2">
                    {tr('Limites par plan', 'Limits by plan')}
                  </p>
                  <p>{tr('Gratuit (none): 5 clients, pas d envoi email invitation.', 'Free (none): 5 clients, no invitation email sending.')}</p>
                  <p>{tr('Solo: 50 clients, 100 emails invitation/mois.', 'Solo: 50 clients, 100 invitation emails/month.')}</p>
                  <p>{tr('Pro: 200 clients, 500 emails invitation/mois.', 'Pro: 200 clients, 500 invitation emails/month.')}</p>
                  <p>{tr('Cabinet: clients illimites, 2000 emails invitation/mois.', 'Cabinet: unlimited clients, 2000 invitation emails/month.')}</p>
                  <p>{tr('Test: clients et emails illimites (compte admin test).', 'Test: unlimited clients and emails (test admin account).')}</p>
                </div>

                {canUseTestPlan ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-3">
                    <p className="font-semibold">
                      {tr(
                        'Mode test admin actif: bascule de plan sans Stripe ni paiement.',
                        'Admin test mode active: switch plans without Stripe or payment.'
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={testPlanTarget}
                        onChange={(event) => setTestPlanTarget(event.target.value)}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                      >
                        <option value="none">{tr('Gratuit (none)', 'Free (none)')}</option>
                        <option value="solo">Solo</option>
                        <option value="pro">Pro</option>
                        <option value="cabinet">Cabinet</option>
                        <option value="test">Test</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void switchPlanForTestAdmin(testPlanTarget)}
                        disabled={Boolean(checkoutLoadingPlan)}
                        className="rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        {tr('Appliquer sans paiement', 'Apply without payment')}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="grid md:grid-cols-3 gap-4">
                  {availablePlans.map((plan) => (
                    <div
                      key={plan}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        currentPlan === plan
                          ? 'border-emerald-600 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <h5 className="font-bold text-lg mb-1 capitalize">{plan === 'none' ? 'Gratuit' : plan}</h5>
                      <p className="text-2xl font-bold text-gray-800 mb-2">{PLAN_DETAILS[plan]?.price || tr('0 EUR/mois', '0 EUR/month')}</p>
                      <p className="text-sm text-gray-600 mb-4">{PLAN_DETAILS[plan]?.limit || tr('Jusqu a 5 clients, sans envoi email', 'Up to 5 clients, no invitation email')}</p>

                      {!(hasActiveSubscription && currentPlan === plan) ? (
                        <button
                          disabled={Boolean(checkoutLoadingPlan) || portalLoading}
                          onClick={() => {
                            if (canUseTestPlan) {
                              void switchPlanForTestAdmin(plan)
                              return
                            }
                            void goToCheckout(plan)
                          }}
                          className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {checkoutLoadingPlan === plan
                            ? tr('Ouverture...', 'Opening...')
                            : canUseTestPlan
                              ? tr('Activer ce plan (mode test)', 'Activate this plan (test mode)')
                              : hasActiveSubscription
                              ? tr('Basculer vers ce plan', 'Switch to this plan')
                              : tr('Souscrire a ce plan', 'Subscribe to this plan')}
                        </button>
                      ) : (
                        <div className="w-full py-2 text-center text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-lg">
                          {tr('Plan actuel', 'Current plan')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <button
                  disabled={portalLoading || Boolean(checkoutLoadingPlan) || !hasStripeCustomer}
                  onClick={openCustomerPortal}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {portalLoading ? tr('Ouverture du portail...', 'Opening portal...') : tr('Gerer mon abonnement (Stripe)', 'Manage my subscription (Stripe)')}
                </button>
                {!hasStripeCustomer ? (
                  <p className="mt-2 text-xs text-gray-500">
                    {tr('Le portail Stripe sera disponible apres une premiere souscription.', 'Stripe portal becomes available after your first subscription.')}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


