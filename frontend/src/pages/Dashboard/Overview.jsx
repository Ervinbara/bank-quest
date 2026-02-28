import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdvisorStats, subscribeToAdvisorClients } from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import InviteClientModal from '@/components/Dashboard/InviteClientModal'
import { Users, CheckCircle, Clock, TrendingUp, Loader2 } from 'lucide-react'

export default function Overview() {
  const { advisor } = useAuth()
  const { tr, language } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const loadStats = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorStats(advisor.id)
      setStats(data)
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      setError(tr('Impossible de charger les statistiques', 'Unable to load statistics'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!advisor?.id) return undefined

    const unsubscribe = subscribeToAdvisorClients(advisor.id, () => {
      void loadStats()
    })

    return unsubscribe
  }, [advisor?.id, loadStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des statistiques...', 'Loading statistics...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">❌ {error}</p>
        <button
          onClick={loadStats}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {tr('Reessayer', 'Retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {tr('Bonjour', 'Hello')} {advisor?.name?.split(' ')[0]} !
        </h2>
        <p className="text-emerald-100 text-lg">{tr('Voici un apercu de votre activite', 'Here is your activity overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title={tr('Total clients', 'Total clients')} value={stats?.totalClients || 0} icon={Users} color="purple" />
        <StatsCard title={tr('Quiz completes', 'Completed quizzes')} value={stats?.completed || 0} icon={CheckCircle} color="green" />
        <StatsCard title={tr('En attente', 'Pending')} value={stats?.pending || 0} icon={Clock} color="orange" />
        <StatsCard
          title={tr('Score moyen', 'Average score')}
          value={stats?.avgScore ? `${stats.avgScore}/100` : 'N/A'}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">{tr('Clients a contacter', 'Clients to contact')}</p>
          <p className="text-3xl font-bold text-amber-700">{stats?.toContact || 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">{tr('Suivis en cours', 'Follow-ups in progress')}</p>
          <p className="text-3xl font-bold text-blue-700">{stats?.inProgress || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{tr('Actions rapides', 'Quick actions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="text-2xl mb-2">+</div>
            <h4 className="font-semibold text-gray-800">{tr('Inviter un client', 'Invite a client')}</h4>
            <p className="text-sm text-gray-600">{tr('Envoyez un questionnaire', 'Send a questionnaire')}</p>
          </button>

          <Link
            to="/dashboard/clients"
            className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-600 hover:bg-teal-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Resultats</div>
            <h4 className="font-semibold text-gray-800">{tr('Voir les resultats', 'View results')}</h4>
            <p className="text-sm text-gray-600">{tr('Consultez les performances', 'Review performance')}</p>
          </Link>

          <Link
            to="/dashboard/analytics"
            className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Analytics</div>
            <h4 className="font-semibold text-gray-800">{tr('Analytics avancees', 'Advanced analytics')}</h4>
            <p className="text-sm text-gray-600">{tr('Analysez les tendances clients', 'Analyze client trends')}</p>
          </Link>

          <Link
            to="/dashboard/questionnaires"
            className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Quiz</div>
            <h4 className="font-semibold text-gray-800">{tr('Questionnaires', 'Questionnaires')}</h4>
            <p className="text-sm text-gray-600">{tr('Templates et banque de questions', 'Templates and question bank')}</p>
          </Link>

          <Link
            to="/dashboard/question-bank"
            className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Banque</div>
            <h4 className="font-semibold text-gray-800">{tr('Questions par theme', 'Questions by topic')}</h4>
            <p className="text-sm text-gray-600">{tr('Creer vos themes et questions', 'Create topics and questions')}</p>
          </Link>

          <Link
            to="/dashboard/settings"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Reglages</div>
            <h4 className="font-semibold text-gray-800">{tr('Parametres', 'Settings')}</h4>
            <p className="text-sm text-gray-600">{tr('Gerer votre compte', 'Manage your account')}</p>
          </Link>
        </div>
      </div>

      {stats?.totalClients === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">{tr('Prochaine etape : Invitez votre premier client', 'Next step: invite your first client')}</h3>
          <p className="text-blue-800 mb-4">
            {tr('Commencez a qualifier vos clients en leur envoyant un questionnaire personnalise.', 'Start qualifying your clients by sending a personalized questionnaire.')}
          </p>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {tr('Creer une invitation', 'Create invitation')}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">{tr('Excellent travail', 'Great work')}</h3>
          <p className="text-green-800 mb-4">
            {language === 'fr'
              ? `Vous avez ${stats.completed} questionnaire${stats.completed > 1 ? 's completes' : ' complete'} sur ${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''}.${stats.pending > 0 ? ` Il reste ${stats.pending} client${stats.pending > 1 ? 's' : ''} en attente.` : ''}`
              : `You have ${stats.completed} completed questionnaire${stats.completed > 1 ? 's' : ''} out of ${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''}.${stats.pending > 0 ? ` ${stats.pending} client${stats.pending > 1 ? 's are' : ' is'} still pending.` : ''}`}
          </p>
          <div className="flex gap-3">
            <Link
              to="/dashboard/clients"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition inline-block"
            >
              {tr('Voir tous les clients', 'View all clients')}
            </Link>
            {stats.pending > 0 && (
              <button className="bg-white text-green-700 border-2 border-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
                  {tr('Relancer les invitations', 'Resend invitations')}
              </button>
            )}
          </div>
        </div>
      )}

      <InviteClientModal
        isOpen={inviteModalOpen}
        advisorId={advisor?.id}
        advisorName={advisor?.name}
        advisorEmail={advisor?.email}
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => {
          void loadStats()
        }}
      />
    </div>
  )
}


