import { Mail, Calendar, Award, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const getScoreTier = (score) => {
  if (score >= 75) return { colorClass: 'text-emerald-700', barClass: 'score-bar-fill-high', badgeClass: 'badge-success' }
  if (score >= 50) return { colorClass: 'text-amber-600',   barClass: 'score-bar-fill-mid',  badgeClass: 'badge-warning' }
  return              { colorClass: 'text-red-600',          barClass: 'score-bar-fill-low',  badgeClass: 'badge-danger' }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ClientCard({ client, onClick, footerAction }) {
  const { tr } = useLanguage()
  const isCompleted = client.quiz_status === 'completed'
  const strengths   = client.client_insights?.filter((i) => i.type === 'strength')  || []
  const weaknesses  = client.client_insights?.filter((i) => i.type === 'weakness')  || []
  const quizSessionCount = client.quiz_session_count || 0
  const progressDelta    = client.quiz_progress_delta
  const scoreTier        = isCompleted ? getScoreTier(client.score) : null
  const initials         = (client.name || '?').trim().charAt(0).toUpperCase()

  return (
    <div
      onClick={onClick ? () => onClick(client) : undefined}
      className={`surface-glass p-5 finance-animate-in flex flex-col gap-4 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* ── En-tête : avatar + nom + badge statut ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm">
            {client.avatar || initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 leading-snug truncate">{client.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 truncate">{client.email}</span>
            </div>
          </div>
        </div>

        {isCompleted ? (
          <span className={`badge ${scoreTier.badgeClass} shrink-0 tabular-nums`}>
            {client.score}/100
          </span>
        ) : (
          <span className="badge badge-pending shrink-0">
            <Clock className="w-3 h-3" />
            {tr('En attente', 'Pending')}
          </span>
        )}
      </div>

      {/* ── Score bar (quiz complété uniquement) ── */}
      {isCompleted && (
        <div className="space-y-1.5">
          <div className="score-bar">
            <div
              className={`score-bar-fill ${scoreTier.barClass}`}
              style={{ width: `${Math.min(100, client.score)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {strengths.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <Award className="w-3.5 h-3.5" />
                  {strengths.length} {tr('force', 'strength')}{strengths.length > 1 ? 's' : ''}
                </span>
              )}
              {weaknesses.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {weaknesses.length} {tr('faiblesse', 'weakness')}{weaknesses.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {quizSessionCount > 0 && typeof progressDelta === 'number' && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${progressDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {progressDelta >= 0
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {progressDelta >= 0 ? '+' : ''}{progressDelta} pts
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Date + sessions ── */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>
          {isCompleted
            ? `${tr('Complété le', 'Completed on')} ${formatDate(client.completed_at)}`
            : `${tr('Invité le', 'Invited on')} ${formatDate(client.created_at)}`}
        </span>
        {quizSessionCount > 1 && (
          <span className="ml-auto badge badge-neutral">
            {quizSessionCount} quiz
          </span>
        )}
      </div>

      {/* ── Action footer ── */}
      {footerAction || (
        <button className="btn-primary w-full text-sm">
          {isCompleted ? tr('Voir les résultats', 'View results') : tr("Relancer l'invitation", 'Resend invitation')}
        </button>
      )}
    </div>
  )
}
