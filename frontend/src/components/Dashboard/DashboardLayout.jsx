import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import { LogOut, User, Loader2 } from 'lucide-react'

export default function DashboardLayout() {
  const { advisor, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    
    try {
      setLoggingOut(true)
      console.log('🚪 Déconnexion depuis Dashboard...')
      
      await logout()
      
      // Redirection vers l'accueil
      navigate('/', { replace: true })
      
      // Forcer le rechargement complet
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
      window.location.href = '/'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Tableau de bord
              </h1>
              <p className="text-sm text-gray-600">
                {advisor?.company || 'Votre cabinet'}
              </p>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">
                  {advisor?.name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">{advisor?.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard/settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Paramètres"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title={loggingOut ? 'Déconnexion...' : 'Déconnexion'}
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

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}