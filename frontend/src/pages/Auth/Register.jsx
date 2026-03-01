import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { isValidEmail, validatePassword } from '@/services/authService'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t, language } = useLanguage()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      await register({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        password: formData.password
      })
      setAlert({
        type: 'success',
        message: language === 'fr' ? 'Compte cree avec succes !' : 'Account created successfully!'
      })
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (error) {
      setAlert({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? t('auth.creating') : t('auth.createMyAccount')}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            {t('auth.terms')}{' '}
            <Link to="/terms" className="text-emerald-700 hover:underline">
              {t('auth.cgu')}
            </Link>{' '}
            {language === 'fr' ? 'et notre' : 'and our'}{' '}
            <Link to="/privacy" className="text-emerald-700 hover:underline">
              {t('auth.privacy')}
            </Link>
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


