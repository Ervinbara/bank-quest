import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Sidebar from './Sidebar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LogOut, User, Loader2, Menu, LayoutDashboard, Users, Link2, BarChart3, Settings, Plus, X, FileText } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'finmate-sidebar-collapsed'

export default function DashboardLayout() {
  const { advisor, logout, isSuperAdmin } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileQuickOpen, setMobileQuickOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')

  const mobileTabs = [
    {
      to: '/dashboard',
      label: t('sidebar.overview', 'Overview'),
      shortLabel: t('Apercu', 'Home'),
      icon: LayoutDashboard,
      exact: true
    },
    {
      to: '/dashboard/clients',
      label: t('sidebar.clients', 'Clients'),
      shortLabel: t('Clients', 'Clients'),
      icon: Users
    },
    {
      to: '/dashboard/invitations',
      label: t('sidebar.invitations', 'Invitations'),
      shortLabel: t('Invites', 'Invites'),
      icon: Link2
    },
    {
      to: '/dashboard/analytics',
      label: t('sidebar.analytics', 'Analytics'),
      shortLabel: t('Stats', 'Stats'),
      icon: BarChart3
    },
    {
      to: '/dashboard/settings',
      label: t('sidebar.settings', 'Settings'),
      shortLabel: t('Reglages', 'Settings'),
      icon: Settings
    }
  ]

  const quickActions = [
    {
      key: 'invite',
      to: '/dashboard/clients?quick=invite',
      label: t('Inviter', 'Invite'),
      icon: Link2
    },
    {
      key: 'import',
      to: '/dashboard/clients?quick=import',
      label: t('Importer', 'Import'),
      icon: Users
    },
    {
      key: 'questionnaire',
      to: '/dashboard/questionnaires',
      label: t('Questionnaire', 'Questionnaire'),
      icon: FileText
    }
  ]

  const isTabActive = (tab) =>
    tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to)

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
    <div className="min-h-screen flex overflow-x-clip">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={mobileMenuOpen ? false : sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        showAdmin={isSuperAdmin}
        currentPlan={advisor?.plan}
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

        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-28 md:pb-6 finance-animate-in">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden fixed bottom-24 right-4 z-30 flex flex-col items-end gap-2">
        {mobileQuickOpen
          ? quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.key}
                  to={action.to}
                  onClick={() => setMobileQuickOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-lg"
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </Link>
              )
            })
          : null}
        <button
          type="button"
          onClick={() => setMobileQuickOpen((prev) => !prev)}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xl flex items-center justify-center"
          aria-label={t('Actions rapides', 'Quick actions')}
        >
          {mobileQuickOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-emerald-100 bg-white/95 backdrop-blur-xl overflow-hidden pb-[calc(env(safe-area-inset-bottom)+2px)]">
        <div className="grid grid-cols-5 gap-0.5 px-1.5 py-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab)
            return (
              <Link
                key={tab.to}
                to={tab.to}
                title={tab.label}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold transition ${
                  active ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="w-full truncate text-center text-[9px] leading-tight">{tab.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
