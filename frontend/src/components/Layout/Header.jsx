import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User, Loader2 } from 'lucide-react'

export default function Header() {
  const navigate = useNavigate()
  const { user, advisor, logout, isAuthenticated } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return // Empêcher double-clic
    
    try {
      setLoggingOut(true)
      console.log('🚪 Déconnexion depuis Header...')
      
      await logout()
      
      // Redirection après nettoyage complet
      navigate('/', { replace: true })
      
      // Forcer le rechargement pour nettoyer complètement
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
      // En cas d'erreur, forcer quand même la redirection
      window.location.href = '/'
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <span className="text-3xl">🎯</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bank Quest
            </span>
          </Link>

          {/* Navigation centrale */}
          <div className="hidden md:flex space-x-8">
            <a href="#solution" className="text-gray-600 hover:text-purple-600 font-medium transition">
              Solution
            </a>
            <Link to="/demo" className="text-gray-600 hover:text-purple-600 font-medium transition">
              Démo
            </Link>
            <a href="#features" className="text-gray-600 hover:text-purple-600 font-medium transition">
              Fonctionnalités
            </a>
          </div>

          {/* Boutons droite */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              // Utilisateur connecté
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-purple-600 font-medium transition"
                >
                  <User className="w-5 h-5" />
                  <span>{advisor?.name || 'Dashboard'}</span>
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
                    {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
                  </span>
                </button>
              </>
            ) : (
              // Utilisateur non connecté
              <>
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-purple-600 font-medium transition"
                >
                  Connexion
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 shadow-md"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}