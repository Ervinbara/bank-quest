import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import SettingsTabs from '@/components/Dashboard/SettingsTabs'
import { validatePassword } from '@/services/authService'
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession
} from '@/services/billingService'
import { Save, Loader2, Check, AlertCircle, Lock } from 'lucide-react'

const PLAN_DETAILS = {
  solo: { price: '49 EUR/mois', limit: 'Jusqu a 50 clients', icon: 'S' },
  pro: { price: '99 EUR/mois', limit: 'Jusqu a 200 clients', icon: 'P' },
  cabinet: { price: '299 EUR/mois', limit: 'Clients illimites', icon: 'C' }
}

export default function Settings() {
  const { advisor, updateProfile, refreshAdvisor } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
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

  const currentPlan = advisor?.plan || 'solo'
  const subscriptionStatus = advisor?.subscription_status || 'inactive'
  const currentPeriodEnd = advisor?.current_period_end
    ? new Date(advisor.current_period_end).toLocaleDateString('fr-FR')
    : null

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    const portalStatus = searchParams.get('portal')
    if (!checkoutStatus && !portalStatus) return

    if (checkoutStatus === 'success') {
      setMessage({ type: 'success', text: 'Paiement confirme. Abonnement mis a jour.' })
      void refreshAdvisor()
    } else if (checkoutStatus === 'cancel') {
      setMessage({ type: 'error', text: 'Paiement annule.' })
    } else if (portalStatus === 'return') {
      setMessage({ type: 'success', text: 'Retour du portail de facturation.' })
      void refreshAdvisor()
    }

    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    next.delete('portal')
    setSearchParams(next, { replace: true })
    setTimeout(() => setMessage(null), 3000)
  }, [searchParams, setSearchParams, refreshAdvisor])

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
      setMessage({ type: 'success', text: 'Profil mis a jour avec succes.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur mise a jour profil:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise a jour' })
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

      setMessage({ type: 'success', text: 'Mot de passe modifie avec succes.' })
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur changement mot de passe:', error)
      setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' })
    } finally {
      setLoading(false)
    }
  }

  const goToCheckout = async (plan) => {
    try {
      setBillingLoading(true)
      setMessage(null)
      const url = await createStripeCheckoutSession(plan)
      window.location.href = url
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur Stripe checkout' })
    } finally {
      setBillingLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    try {
      setBillingLoading(true)
      setMessage(null)
      const url = await createStripeCustomerPortalSession()
      window.location.href = url
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur portail Stripe' })
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Parametres</h2>
        <p className="text-gray-600">Gerez votre compte et vos preferences</p>
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
                      errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
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
                        : 'border-gray-200 focus:border-purple-500'
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Changer le mot de passe</h3>
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
                        : 'border-gray-200 focus:border-purple-500'
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
                        : 'border-gray-200 focus:border-purple-500'
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
                        : 'border-gray-200 focus:border-purple-500'
                    } focus:outline-none`}
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
              {loading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Abonnement actuel</h3>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800 capitalize">Plan {currentPlan}</h4>
                    <p className="text-gray-600">
                      {PLAN_DETAILS[currentPlan]?.price || PLAN_DETAILS.solo.price} -{' '}
                      {PLAN_DETAILS[currentPlan]?.limit || PLAN_DETAILS.solo.limit}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Statut: {subscriptionStatus}</p>
                  </div>
                  <div className="text-4xl">{PLAN_DETAILS[currentPlan]?.icon || 'S'}</div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{currentPeriodEnd ? `Prochaine echeance le ${currentPeriodEnd}` : 'Aucune echeance active'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">Changer de plan</h4>

                <div className="grid md:grid-cols-3 gap-4">
                  {['solo', 'pro', 'cabinet'].map((plan) => (
                    <div
                      key={plan}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        currentPlan === plan
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <h5 className="font-bold text-lg mb-1 capitalize">{plan}</h5>
                      <p className="text-2xl font-bold text-gray-800 mb-2">{PLAN_DETAILS[plan].price}</p>
                      <p className="text-sm text-gray-600 mb-4">{PLAN_DETAILS[plan].limit}</p>

                      {currentPlan !== plan ? (
                        <button
                          disabled={billingLoading}
                          onClick={() => goToCheckout(plan)}
                          className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                        >
                          {billingLoading ? 'Ouverture...' : 'Choisir ce plan'}
                        </button>
                      ) : (
                        <div className="w-full py-2 text-center text-sm font-semibold text-purple-700 bg-purple-100 rounded-lg">
                          Plan actuel
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <button
                  disabled={billingLoading}
                  onClick={openCustomerPortal}
                  className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-60"
                >
                  {billingLoading ? 'Ouverture du portail...' : 'Gerer mon abonnement (Stripe)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
