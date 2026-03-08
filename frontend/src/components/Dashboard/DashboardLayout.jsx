import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Sidebar from './Sidebar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { LogOut, User, Loader2, Menu, LayoutDashboard, Users, Link2, BarChart3, Settings, Plus, FileText } from 'lucide-react'

const SIDEBAR_STORAGE_KEY = 'finmate-sidebar-collapsed'
const ROUTE_CONTEXT = [
  { path: '/dashboard/clients',       labelFr: 'Clients',             labelEn: 'Clients' },
  { path: '/dashboard/invitations',   labelFr: 'Invitations',         labelEn: 'Invitations' },
  { path: '/dashboard/questionnaires',labelFr: 'Questionnaires',      labelEn: 'Questionnaires' },
  { path: '/dashboard/question-bank', labelFr: 'Banque de questions', labelEn: 'Question bank' },
  { path: '/dashboard/analytics',     labelFr: 'Statistiques',        labelEn: 'Analytics' },
  { path: '/dashboard/settings',      labelFr: 'Paramètres',          labelEn: 'Settings' },
  { path: '/dashboard/admin',         labelFr: 'Super Admin',         labelEn: 'Super Admin' },
  { path: '/dashboard',               labelFr: 'Aperçu',              labelEn: 'Overview' }
]

export default function DashboardLayout() {
  const { advisor, logout, isSuperAdmin } = useAuth()
  const { t, tr } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileQuickOpen, setMobileQuickOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')
  const routeContext =
    ROUTE_CONTEXT.find((item) => location.pathname.startsWith(item.path)) || ROUTE_CONTEXT[ROUTE_CONTEXT.length - 1]
  const currentSectionLabel = tr(routeContext.labelFr, routeContext.labelEn)

  const mobileTabs = [
    {
      to: '/dashboard',
      label: tr('Aperçu', 'Overview'),
      shortLabel: tr('Aperçu', 'Home'),
      icon: LayoutDashboard,
      exact: true
    },
    {
      to: '/dashboard/clients',
      label: tr('Clients', 'Clients'),
      shortLabel: tr('Clients', 'Clients'),
      icon: Users
    },
    {
      to: '/dashboard/invitations',
      label: tr('Invitations', 'Invitations'),
      shortLabel: tr('Invités', 'Invites'),
      icon: Link2
    },
    {
      to: '/dashboard/analytics',
      label: tr('Statistiques', 'Analytics'),
      shortLabel: tr('Stats', 'Stats'),
      icon: BarChart3
    },
    {
      to: '/dashboard/settings',
      label: tr('Paramètres', 'Settings'),
      shortLabel: tr('Réglages', 'Settings'),
      icon: Settings
    }
  ]

  const quickActions = [
    {
      key: 'invite',
      to: '/dashboard/clients?quick=invite',
      label: tr('Inviter', 'Invite'),
      icon: Link2
    },
    {
      key: 'import',
      to: '/dashboard/clients?quick=import',
      label: tr('Importer', 'Import'),
      icon: Users
    },
    {
      key: 'questionnaire',
      to: '/dashboard/questionnaires',
      label: tr('Questionnaire', 'Questionnaire'),
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
    <div className="min-h-screen flex overflow-x-hidden">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        collapsed={mobileMenuOpen ? false : sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        showAdmin={isSuperAdmin}
        currentPlan={advisor?.plan}
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white/85 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-10">
          <div className="px-3 sm:px-5 py-3 flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-label={t('Ouvrir le menu', 'Open menu')}
              >
                <Menu className="w-4 h-4 text-slate-600" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-none mb-0.5 hidden sm:block">
                  {advisor?.company || t('dashboardLayout.companyFallback', 'Your firm')}
                </p>
                <h1 className="page-title text-base sm:text-xl truncate">{currentSectionLabel}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <LanguageSwitcher compact />
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {advisor?.name || t('dashboardLayout.userFallback', 'User')}
                </p>
                <p className="text-xs text-slate-400">{advisor?.email}</p>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  to="/dashboard/settings"
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  title={t('common.settings', 'Settings')}
                >
                  <User className="w-4 h-4 text-slate-500" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loggingOut ? t('common.loggingOut', 'Logging out...') : t('common.logout', 'Log out')}
                >
                  {loggingOut ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-3 max-[380px]:px-2.5 py-4 sm:p-6 pb-28 md:pb-6 finance-animate-in">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>

      <div className="fm-mobile-fab md:hidden fixed bottom-[5.5rem] right-4 z-30 flex flex-col items-end gap-2">
        {/* Items toujours montés, animés via opacity + transform */}
        {quickActions.map((action, i) => {
          const Icon = action.icon
          const delay = mobileQuickOpen
            ? `${i * 55}ms`
            : `${(quickActions.length - 1 - i) * 35}ms`
          return (
            <Link
              key={action.key}
              to={action.to}
              onClick={() => setMobileQuickOpen(false)}
              className="fm-fab-item inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-lg"
              style={{
                opacity: mobileQuickOpen ? 1 : 0,
                transform: mobileQuickOpen ? 'scale(1) translateY(0)' : 'scale(0.82) translateY(8px)',
                transitionDelay: delay,
                pointerEvents: mobileQuickOpen ? 'auto' : 'none',
              }}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          )
        })}
        {/* Bouton FAB — le + pivote en × sans changer d'icône */}
        <button
          type="button"
          onClick={() => setMobileQuickOpen((prev) => !prev)}
          className="fm-fab-btn h-12 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-xl flex items-center justify-center"
          style={{ transform: mobileQuickOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-label={tr('Actions rapides', 'Quick actions')}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <nav className="fm-mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-emerald-100 bg-white/95 backdrop-blur-xl overflow-hidden pb-[calc(env(safe-area-inset-bottom)+2px)]">
        <div className="grid grid-cols-5 gap-0.5 px-1.5 py-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab)
            return (
              <Link
                key={tab.to}
                to={tab.to}
                title={tab.label}
                className={`fm-tab flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold ${
                  active ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500'
                }`}
              >
                <Icon
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ transform: active ? 'scale(1.15)' : 'scale(1)' }}
                />
                <span className="w-full truncate text-center text-[9px] leading-tight">{tab.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
