import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, BarChart3, Link2, ClipboardList, Library } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Sidebar() {
  const location = useLocation()
  const { t } = useLanguage()

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: t('sidebar.overview', 'Overview'),
      exact: true
    },
    {
      path: '/dashboard/clients',
      icon: Users,
      label: t('sidebar.clients', 'Clients')
    },
    {
      path: '/dashboard/invitations',
      icon: Link2,
      label: t('sidebar.invitations', 'Invitations')
    },
    {
      path: '/dashboard/questionnaires',
      icon: ClipboardList,
      label: t('sidebar.questionnaires', 'Questionnaires')
    },
    {
      path: '/dashboard/question-bank',
      icon: Library,
      label: t('sidebar.questionBank', 'Question bank')
    },
    {
      path: '/dashboard/analytics',
      icon: BarChart3,
      label: t('sidebar.analytics', 'Analytics')
    },
    {
      path: '/dashboard/settings',
      icon: Settings,
      label: t('sidebar.settings', 'Settings')
    }
  ]

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">FM</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            FinMate
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path, item.exact)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-800 mb-1">{t('sidebar.freeVersion', 'Free plan')}</p>
          <p className="text-xs text-gray-600 mb-3">{t('sidebar.daysLeft', '14 days left')}</p>
          <Link
            to="/dashboard/settings"
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
          >
            {t('sidebar.upgrade', 'Upgrade to Pro')}
          </Link>
        </div>
      </div>
    </aside>
  )
}
