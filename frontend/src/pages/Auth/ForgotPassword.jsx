import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { isValidEmail } from '@/services/authService'

export default function ForgotPassword() {
  const { t, language } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError(language === 'fr' ? "L'email est requis" : 'Email is required')
      return
    }
    if (!isValidEmail(email)) {
      setError(language === 'fr' ? 'Email invalide' : 'Invalid email')
      return
    }

    setLoading(true)
    setError('')

    setTimeout(() => {
      setSuccess(true)
      setLoading(false)
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 flex items-center justify-center p-4">
        <div className="surface-glass p-8 w-full max-w-md finance-animate-in text-center">
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
          <div className="text-6xl mb-6">OK</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t('auth.resetSent')}</h1>
          <p className="text-gray-600 mb-8">
            {t('auth.resetMessage')} <strong>{email}</strong>.
          </p>
          <Link
            to="/auth/login"
            className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all"
          >
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 flex items-center justify-center p-4">
      <div className="surface-glass p-8 w-full max-w-md finance-animate-in">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">FM</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('auth.forgotTitle')}</h1>
          <p className="text-gray-600">{t('auth.forgotSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.businessEmail')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-all ${
                error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              } focus:outline-none`}
              placeholder="you@example.com"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? t('auth.sending') : t('auth.sendReset')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth/login" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}


