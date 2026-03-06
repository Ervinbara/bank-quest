import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Settings, BarChart3, Link2,
  ClipboardList, Library, X, PanelLeftClose, PanelLeftOpen, Shield,
  Crown
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/* ── Logo SVG inline ─────────────────────────────────────────── */
function BrandGlyph() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 min-w-[32px] block">
      <rect width="32" height="32" rx="9" fill="#0f766e" />
      <rect width="32" height="32" rx="9" fill="url(#fm-grad)" fillOpacity="0.75" />
      <path d="M9 10h10M9 16h7M9 22h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23" cy="22" r="3.5" fill="white" fillOpacity="0.9" />
      <path d="M21.5 22h3M23 20.5v3" stroke="url(#fm-grad)" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="fm-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f766e" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function FinMateLogo({ collapsed }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 min-w-0">
      <BrandGlyph />
      {!collapsed && (
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
          FinMate
        </span>
      )}
    </Link>
  )
}

/* ── Plan badge bas de sidebar ───────────────────────────────── */
function PlanCard({ collapsed, isFreePlan, normalizedPlan, t }) {
  return (
    <div className={`mx-3 mb-3 rounded-xl border transition-all ${
      isFreePlan
        ? 'border-amber-200 bg-amber-50'
        : 'border-emerald-200 bg-emerald-50'
    } ${collapsed ? 'p-2' : 'p-3'}`}>
      {!collapsed && (
        <>
          <div className="flex items-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs font-bold text-slate-800">
              {isFreePlan ? t('sidebar.freeVersion', 'Plan Gratuit') : `Plan ${normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1)}`}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mb-2.5 leading-snug">
            {isFreePlan
              ? t('sidebar.upgradeHint', 'Passez à Solo pour envoyer des invitations par email.')
              : t('sidebar.manageBilling', 'Gérer dans les paramètres de facturation')}
          </p>
        </>
      )}
      <Link
        to="/dashboard/settings"
        title={collapsed ? t('sidebar.upgrade', 'Upgrade') : undefined}
        className={`btn-primary w-full text-center text-xs py-1.5 ${collapsed ? 'px-1' : ''}`}
      >
        {collapsed ? '↑' : isFreePlan ? t('sidebar.upgrade', 'Passer à Pro') : t('sidebar.settings', 'Paramètres')}
      </Link>
    </div>
  )
}

/* ── Composant principal ─────────────────────────────────────── */
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
      label: t('sidebar.overview', 'Vue d\'ensemble'),
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
      label: t('sidebar.questionBank', 'Banque de questions')
    },
    {
      group: 'creation',
      path: '/dashboard/questionnaires',
      icon: ClipboardList,
      label: t('sidebar.questionnaires', 'Questionnaires')
    },
    {
      group: 'pilotage',
      path: '/dashboard/analytics',
      icon: BarChart3,
      label: t('sidebar.analytics', 'Statistiques')
    },
    {
      group: 'compte',
      path: '/dashboard/settings',
      icon: Settings,
      label: t('sidebar.settings', 'Paramètres')
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

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path)

  const groupLabel = (group) => {
    if (group === 'creation') return t('Creation', 'Création')
    if (group === 'compte')   return t('Compte', 'Compte')
    return t('Pilotage', 'Pilotage')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header logo */}
      <div className={`flex items-center justify-between border-b border-slate-100 ${collapsed ? 'px-3 py-4' : 'px-4 py-4'}`}>
        {mobileOpen ? (
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <BrandGlyph />
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent tracking-tight">
              FinMate
            </span>
          </Link>
        ) : (
          <FinMateLogo collapsed={collapsed} />
        )}
        {/* Bouton fermer sur mobile, bouton collapse sur desktop */}
        {mobileOpen ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={t('Fermer', 'Close')}
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapsed}
            className="hidden md:inline-flex p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={collapsed ? t('Étendre le menu', 'Expand menu') : t('Réduire le menu', 'Collapse menu')}
            title={collapsed ? t('Étendre', 'Expand') : t('Réduire', 'Collapse')}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4 text-slate-500" />
              : <PanelLeftClose className="w-4 h-4 text-slate-500" />}
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={`flex-1 py-3 space-y-0.5 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.path, item.exact)
          const previousGroup = index > 0 ? menuItems[index - 1].group : null
          const showGroupLabel = !collapsed && item.group !== previousGroup

          return (
            <div key={item.path}>
              {showGroupLabel && (
                <p className="section-label">{groupLabel(item.group)}</p>
              )}
              <Link
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="shrink-0 transition-transform duration-200" style={{ width: '18px', height: '18px' }} />
                <span
                  className="fm-label-fade overflow-hidden whitespace-nowrap"
                  style={{
                    maxWidth: collapsed ? '0px' : '160px',
                    opacity: collapsed ? 0 : 1,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Plan card */}
      <PlanCard
        collapsed={collapsed}
        isFreePlan={isFreePlan}
        normalizedPlan={normalizedPlan}
        t={t}
      />
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-100 transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
        style={{ boxShadow: '1px 0 0 0 #f1f5f9' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer — toujours monté, animé via CSS */}
      <div
        className="md:hidden fixed inset-0 z-40"
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          style={{
            opacity: mobileOpen ? 1 : 0,
            transition: 'opacity 0.28s ease',
          }}
          onClick={onClose}
          aria-label={t('Fermer le menu', 'Close menu')}
        />
        {/* Drawer */}
        <aside
          className="absolute left-0 top-0 h-full w-72 max-w-[88vw] bg-white shadow-xl flex flex-col border-r border-slate-100"
          style={{
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.22, 0.68, 0.12, 1)',
          }}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}
