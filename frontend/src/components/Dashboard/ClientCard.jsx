import { Mail, Calendar, Award, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ClientCard({ client, onClick, footerAction }) {
  const { tr } = useLanguage()
  const isCompleted = client.quiz_status === 'completed'
  const strengths = client.client_insights?.filter((i) => i.type === 'strength') || []
  const weaknesses = client.client_insights?.filter((i) => i.type === 'weakness') || []
  const quizSessionCount = client.quiz_session_count || 0
  const progressDelta = client.quiz_progress_delta

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div
      onClick={onClick ? () => onClick(client) : undefined}
      className={`surface-glass hover:shadow-xl transition-all p-6 border hover:border-emerald-200 finance-animate-in ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {client.avatar || client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{client.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="text-xs">{client.email}</span>
            </div>
          </div>
        </div>

        {isCompleted ? (
          <div className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(client.score)}`}>
            {client.score}/100
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {tr('En attente', 'Pending')}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {isCompleted
              ? `${tr('Complete le', 'Completed on')} ${formatDate(client.completed_at)}`
              : `${tr('Invite le', 'Invited on')} ${formatDate(client.created_at)}`}
          </span>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <Award className="w-4 h-4" />
               <span className="font-semibold">{strengths.length} {tr('forces', 'strengths')}</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
               <span className="font-semibold">{weaknesses.length} {tr('faiblesses', 'weaknesses')}</span>
            </div>
          </div>
        )}

        {quizSessionCount > 0 ? (
          <div className="text-xs text-gray-600">
            {quizSessionCount} questionnaire{quizSessionCount > 1 ? 's' : ''} passe{quizSessionCount > 1 ? 's' : ''}
            {typeof progressDelta === 'number' ? (
              <span className={progressDelta >= 0 ? 'text-emerald-700 font-semibold ml-2' : 'text-red-700 font-semibold ml-2'}>
                {progressDelta >= 0 ? '+' : ''}
                {progressDelta} pts
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {footerAction || (
        <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm">
          {isCompleted ? tr('Voir les resultats', 'View results') : tr("Relancer l'invitation", 'Resend invitation')}
        </button>
      )}
    </div>
  )
}

