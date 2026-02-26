import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdvisorStats } from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import { Users, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Overview() {
  const { advisor } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (advisor?.id) {
      loadStats()
    }
  }, [advisor])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorStats(advisor.id)
      setStats(data)
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      setError('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">❌ {error}</p>
        <button
          onClick={loadStats}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          Bonjour {advisor?.name?.split(' ')[0]} ! 👋
        </h2>
        <p className="text-purple-100 text-lg">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total clients"
          value={stats?.totalClients || 0}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Quiz complétés"
          value={stats?.completed || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="En attente"
          value={stats?.pending || 0}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Score moyen"
          value={stats?.avgScore ? `${stats.avgScore}/100` : 'N/A'}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all text-left">
            <div className="text-2xl mb-2">➕</div>
            <h4 className="font-semibold text-gray-800">Inviter un client</h4>
            <p className="text-sm text-gray-600">Envoyez un questionnaire</p>
          </button>
          
          <Link
            to="/dashboard/clients"
            className="p-4 border-2 border-pink-200 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-800">Voir les résultats</h4>
            <p className="text-sm text-gray-600">Consultez les performances</p>
          </Link>

          <Link
            to="/dashboard/analytics"
            className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">📈</div>
            <h4 className="font-semibold text-gray-800">Analytics avancées</h4>
            <p className="text-sm text-gray-600">Analysez les tendances clients</p>
          </Link>
          
          <Link
            to="/dashboard/settings"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-semibold text-gray-800">Paramètres</h4>
            <p className="text-sm text-gray-600">Gérer votre compte</p>
          </Link>
        </div>
      </div>

      {/* Info Box - Conditionnel selon s'il y a des clients ou non */}
      {stats?.totalClients === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            🚀 Prochaine étape : Invitez votre premier client !
          </h3>
          <p className="text-blue-800 mb-4">
            Commencez à qualifier vos clients en leur envoyant un questionnaire personnalisé.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            Créer une invitation
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">
            ✅ Excellent travail !
          </h3>
          <p className="text-green-800 mb-4">
            Vous avez {stats.completed} questionnaire{stats.completed > 1 ? 's complété' : ' complété'} sur {stats.totalClients} client{stats.totalClients > 1 ? 's' : ''}.
            {stats.pending > 0 && ` Il reste ${stats.pending} client${stats.pending > 1 ? 's' : ''} en attente.`}
          </p>
          <div className="flex gap-3">
            <Link
              to="/dashboard/clients"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition inline-block"
            >
              Voir tous les clients
            </Link>
            {stats.pending > 0 && (
              <button className="bg-white text-green-700 border-2 border-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
                Relancer les invitations
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
