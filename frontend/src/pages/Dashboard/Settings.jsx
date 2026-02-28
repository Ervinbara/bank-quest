import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import SettingsTabs from '@/components/Dashboard/SettingsTabs'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import { dashboardGuides } from '@/data/dashboardGuides'
import { validatePassword } from '@/services/authService'
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  syncStripeSubscription
} from '@/services/billingService'
import { Save, Loader2, Check, AlertCircle, Lock } from 'lucide-react'

const PLAN_DETAILS = {
  solo: { price: '19 EUR/mois', limit: 'Jusqu a 50 clients', icon: 'S' },
  pro: { price: '49 EUR/mois', limit: 'Jusqu a 200 clients', icon: 'P' },
  cabinet: { price: '99 EUR/mois', limit: 'Clients illimites', icon: 'C' },
  test: { price: '1 EUR/mois', limit: 'Plan interne de validation', icon: 'T' }
}

const TEST_PLAN_ALLOWED_EMAILS = new Set(['bankquest.pro@gmail.com'])

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete'])
const SUBSCRIPTION_STATUS_COLORS = {
  active: 'text-green-700 bg-green-100',
  trialing: 'text-emerald-700 bg-emerald-100',
  past_due: 'text-amber-700 bg-amber-100',
  unpaid: 'text-red-700 bg-red-100',
  incomplete: 'text-orange-700 bg-orange-100',
  inactive: 'text-gray-700 bg-gray-100'
}

export default function Settings() {
  const { advisor, updateProfile, refreshAdvisor } = useAuth()
  const { tr, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
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
  }, [advisor])

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})

  const formatDate = (value) => {
    if (!value) return null
    const locale = language === 'fr' ? 'fr-FR' : 'en-US'
    return new Date(value).toLocaleDateString(locale)
  }

  const currentPlan = advisor?.plan || 'none'
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
  const canUseTestPlan = TEST_PLAN_ALLOWED_EMAILS.has(String(advisor?.email || '').toLowerCase())
  const availablePlans = canUseTestPlan
    ? ['solo', 'pro', 'cabinet', 'test']
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
        )}

        {activeTab === 'security' && (
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

                {!hasActiveSubscription ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>{tr('Aucun abonnement actif. Choisissez un plan ci-dessous pour activer la facturation.', 'No active subscription. Choose a plan below to activate billing.')}</span>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">{tr('Changer de plan', 'Change plan')}</h4>

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
                      <h5 className="font-bold text-lg mb-1 capitalize">{plan}</h5>
                      <p className="text-2xl font-bold text-gray-800 mb-2">{PLAN_DETAILS[plan].price}</p>
                      <p className="text-sm text-gray-600 mb-4">{PLAN_DETAILS[plan].limit}</p>

                      {!(hasActiveSubscription && currentPlan === plan) ? (
                        <button
                          disabled={Boolean(checkoutLoadingPlan) || portalLoading}
                          onClick={() => goToCheckout(plan)}
                          className="w-full py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          {checkoutLoadingPlan === plan
                            ? tr('Ouverture...', 'Opening...')
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


