import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdvisorAnalytics } from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock3,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react'

const getBarWidth = (value, maxValue) => {
  if (value <= 0) return 0
  if (maxValue <= 0) return 0
  return Math.round((value / maxValue) * 100)
}

export default function Analytics() {
  const { advisor } = useAuth()
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
      setError('Impossible de charger les statistiques avancées')
    } finally {
      setLoading(false)
    }
  }, [advisor?.id])

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

  const exportReport = () => {
    if (!analytics) return

    setExporting(true)

    try {
      const openedAt = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })

      const strengths = analytics.conceptStats.strengths
        .map((item) => `<li>${item.concept} (${item.count})</li>`)
        .join('')
      const weaknesses = analytics.conceptStats.weaknesses
        .map((item) => `<li>${item.concept} (${item.count})</li>`)
        .join('')
      const evolutionRows = analytics.monthlyEvolution
        .map(
          (item) =>
            `<tr><td>${item.label}</td><td>${item.averageScore}/100</td><td>${item.completedCount}</td></tr>`
        )
        .join('')

      const html = `
        <!doctype html>
        <html lang="fr">
          <head>
            <meta charset="utf-8" />
            <title>Rapport analytics Bank Quest</title>
            <style>
              body { font-family: Arial, sans-serif; color: #1f2937; margin: 24px; }
              h1 { margin-bottom: 4px; }
              h2 { margin-top: 28px; font-size: 18px; }
              .muted { color: #6b7280; margin-bottom: 16px; }
              .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
              .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
              .value { font-size: 22px; font-weight: 700; margin-top: 6px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
              th { background: #f9fafb; }
              ul { margin: 8px 0 0; }
              @media print { body { margin: 12px; } }
            </style>
          </head>
          <body>
            <h1>Rapport Analytics - Bank Quest</h1>
            <p class="muted">Conseiller: ${advisor?.name || 'N/A'} | Généré le ${openedAt}</p>

            <div class="grid">
              <div class="card"><div>Total clients</div><div class="value">${analytics.summary.totalClients}</div></div>
              <div class="card"><div>Quiz complétés</div><div class="value">${analytics.summary.completed}</div></div>
              <div class="card"><div>Score moyen</div><div class="value">${analytics.summary.avgScore}/100</div></div>
              <div class="card"><div>Taux complétion</div><div class="value">${analytics.summary.completionRate}%</div></div>
            </div>

            <h2>Evolution des scores</h2>
            <table>
              <thead><tr><th>Mois</th><th>Score moyen</th><th>Quiz complétés</th></tr></thead>
              <tbody>${evolutionRows}</tbody>
            </table>

            <h2>Compétences dominantes</h2>
            <strong>Forces fréquentes</strong>
            <ul>${strengths || '<li>Aucune donnée</li>'}</ul>
            <strong style="display:block; margin-top:14px;">Faiblesses fréquentes</strong>
            <ul>${weaknesses || '<li>Aucune donnée</li>'}</ul>
          </body>
        </html>
      `

      const printWindow = window.open('', '_blank', 'width=980,height=700')
      if (!printWindow) {
        setError("Le navigateur a bloqué la fenêtre d'export PDF")
        return
      }

      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des analytics...</p>
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
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Analytics avancées</h2>
            <p className="text-indigo-100">
              Vue consolidée des performances clients et des compétences clés.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadAnalytics}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button
              onClick={exportReport}
              disabled={exporting}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard
          title="Total clients"
          value={analytics?.summary?.totalClients ?? 0}
          icon={BarChart3}
          color="blue"
        />
        <StatsCard
          title="Quiz complétés"
          value={analytics?.summary?.completed ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="En attente"
          value={analytics?.summary?.pending ?? 0}
          icon={Clock3}
          color="orange"
        />
        <StatsCard
          title="Score moyen"
          value={`${analytics?.summary?.avgScore ?? 0}/100`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Répartition des scores</h3>
          <p className="text-sm text-gray-500 mb-5">Nombre de clients par tranche de score</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Forces dominantes</h3>
          <p className="text-sm text-gray-500 mb-5">Concepts maîtrisés les plus fréquents</p>
          <div className="space-y-3">
            {analytics.conceptStats.strengths.length > 0 ? (
              analytics.conceptStats.strengths.map((item) => (
                <div
                  key={item.concept}
                  className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 border border-green-100"
                >
                  <span className="font-semibold text-green-900">{item.concept}</span>
                  <span className="text-sm font-bold text-green-700">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-1">Compétences à renforcer</h3>
          <p className="text-sm text-gray-500 mb-5">Points faibles les plus récurrents</p>
          <div className="space-y-3">
            {analytics.conceptStats.weaknesses.length > 0 ? (
              analytics.conceptStats.weaknesses.map((item) => (
                <div
                  key={item.concept}
                  className="flex items-center justify-between rounded-lg bg-rose-50 px-4 py-3 border border-rose-100"
                >
                  <span className="font-semibold text-rose-900">{item.concept}</span>
                  <span className="text-sm font-bold text-rose-700">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
