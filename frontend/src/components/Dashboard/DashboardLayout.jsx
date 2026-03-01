import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Sidebar from './Sidebar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LogOut, User, Loader2, Menu } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'finmate-sidebar-collapsed'

export default function DashboardLayout() {
  const { advisor, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')

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

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={mobileMenuOpen ? false : sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100/80 sticky top-0 z-10">
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                aria-label={t('Ouvrir le menu', 'Open menu')}
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{t('dashboardLayout.title', 'Dashboard')}</h1>
                <p className="text-sm text-gray-600 truncate">
                  {advisor?.company || t('dashboardLayout.companyFallback', 'Your firm')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              <LanguageSwitcher compact />
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-gray-800">
                  {advisor?.name || t('dashboardLayout.userFallback', 'User')}
                </p>
                <p className="text-xs text-gray-500">{advisor?.email}</p>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/dashboard/settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title={t('common.settings', 'Settings')}
                >
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loggingOut ? t('common.loggingOut', 'Logging out...') : t('common.logout', 'Log out')}
                >
                  {loggingOut ? (
                    <Loader2 className="w-5 h-5 text-red-600 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 finance-animate-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
