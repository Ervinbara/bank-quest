import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import PaginationControls from '@/components/common/PaginationControls'
import { dashboardGuides } from '@/data/dashboardGuides'
import {
  getAdvisorAnalytics,
  getAdvisorAnalyticsPriorities,
  updateClientFollowup
} from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import {
  TrendingUp,
  CheckCircle,
  Clock3,
  Loader2,
  Download,
  RefreshCw,
  Users,
  Target,
  ChevronDown,
  Search,
  RotateCcw
} from 'lucide-react'

const FOLLOWUP_LABELS = {
  a_contacter: 'A contacter',
  rdv_planifie: 'RDV planifie',
  en_cours: 'En cours',
  clos: 'Clos'
}
const normalizeFollowupStatus = (status) => status || 'a_contacter'
const toAnalyticsFollowupPatch = (client) => ({
  followupStatus: client?.followup_status || 'a_contacter',
  lastContactedAt: client?.last_contacted_at || null,
  advisorNotes: client?.advisor_notes || ''
})

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
    'Notes',
    'SessionsQuiz',
    'ProgressionDelta'
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
      row.advisorNotes || '',
      row.quizSessionCount || 0,
      typeof row.progressDelta === 'number' ? row.progressDelta : ''
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
  const [panelOpen, setPanelOpen] = useState({
    overview: true,
    distribution: true,
    priorities: true
  })
  const [priorityLimit, setPriorityLimit] = useState(10)
  const [priorityFollowupFilterDraft, setPriorityFollowupFilterDraft] = useState('all')
  const [priorityFollowupFilter, setPriorityFollowupFilter] = useState('all')
  const [prioritySearchDraft, setPrioritySearchDraft] = useState('')
  const [prioritySearch, setPrioritySearch] = useState('')
  const [priorityPage, setPriorityPage] = useState(1)
  const [priorityPageSize, setPriorityPageSize] = useState(5)
  const [priorityRows, setPriorityRows] = useState([])
  const [priorityTotal, setPriorityTotal] = useState(0)
  const [priorityLoading, setPriorityLoading] = useState(false)
  const [priorityLoadedOnce, setPriorityLoadedOnce] = useState(false)
  const [updatingPriorityClientId, setUpdatingPriorityClientId] = useState(null)

  const loadAnalytics = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorAnalytics(advisor.id, { includeCrmRows: false })
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

  const loadPriorityRows = useCallback(async () => {
    if (!advisor?.id) return
    if (!panelOpen.priorities) return

    try {
      setPriorityLoading(true)
      const result = await getAdvisorAnalyticsPriorities({
        advisorId: advisor.id,
        page: priorityPage,
        pageSize: priorityPageSize,
        limit: priorityLimit,
        followupFilter: priorityFollowupFilter,
        search: prioritySearch
      })
      setPriorityRows(result?.rows || [])
      setPriorityTotal(result?.totalItems || 0)
      setPriorityLoadedOnce(true)
    } catch (err) {
      console.error('Erreur chargement priorites:', err)
      setError(tr('Impossible de charger les priorites', 'Unable to load priorities'))
    } finally {
      setPriorityLoading(false)
    }
  }, [
    advisor?.id,
    panelOpen.priorities,
    priorityPage,
    priorityPageSize,
    priorityLimit,
    priorityFollowupFilter,
    prioritySearch,
    tr
  ])

  const exportCsv = async () => {
    try {
      setExporting(true)
      const result = await getAdvisorAnalyticsPriorities({
        advisorId: advisor?.id,
        page: 1,
        pageSize: 100000,
        limit: null,
        followupFilter: priorityFollowupFilter,
        search: prioritySearch
      })

      const rows = result?.rows || []
      if (rows.length === 0) return

      const csv = buildCsv(rows)
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

  useEffect(() => {
    setPriorityPage(1)
  }, [priorityLimit, priorityFollowupFilter, prioritySearch])

  useEffect(() => {
    if (!panelOpen.priorities && !priorityLoadedOnce) return
    void loadPriorityRows()
  }, [panelOpen.priorities, priorityLoadedOnce, loadPriorityRows])

  const applyPriorityFilters = () => {
    setPriorityFollowupFilter(priorityFollowupFilterDraft)
    setPrioritySearch(prioritySearchDraft)
    setPriorityPage(1)
  }

  const resetPriorityFilters = () => {
    setPriorityFollowupFilterDraft('all')
    setPriorityFollowupFilter('all')
    setPrioritySearchDraft('')
    setPrioritySearch('')
    setPriorityLimit(10)
    setPriorityPage(1)
  }

  const setPriorityFollowup = async (clientId, followupStatus) => {
    if (!advisor?.id || !clientId) return
    const optimisticContactDate = followupStatus !== 'a_contacter' ? new Date().toISOString() : null
    let previousAnalytics = null

    try {
      setError(null)
      setUpdatingPriorityClientId(clientId)
      previousAnalytics = analytics
      setPriorityRows((prev) =>
        (prev || []).map((row) =>
          row.id === clientId
            ? {
                ...row,
                followupStatus: followupStatus,
                lastContactedAt: optimisticContactDate || row.lastContactedAt
              }
            : row
        )
      )

      const updatedClient = await updateClientFollowup({
        clientId,
        advisorId: advisor.id,
        followupStatus,
        markContacted: followupStatus !== 'a_contacter'
      })

      if (updatedClient) {
        const patch = toAnalyticsFollowupPatch(updatedClient)
        setPriorityRows((prev) =>
          (prev || []).map((row) =>
            row.id === clientId
              ? {
                  ...row,
                  ...patch
                }
              : row
          )
        )
      }

      void Promise.all([loadAnalytics(), loadPriorityRows()])
    } catch (err) {
      console.error('Erreur mise a jour priorite:', err)
      if (previousAnalytics) {
        setAnalytics(previousAnalytics)
      }
      void loadPriorityRows()
      setError(tr('Impossible de mettre a jour le suivi', 'Unable to update follow-up'))
    } finally {
      setUpdatingPriorityClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
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
  const progress = analytics?.progress || {
    totalSessions: 0,
    trackedClients: 0,
    avgDelta: 0,
    improvedClients: 0,
    regressedClients: 0
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex justify-end">
        <DashboardGuide guide={dashboardGuides.analytics} />
      </div>

      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-700 rounded-xl p-5 sm:p-6 md:p-7 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{tr('Analytics avancees', 'Advanced analytics')}</h2>
            <p className="text-indigo-100">{tr('Pilotage commercial et priorisation des relances.', 'Sales tracking and follow-up prioritization.')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              {tr('Actualiser', 'Refresh')}
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-60 w-full sm:w-auto"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {tr('Export CSV', 'Export CSV')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatsCard title={tr('Total clients', 'Total clients')} value={analytics?.summary?.totalClients ?? 0} icon={Users} color="blue" />
        <StatsCard title={tr('Quiz completes', 'Completed quizzes')} value={analytics?.summary?.completed ?? 0} icon={CheckCircle} color="green" />
        <StatsCard title={tr('En attente', 'Pending')} value={analytics?.summary?.pending ?? 0} icon={Clock3} color="orange" />
        <StatsCard title={tr('Score moyen', 'Average score')} value={`${analytics?.summary?.avgScore ?? 0}/100`} icon={TrendingUp} color="purple" />
        <StatsCard title={tr('Sessions quiz', 'Quiz sessions')} value={progress.totalSessions} icon={Target} color="teal" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-800 font-semibold">Progression moyenne</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {progress.avgDelta >= 0 ? '+' : ''}
            {progress.avgDelta} pts
          </p>
          <p className="text-xs text-emerald-800 mt-1">{progress.trackedClients} client(s) compares</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-800 font-semibold">Clients en progression</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{progress.improvedClients}</p>
          <p className="text-xs text-blue-800 mt-1">delta positif entre premier et dernier quiz</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs uppercase tracking-wide text-rose-800 font-semibold">Clients en recul</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{progress.regressedClients}</p>
          <p className="text-xs text-rose-800 mt-1">delta negatif entre premier et dernier quiz</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <button
          onClick={() => setPanelOpen((prev) => ({ ...prev, overview: !prev.overview }))}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-gray-800">{tr('Vue pipeline et segmentation', 'Pipeline and segmentation overview')}</h3>
          <ChevronDown className={`w-5 h-5 text-gray-500 fm-chevron ${panelOpen.overview ? 'fm-chevron-open' : ''}`} />
        </button>
        {panelOpen.overview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">{tr('Pipeline conseiller', 'Advisor pipeline')}</h4>
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
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">{tr('Segmentation clients', 'Client segmentation')}</h4>
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
        ) : null}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <button
          onClick={() => setPanelOpen((prev) => ({ ...prev, distribution: !prev.distribution }))}
          className="w-full flex items-center justify-between mb-4"
        >
          <h3 className="text-xl font-bold text-gray-800">{tr('Repartition et evolution', 'Distribution and evolution')}</h3>
          <ChevronDown className={`w-5 h-5 text-gray-500 fm-chevron ${panelOpen.distribution ? 'fm-chevron-open' : ''}`} />
        </button>
        {panelOpen.distribution ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-1">Repartition des scores</h4>
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
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-700 rounded-full"
                        style={{ width: `${getBarWidth(bucket.count, maxDistributionCount)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-1">Evolution mensuelle</h4>
              <p className="text-sm text-gray-500 mb-5">Score moyen des 6 derniers mois</p>
              <div className="h-52 flex items-end gap-3">
                {analytics.monthlyEvolution.map((point) => (
                  <div key={point.monthKey} className="flex-1 min-w-0">
                    <div className="h-40 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-700 to-teal-400 rounded-t-md transition-all"
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
        ) : null}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <button
          onClick={() => setPanelOpen((prev) => ({ ...prev, priorities: !prev.priorities }))}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-800">{tr('Priorites de relance', 'Follow-up priorities')}</h3>
            <Target className="w-5 h-5 text-emerald-700" />
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 fm-chevron ${panelOpen.priorities ? 'fm-chevron-open' : ''}`} />
        </button>
        {!panelOpen.priorities ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={priorityLimit}
                onChange={(event) => setPriorityLimit(Number(event.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value={10}>{tr('Top 10', 'Top 10')}</option>
                <option value={20}>{tr('Top 20', 'Top 20')}</option>
                <option value={30}>{tr('Top 30', 'Top 30')}</option>
              </select>
              <select
                value={priorityFollowupFilterDraft}
                onChange={(event) => setPriorityFollowupFilterDraft(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="all">{tr('Tous suivis', 'All follow-ups')}</option>
                <option value="a_contacter">{tr('A contacter', 'To contact')}</option>
                <option value="rdv_planifie">{tr('RDV planifie', 'Meeting scheduled')}</option>
                <option value="en_cours">{tr('En cours', 'In progress')}</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={prioritySearchDraft}
                  onChange={(event) => setPrioritySearchDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyPriorityFilters()
                  }}
                  placeholder={tr('Nom, email, raison...', 'Name, email, reason...')}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={applyPriorityFilters}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 font-semibold hover:bg-emerald-700 transition"
                >
                  <Search className="w-4 h-4" />
                  {tr('Rechercher', 'Search')}
                </button>
                <button
                  type="button"
                  onClick={resetPriorityFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 text-gray-700 px-3 py-2 font-semibold hover:bg-gray-50 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  {tr('Reset', 'Reset')}
                </button>
              </div>
            </div>
          {priorityLoading ? (
            <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              {tr('Chargement des priorites...', 'Loading priorities...')}
            </div>
          ) : priorityRows.length === 0 ? (
            <p className="text-sm text-gray-500">{tr('Aucun client a prioriser pour le moment.', 'No clients to prioritize for now.')}</p>
          ) : (
          <div className="space-y-3">
            {priorityRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{row.name}</p>
                  <p className="text-sm text-gray-500">
                    {row.email} - {FOLLOWUP_LABELS[row.followupStatus] || row.followupStatus} - Score:{' '}
                    {typeof row.score === 'number' ? `${row.score}/100` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Dernier contact: {formatDate(row.lastContactedAt || row.createdAt)} - {row.priority.reason}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap lg:justify-end">
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={updatingPriorityClientId === row.id}
                      onClick={() => void setPriorityFollowup(row.id, 'a_contacter')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition disabled:opacity-60 ${
                        normalizeFollowupStatus(row.followupStatus) === 'a_contacter'
                          ? 'bg-blue-600 text-white ring-2 ring-blue-200 shadow-sm'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {tr('A contacter', 'To contact')}
                    </button>
                    <button
                      type="button"
                      disabled={updatingPriorityClientId === row.id}
                      onClick={() => void setPriorityFollowup(row.id, 'rdv_planifie')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition disabled:opacity-60 ${
                        normalizeFollowupStatus(row.followupStatus) === 'rdv_planifie'
                          ? 'bg-purple-600 text-white ring-2 ring-purple-200 shadow-sm'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {tr('RDV', 'Meeting')}
                    </button>
                    <button
                      type="button"
                      disabled={updatingPriorityClientId === row.id}
                      onClick={() => void setPriorityFollowup(row.id, 'clos')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition disabled:opacity-60 ${
                        normalizeFollowupStatus(row.followupStatus) === 'clos'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {tr('Clore', 'Close')}
                    </button>
                  </div>
                  <Link
                    to={`/dashboard/clients/${row.id}`}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition w-full sm:w-auto text-center"
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
            <PaginationControls
              page={priorityPage}
              pageSize={priorityPageSize}
              totalItems={priorityTotal}
              onPageChange={setPriorityPage}
              onPageSizeChange={(value) => {
                setPriorityPageSize(value)
                setPriorityPage(1)
              }}
              pageSizeOptions={[5, 10, 15]}
              labels={{
                itemsPerPage: tr('Par page', 'Per page'),
                showing: tr('Affichage', 'Showing'),
                of: tr('sur', 'of'),
                prev: tr('Precedent', 'Previous'),
                next: tr('Suivant', 'Next'),
                page: tr('Page', 'Page')
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}


