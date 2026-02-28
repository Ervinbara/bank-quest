import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdvisorAnalytics } from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock3,
  Loader2,
  Download,
  RefreshCw,
  Users,
  Target
} from 'lucide-react'

const FOLLOWUP_LABELS = {
  a_contacter: 'A contacter',
  rdv_planifie: 'RDV planifie',
  en_cours: 'En cours',
  clos: 'Clos'
}

const getBarWidth = (value, maxValue) => {
  if (value <= 0 || maxValue <= 0) return 0
  return Math.round((value / maxValue) * 100)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

const buildCsv = (rows) => {
  const header = [
    'Client',
    'Email',
    'QuizStatus',
    'FollowupStatus',
    'Score',
    'Priorite',
    'NiveauPriorite',
    'DernierContact',
    'DateCreation',
    'Notes'
  ]
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const body = rows.map((row) =>
    [
      row.name,
      row.email,
      row.quizStatus,
      row.followupStatus,
      row.score ?? '',
      row.priority.value,
      row.priority.label,
      row.lastContactedAt || '',
      row.createdAt || '',
      row.advisorNotes || ''
    ]
      .map(escape)
      .join(',')
  )

  return [header.join(','), ...body].join('\n')
}

export default function Analytics() {
  const { advisor } = useAuth()
  const { tr } = useLanguage()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const loadAnalytics = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorAnalytics(advisor.id)
      setAnalytics(data)
    } catch (err) {
      console.error('Erreur chargement analytics:', err)
      setError(tr('Impossible de charger les statistiques avancees', 'Unable to load advanced analytics'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const maxDistributionCount = useMemo(() => {
    if (!analytics?.scoreDistribution?.length) return 0
    return Math.max(...analytics.scoreDistribution.map((item) => item.count), 0)
  }, [analytics])

  const maxEvolutionScore = useMemo(() => {
    if (!analytics?.monthlyEvolution?.length) return 0
    return Math.max(...analytics.monthlyEvolution.map((item) => item.averageScore), 0)
  }, [analytics])

  const exportCsv = () => {
    if (!analytics?.crmRows?.length) return

    try {
      setExporting(true)
      const csv = buildCsv(analytics.crmRows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finmate-crm-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des analytics...', 'Loading analytics...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-3">❌ {error}</p>
        <button
          onClick={loadAnalytics}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {tr('Reessayer', 'Retry')}
        </button>
      </div>
    )
  }

  const pipeline = analytics?.pipeline || { invited: 0, completed: 0, rdvPlanifie: 0, clos: 0 }
  const segmentation = analytics?.segmentation || { chaud: 0, tiede: 0, froid: 0 }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{tr('Analytics avancees', 'Advanced analytics')}</h2>
            <p className="text-indigo-100">{tr('Pilotage commercial et priorisation des relances.', 'Sales tracking and follow-up prioritization.')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              {tr('Actualiser', 'Refresh')}
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {tr('Export CSV', 'Export CSV')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard title={tr('Total clients', 'Total clients')} value={analytics?.summary?.totalClients ?? 0} icon={Users} color="blue" />
        <StatsCard title={tr('Quiz completes', 'Completed quizzes')} value={analytics?.summary?.completed ?? 0} icon={CheckCircle} color="green" />
        <StatsCard title={tr('En attente', 'Pending')} value={analytics?.summary?.pending ?? 0} icon={Clock3} color="orange" />
        <StatsCard title={tr('Score moyen', 'Average score')} value={`${analytics?.summary?.avgScore ?? 0}/100`} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Pipeline conseiller</h3>
          <div className="space-y-3">
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span>Invites</span>
              <strong>{pipeline.invited}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span>Quiz completes</span>
              <strong>{pipeline.completed}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span>RDV planifies</span>
              <strong>{pipeline.rdvPlanifie}</strong>
            </div>
            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span>Dossiers clos</span>
              <strong>{pipeline.clos}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Segmentation clients</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-sm text-green-800 font-semibold">Chaud</p>
              <p className="text-2xl font-bold text-green-700">{segmentation.chaud}</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
              <p className="text-sm text-amber-800 font-semibold">Tiede</p>
              <p className="text-2xl font-bold text-amber-700">{segmentation.tiede}</p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
              <p className="text-sm text-slate-800 font-semibold">Froid</p>
              <p className="text-2xl font-bold text-slate-700">{segmentation.froid}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Repartition des scores</h3>
          <p className="text-sm text-gray-500 mb-5">Nombre de clients par tranche</p>
          <div className="space-y-4">
            {analytics.scoreDistribution.map((bucket) => (
              <div key={bucket.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">{bucket.label}</span>
                  <span className="text-gray-500">{bucket.count} client(s)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                    style={{ width: `${getBarWidth(bucket.count, maxDistributionCount)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Evolution mensuelle</h3>
          <p className="text-sm text-gray-500 mb-5">Score moyen des 6 derniers mois</p>
          <div className="h-52 flex items-end gap-3">
            {analytics.monthlyEvolution.map((point) => (
              <div key={point.monthKey} className="flex-1 min-w-0">
                <div className="h-40 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t-md transition-all"
                    style={{ height: `${getBarWidth(point.averageScore, maxEvolutionScore)}%` }}
                    title={`${point.averageScore}/100 (${point.completedCount} quiz)`}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-semibold text-gray-700 truncate">{point.label}</p>
                  <p className="text-[11px] text-gray-500">{point.averageScore}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Top 10 a relancer</h3>
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        {analytics.priorities.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun client a prioriser pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {analytics.priorities.map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{row.name}</p>
                  <p className="text-sm text-gray-500">
                    {row.email} • {FOLLOWUP_LABELS[row.followupStatus] || row.followupStatus} • Score:{' '}
                    {typeof row.score === 'number' ? `${row.score}/100` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dernier contact: {formatDate(row.lastContactedAt || row.createdAt)} • {row.priority.reason}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      row.priority.label === 'Urgent'
                        ? 'bg-red-100 text-red-700'
                        : row.priority.label === 'Haute'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {row.priority.label} ({row.priority.value})
                  </span>
                  <Link
                    to={`/dashboard/clients/${row.id}`}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition"
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
