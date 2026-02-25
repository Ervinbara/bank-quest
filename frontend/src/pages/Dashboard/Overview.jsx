import { useAuth } from '@/contexts/AuthContext'
import StatsCard from '@/components/Dashboard/StatsCard'
import { Users, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export default function Overview() {
  const { advisor } = useAuth()

  // Données statiques pour le moment (on connectera Supabase après)
  const stats = {
    totalClients: 3,
    completed: 2,
    pending: 1,
    avgScore: 60
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
          value={stats.totalClients}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Quiz complétés"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="En attente"
          value={stats.pending}
          icon={Clock}
          color="orange"
        />
        <StatsCard
          title="Score moyen"
          value={`${stats.avgScore}/100`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition-all text-left">
            <div className="text-2xl mb-2">➕</div>
            <h4 className="font-semibold text-gray-800">Inviter un client</h4>
            <p className="text-sm text-gray-600">Envoyez un questionnaire</p>
          </button>
          
          <button className="p-4 border-2 border-pink-200 rounded-lg hover:border-pink-600 hover:bg-pink-50 transition-all text-left">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-800">Voir les résultats</h4>
            <p className="text-sm text-gray-600">Consultez les performances</p>
          </button>
          
          <button className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left">
            <div className="text-2xl mb-2">⚙️</div>
            <h4 className="font-semibold text-gray-800">Paramètres</h4>
            <p className="text-sm text-gray-600">Gérer votre compte</p>
          </button>
        </div>
      </div>

      {/* Info Box */}
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
    </div>
  )
}