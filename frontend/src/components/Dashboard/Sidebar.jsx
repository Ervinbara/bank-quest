import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, BarChart3, Link2, ClipboardList, Library } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Apercu',
      exact: true
    },
    {
      path: '/dashboard/clients',
      icon: Users,
      label: 'Mes clients'
    },
    {
      path: '/dashboard/invitations',
      icon: Link2,
      label: 'Invitations'
    },
    {
      path: '/dashboard/questionnaires',
      icon: ClipboardList,
      label: 'Questionnaires'
    },
    {
      path: '/dashboard/question-bank',
      icon: Library,
      label: 'Banque questions'
    },
    {
      path: '/dashboard/analytics',
      icon: BarChart3,
      label: 'Statistiques'
    },
    {
      path: '/dashboard/settings',
      icon: Settings,
      label: 'Parametres'
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
          <p className="text-sm font-semibold text-gray-800 mb-1">Version gratuite</p>
          <p className="text-xs text-gray-600 mb-3">14 jours restants</p>
          <Link
            to="/dashboard/settings"
            className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition"
          >
            Passer Pro
          </Link>
        </div>
      </div>
    </aside>
  )
}
