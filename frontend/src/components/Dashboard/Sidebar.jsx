import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, BarChart3, Link2, ClipboardList, Library, X, PanelLeftClose, PanelLeftOpen, Shield } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Sidebar({
  mobileOpen = false,
  onClose = () => {},
  collapsed = false,
  onToggleCollapsed = () => {},
  showAdmin = false,
  currentPlan = 'none'
}) {
  const location = useLocation()
  const { t } = useLanguage()
  const normalizedPlan = String(currentPlan || 'none').toLowerCase()
  const isFreePlan = normalizedPlan === 'none'

  const menuItems = [
    {
      group: 'pilotage',
      path: '/dashboard',
      icon: LayoutDashboard,
      label: t('sidebar.overview', 'Overview'),
      exact: true
    },
    {
      group: 'pilotage',
      path: '/dashboard/clients',
      icon: Users,
      label: t('sidebar.clients', 'Clients')
    },
    {
      group: 'pilotage',
      path: '/dashboard/invitations',
      icon: Link2,
      label: t('sidebar.invitations', 'Invitations')
    },
    {
      group: 'creation',
      path: '/dashboard/question-bank',
      icon: Library,
      label: t('sidebar.questionBank', '1. Banque de questions (source)')
    },
    {
      group: 'creation',
      path: '/dashboard/questionnaires',
      icon: ClipboardList,
      label: t('sidebar.questionnaires', '2. Questionnaires (formulaires clients)')
    },
    {
      group: 'pilotage',
      path: '/dashboard/analytics',
      icon: BarChart3,
      label: t('sidebar.analytics', 'Analytics')
    },
    {
      group: 'compte',
      path: '/dashboard/settings',
      icon: Settings,
      label: t('sidebar.settings', 'Settings')
    }
  ]

  if (showAdmin) {
    menuItems.push({
      group: 'compte',
      path: '/dashboard/admin',
      icon: Shield,
      label: t('sidebar.admin', 'Super Admin')
    })
  }

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  const sidebarContent = (
    <>
      <div className={`p-4 border-b ${collapsed ? 'md:px-3' : 'md:p-6'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center md:justify-between' : 'justify-between'} gap-2`}>
          <Link to="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} min-w-0`}>
            <span className="text-3xl">FM</span>
            {!collapsed ? (
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                FinMate
              </span>
            ) : null}
          </Link>
          <button
            onClick={onToggleCollapsed}
            className="hidden md:inline-flex p-2 rounded-lg hover:bg-gray-100"
            aria-label={collapsed ? t('Etendre le menu', 'Expand menu') : t('Reduire le menu', 'Collapse menu')}
            title={collapsed ? t('Etendre le menu', 'Expand menu') : t('Reduire le menu', 'Collapse menu')}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4 text-gray-700" /> : <PanelLeftClose className="w-4 h-4 text-gray-700" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.path, item.exact)
          const previousGroup = index > 0 ? menuItems[index - 1].group : null
          const showGroupLabel = !collapsed && item.group && item.group !== previousGroup
          const groupLabel =
            item.group === 'creation'
              ? t('Creation', 'Creation')
              : item.group === 'compte'
                ? t('Compte', 'Account')
                : t('Pilotage', 'Operations')

          return (
            <div key={item.path}>
              {showGroupLabel ? (
                <p className="px-2 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {groupLabel}
                </p>
              ) : null}
              <Link
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed ? <span className="font-medium">{item.label}</span> : null}
              </Link>
            </div>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg ${collapsed ? 'p-2' : 'p-4'}`}>
          {!collapsed ? (
            <p className="text-sm font-semibold text-gray-800 mb-1">
              {isFreePlan ? t('sidebar.freeVersion', 'Free plan') : `Plan ${normalizedPlan}`}
            </p>
          ) : null}
          {!collapsed ? (
            <p className="text-xs text-gray-600 mb-3">
              {isFreePlan
                ? t('sidebar.daysLeft', '14 days left')
                : t('sidebar.upgrade', 'Manage in billing settings')}
            </p>
          ) : null}
          <Link
            to="/dashboard/settings"
            title={collapsed ? t('sidebar.upgrade', 'Upgrade to Pro') : undefined}
            className={`block w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-center rounded-lg text-sm font-semibold hover:opacity-90 transition ${collapsed ? 'py-2 px-1' : 'py-2'}`}
          >
            {collapsed ? 'Plan' : isFreePlan ? t('sidebar.upgrade', 'Upgrade to Pro') : t('sidebar.settings', 'Settings')}
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className={`hidden md:flex bg-white/85 backdrop-blur-xl border-r border-emerald-100 shadow-lg flex-col transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label={t('Fermer le menu', 'Close menu')}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[88vw] bg-white/95 backdrop-blur-xl shadow-xl flex flex-col border-r border-emerald-100">
            <div className="p-4 border-b flex items-center justify-between">
              <p className="font-semibold text-gray-800">{t('Navigation', 'Navigation')}</p>
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label={t('Fermer le menu', 'Close menu')}
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  )
}

