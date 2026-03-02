import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function SuperAdminRoute({ children }) {
  const { loading, isSuperAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
