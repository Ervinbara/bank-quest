import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import SettingsTabs from '@/components/Dashboard/SettingsTabs'
import { isValidEmail, validatePassword } from '@/services/authService'
import { Save, Loader2, Check, AlertCircle, Lock } from 'lucide-react'

export default function Settings() {
  const { advisor, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // États pour le formulaire Profil
  const [profileData, setProfileData] = useState({
    name: advisor?.name || '',
    company: advisor?.company || '',
    phone: advisor?.phone || ''
  })

  // Synchroniser profileData quand advisor se charge après le rendu initial
  useEffect(() => {
    if (advisor) {
      setProfileData({
        name: advisor.name || '',
        company: advisor.company || '',
        phone: advisor.phone || ''
      })
    }
  }, [advisor?.id])

  // États pour le formulaire Sécurité
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [errors, setErrors] = useState({})

  // Gérer les changements dans le formulaire profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Gérer les changements dans le formulaire sécurité
  const handleSecurityChange = (e) => {
    const { name, value } = e.target
    setSecurityData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Valider le formulaire profil
  const validateProfile = () => {
    const newErrors = {}
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }
    
    if (!profileData.company.trim()) {
      newErrors.company = 'La société est requise'
    }
    
    return newErrors
  }

  // Valider le formulaire sécurité
  const validateSecurity = () => {
    const newErrors = {}
    
    if (!securityData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis'
    }
    
    if (!securityData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis'
    } else {
      const passwordError = validatePassword(securityData.newPassword)
      if (passwordError) {
        newErrors.newPassword = passwordError
      }
    }
    
    if (!securityData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (securityData.newPassword !== securityData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    
    return newErrors
  }

  // Sauvegarder le profil
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

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Erreur mise à jour profil:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    } finally {
      setLoading(false)
    }
  }

  // Changer le mot de passe
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
      // Vérifier le mot de passe actuel en tentant une réauthentification
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: advisor.email,
        password: securityData.currentPassword
      })

      if (signInError) {
        setErrors({ currentPassword: 'Mot de passe actuel incorrect' })
        setLoading(false)
        return
      }

      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: securityData.newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' })
      
      // Réinitialiser le formulaire
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Paramètres</h2>
        <p className="text-gray-600">Gérez votre compte et vos préférences</p>
      </div>

      {/* Tabs */}
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Message de succès/erreur */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Contenu des onglets */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* ONGLET PROFIL */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Informations personnelles
              </h3>
              <div className="space-y-4">
                {/* Email (non modifiable) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    value={advisor?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                {/* Nom */}
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
                      errors.name
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 focus:border-purple-500'
                    } focus:outline-none`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Société */}
                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
                    Société / Cabinet *
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
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="06 12 34 56 78"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        )}

        {/* ONGLET SÉCURITÉ */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Changer le mot de passe
              </h3>
              <div className="space-y-4">
                {/* Mot de passe actuel */}
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
                    placeholder="••••••••"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                  )}
                </div>

                {/* Nouveau mot de passe */}
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
                    placeholder="••••••••"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                </div>

                {/* Confirmer le mot de passe */}
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
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </>
              )}
            </button>
          </form>
        )}

        {/* ONGLET ABONNEMENT */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Abonnement actuel
              </h3>
              
              {/* Plan actuel */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800 capitalize">
                      Plan {advisor?.plan || 'Solo'}
                    </h4>
                    <p className="text-gray-600">
                      {advisor?.plan === 'solo' && '49€/mois - Jusqu\'à 50 clients'}
                      {advisor?.plan === 'pro' && '99€/mois - Jusqu\'à 200 clients'}
                      {advisor?.plan === 'cabinet' && '299€/mois - Clients illimités'}
                    </p>
                  </div>
                  <div className="text-4xl">
                    {advisor?.plan === 'solo' && '🥉'}
                    {advisor?.plan === 'pro' && '🥇'}
                    {advisor?.plan === 'cabinet' && '👑'}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Prochain paiement le 26 mars 2026</span>
                </div>
              </div>

              {/* Autres plans */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-800">Changer de plan</h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Solo */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    advisor?.plan === 'solo' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <h5 className="font-bold text-lg mb-1">Solo</h5>
                    <p className="text-2xl font-bold text-gray-800 mb-2">49€<span className="text-sm text-gray-600">/mois</span></p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ 50 clients max</li>
                      <li>✓ 8 modules quiz</li>
                      <li>✓ Support email</li>
                    </ul>
                    {advisor?.plan !== 'solo' && (
                      <button className="w-full py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
                        Choisir Solo
                      </button>
                    )}
                  </div>

                  {/* Pro */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    advisor?.plan === 'pro' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <h5 className="font-bold text-lg mb-1">Pro ⭐</h5>
                    <p className="text-2xl font-bold text-gray-800 mb-2">99€<span className="text-sm text-gray-600">/mois</span></p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ 200 clients max</li>
                      <li>✓ Modules illimités</li>
                      <li>✓ Support prioritaire</li>
                    </ul>
                    {advisor?.plan !== 'pro' && (
                      <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                        {advisor?.plan === 'solo' ? 'Upgrader' : 'Downgrader'}
                      </button>
                    )}
                  </div>

                  {/* Cabinet */}
                  <div className={`border-2 rounded-xl p-4 transition-all ${
                    advisor?.plan === 'cabinet' 
                      ? 'border-purple-600 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}>
                    <h5 className="font-bold text-lg mb-1">Cabinet</h5>
                    <p className="text-2xl font-bold text-gray-800 mb-2">299€<span className="text-sm text-gray-600">/mois</span></p>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ Clients illimités</li>
                      <li>✓ Multi-utilisateurs</li>
                      <li>✓ Support dédié</li>
                    </ul>
                    {advisor?.plan !== 'cabinet' && (
                      <button className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                        Upgrader
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Annuler l'abonnement */}
              <div className="mt-8 pt-6 border-t">
                <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                  Annuler mon abonnement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}