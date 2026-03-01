import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { isValidEmail } from '@/services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t, language } = useLanguage()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = language === 'fr' ? "L'email est requis" : 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = language === 'fr' ? 'Email invalide' : 'Invalid email'
    }

    if (!formData.password) {
      newErrors.password = language === 'fr' ? 'Le mot de passe est requis' : 'Password is required'
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
      await login(formData.email, formData.password, formData.remember)
      setAlert({
        type: 'success',
        message: language === 'fr' ? 'Connexion reussie !' : 'Login successful!'
      })
      setTimeout(() => navigate('/dashboard'), 500)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-gray-600">{t('auth.loginSubtitle')}</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.businessEmail', 'Business email *')}
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
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.password', 'Password *')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                errors.password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="********"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-700 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{t('auth.remember')}</span>
            </label>
            <Link to="/auth/forgot-password" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              {t('auth.forgot')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? t('auth.loadingLogin') : t('auth.loginSubmit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" className="font-semibold text-emerald-700 hover:text-emerald-800">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 text-center mb-2">
            <strong>{t('auth.demoAccount')}:</strong>
          </p>
          <p className="text-xs text-gray-600 text-center">
            Email: demo@finmate.app
            <br />
            {t('auth.demoPassword')}: demo123
          </p>
        </div>
      </div>
    </div>
  )
}


