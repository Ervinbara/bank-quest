import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LogOut, User, Loader2 } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { advisor, logout, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return

    try {
      setLoggingOut(true)
      await logout()
      navigate('/', { replace: true })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/70 bg-white/85 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <span className="text-3xl">FM</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-emerald-700 bg-clip-text text-transparent">
              FinMate
            </span>
          </Link>

          <div className="hidden md:flex space-x-8">
            <a href="#solution" className="text-gray-600 hover:text-emerald-700 font-medium transition">
              {t('nav.solution', 'Solution')}
            </a>
            <Link to="/demo" className="text-gray-600 hover:text-emerald-700 font-medium transition">
              {t('nav.demo', 'Demo')}
            </Link>
            <a href="#features" className="text-gray-600 hover:text-emerald-700 font-medium transition">
              {t('nav.features', 'Features')}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-emerald-700 font-medium transition"
                >
                  <User className="w-5 h-5" />
                  <span>{advisor?.name || t('common.dashboard', 'Dashboard')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {loggingOut ? t('common.loggingOut', 'Logging out...') : t('common.logout', 'Log out')}
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-emerald-700 font-medium transition"
                >
                  {t('common.login', 'Log in')}
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition transform hover:-translate-y-0.5 shadow-md"
                >
                  {t('common.register', 'Sign up')}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

