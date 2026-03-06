import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdminOverview } from '@/services/adminService'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import PaginationControls from '@/components/common/PaginationControls'
import { dashboardGuides } from '@/data/dashboardGuides'
import { Loader2, Users, CreditCard, Building2, TrendingUp, Search } from 'lucide-react'

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

const planLabel = (plan, tr) => {
  const labels = {
    none: tr('Sans plan', 'No plan'),
    solo: 'Solo',
    pro: 'Pro',
    cabinet: 'Cabinet'
  }
  return labels[plan] || plan || labels.none
}

export default function Admin() {
  const { tr } = useLanguage()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdminOverview()
      setOverview(data)
    } catch (err) {
      console.error('Admin overview load error:', err)
      setError(tr('Impossible de charger les statistiques globales', 'Unable to load global statistics'))
    } finally {
      setLoading(false)
    }
  }, [tr])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const filteredAdvisors = useMemo(() => {
    const advisors = overview?.advisors || []
    const query = searchTerm.trim().toLowerCase()
    if (!query) return advisors

    return advisors.filter((advisor) => {
      const name = String(advisor.name || '').toLowerCase()
      const email = String(advisor.email || '').toLowerCase()
      const company = String(advisor.company || '').toLowerCase()
      return name.includes(query) || email.includes(query) || company.includes(query)
    })
  }, [overview?.advisors, searchTerm])

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const paginatedAdvisors = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAdvisors.slice(start, start + pageSize)
  }, [filteredAdvisors, page, pageSize])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement de la console admin...', 'Loading admin console...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-3">❌ {error}</p>
        <button
          onClick={loadOverview}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {tr('Réessayer', 'Retry')}
        </button>
      </div>
    )
  }

  const kpis = overview?.kpis || {
    totalAdvisors: 0,
    activeSubscriptions: 0,
    totalClients: 0,
    completionRate: 0,
    mrr: 0
  }
  const plans = overview?.plans || { none: 0, solo: 0, pro: 0, cabinet: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{tr('Console Super Admin', 'Super Admin console')}</h2>
          <p className="text-gray-600">
            {tr('Vue globale des conseillers et de la performance business.', 'Global view of advisors and business performance.')}
          </p>
        </div>
        <DashboardGuide guide={dashboardGuides.admin} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">{tr('Conseillers', 'Advisors')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.totalAdvisors}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-semibold">{tr('Abonnements actifs', 'Active subscriptions')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.activeSubscriptions}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-semibold">{tr('Clients geres', 'Managed clients')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.totalClients}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">{tr('Taux completion', 'Completion rate')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.completionRate}%</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">MRR</span>
          </div>
          <p className="text-3xl font-bold text-emerald-800">{kpis.mrr} EUR</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          {tr('Distribution des plans', 'Plan distribution')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-gray-600">{tr('Sans plan', 'No plan')}</p>
            <p className="text-2xl font-bold text-gray-900">{plans.none}</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-blue-700">Solo</p>
            <p className="text-2xl font-bold text-blue-900">{plans.solo}</p>
          </div>
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
            <p className="text-purple-700">Pro</p>
            <p className="text-2xl font-bold text-purple-900">{plans.pro}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-emerald-700">Cabinet</p>
            <p className="text-2xl font-bold text-emerald-900">{plans.cabinet}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            {tr('Conseillers financiers', 'Financial advisors')}
          </h3>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tr('Nom, email ou societe...', 'Name, email, or company...')}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200">
                <th className="py-2 pr-4">{tr('Conseiller', 'Advisor')}</th>
                <th className="py-2 pr-4">{tr('Societe', 'Company')}</th>
                <th className="py-2 pr-4">{tr('Plan', 'Plan')}</th>
                <th className="py-2 pr-4">{tr('Abonnement', 'Subscription')}</th>
                <th className="py-2 pr-4">{tr('Clients', 'Clients')}</th>
                <th className="py-2 pr-4">{tr('Completion', 'Completion')}</th>
                <th className="py-2 pr-4">{tr('Score moyen', 'Avg score')}</th>
                <th className="py-2 pr-0">{tr('Inscrit le', 'Created on')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAdvisors.map((advisor) => {
                const isActiveSubscription = ACTIVE_STATUSES.has(advisor.subscription_status)
                const completionRate =
                  advisor.client_count > 0
                    ? Math.round((advisor.completed_count / advisor.client_count) * 100)
                    : 0
                return (
                  <tr key={advisor.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-800">{advisor.name}</p>
                      <p className="text-gray-500">{advisor.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{advisor.company || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {planLabel(advisor.plan, tr)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full font-semibold ${
                          isActiveSubscription
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {isActiveSubscription ? tr('Actif', 'Active') : tr('Inactif', 'Inactive')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-800">{advisor.client_count}</td>
                    <td className="py-3 pr-4 text-gray-800">{completionRate}%</td>
                    <td className="py-3 pr-4 text-gray-800">
                      {typeof advisor.average_score === 'number' ? `${advisor.average_score}/100` : '-'}
                    </td>
                    <td className="py-3 pr-0 text-gray-600">{formatDate(advisor.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={filteredAdvisors.length}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value)
            setPage(1)
          }}
          pageSizeOptions={[10, 20, 30]}
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
    </div>
  )
}
