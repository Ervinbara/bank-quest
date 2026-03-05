import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { isValidEmail, validatePassword } from '@/services/authService'

export default function Register() {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()
  const { t, tr, language } = useLanguage()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = language === 'fr' ? 'Le nom est requis' : 'Name is required'
    if (!formData.email) {
      newErrors.email = language === 'fr' ? "L'email est requis" : 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = language === 'fr' ? 'Email invalide' : 'Invalid email'
    }
    if (!formData.company.trim()) {
      newErrors.company = language === 'fr' ? 'La societe est requise' : 'Company is required'
    }
    if (!formData.password) {
      newErrors.password = language === 'fr' ? 'Le mot de passe est requis' : 'Password is required'
    } else {
      const passwordError = validatePassword(formData.password)
      if (passwordError) newErrors.password = passwordError
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        language === 'fr' ? 'Veuillez confirmer le mot de passe' : 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword =
        language === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match'
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted =
        language === 'fr'
          ? "Vous devez accepter les conditions d'utilisation"
          : 'You must accept the terms of service'
    }
    if (!formData.privacyAccepted) {
      newErrors.privacyAccepted =
        language === 'fr'
          ? 'Vous devez accepter la politique de confidentialite'
          : 'You must accept the privacy policy'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setAlert(null)
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        password: formData.password,
        consents: {
          termsAccepted: formData.termsAccepted,
          privacyAccepted: formData.privacyAccepted,
          marketingOptIn: formData.marketingOptIn
        }
      })

      if (result?.requiresEmailConfirmation) {
        setAlert({
          type: 'success',
          message: tr(
            'Compte cree. Verifiez votre email pour confirmer votre inscription puis connectez-vous.',
            'Account created. Check your email to confirm your registration, then sign in.'
          )
        })
        setTimeout(() => navigate('/auth/login'), 1400)
      } else {
        setAlert({
          type: 'success',
          message: language === 'fr' ? 'Compte cree avec succes !' : 'Account created successfully!'
        })
        setTimeout(() => navigate('/dashboard'), 1000)
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      setAlert({
        type: 'error',
        message: tr(
          'Veuillez accepter les conditions et la politique de confidentialite avant de continuer avec Google.',
          'Please accept terms and privacy policy before continuing with Google.'
        )
      })
      setErrors((prev) => ({
        ...prev,
        termsAccepted: !formData.termsAccepted
          ? tr("Vous devez accepter les conditions d'utilisation", 'You must accept the terms of service')
          : '',
        privacyAccepted: !formData.privacyAccepted
          ? tr('Vous devez accepter la politique de confidentialite', 'You must accept the privacy policy')
          : ''
      }))
      return
    }

    setGoogleLoading(true)
    setAlert(null)
    try {
      await loginWithGoogle()
    } catch (error) {
      setAlert({ type: 'error', message: error.message })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 flex items-center justify-center p-4">
      <div className="surface-glass p-5 sm:p-8 w-full max-w-md finance-animate-in">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher compact />
        </div>
        <div className="text-center mb-8">
          <div className="text-4xl sm:text-5xl mb-4">FM</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-gray-600">{t('auth.registerSubtitle')}</p>
        </div>

        {alert && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              alert.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full bg-white text-gray-700 border-2 border-gray-200 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? `${t('auth.continueWithGoogle')}...` : t('auth.continueWithGoogle')}
          </button>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="h-px bg-gray-200 flex-1" />
            <span>{t('auth.or')}</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.fullName')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.businessEmail')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.company')}
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.company ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="FinMate Advisory"
            />
            {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.phone')}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition-all"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="********"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">{t('auth.min6')}</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.confirmPassword
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="********"
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {tr("J'accepte les", 'I accept the')}{' '}
                <Link to="/terms" className="text-emerald-700 hover:underline font-semibold">
                  {t('auth.cgu')}
                </Link>
              </span>
            </label>
            {errors.termsAccepted && <p className="text-xs text-red-600">{errors.termsAccepted}</p>}

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {tr("J'accepte la", 'I accept the')}{' '}
                <Link to="/privacy" className="text-emerald-700 hover:underline font-semibold">
                  {t('auth.privacy')}
                </Link>
              </span>
            </label>
            {errors.privacyAccepted && <p className="text-xs text-red-600">{errors.privacyAccepted}</p>}

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                name="marketingOptIn"
                checked={formData.marketingOptIn}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {tr(
                  "Je souhaite recevoir des communications produit (optionnel)",
                  'I want to receive product communications (optional)'
                )}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? t('auth.creating') : t('auth.createMyAccount')}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            {tr(
              'Vos consentements sont enregistres et modifiables via le support RGPD.',
              'Your consents are recorded and can be updated via GDPR support.'
            )}
          </p>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/auth/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              {t('auth.goLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


