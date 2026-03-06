import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdvisorClientsPage, subscribeToAdvisorClients, updateClientFollowup } from '@/services/clientService'
import ClientCard from '@/components/Dashboard/ClientCard'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import InviteClientModal from '@/components/Dashboard/InviteClientModal'
import ImportClientsModal from '@/components/Dashboard/ImportClientsModal'
import PaginationControls from '@/components/common/PaginationControls'
import { dashboardGuides } from '@/data/dashboardGuides'
import { getPlanAccess, getRemainingClientSlots } from '@/lib/planAccess'
import { Loader2, Users, UserPlus, ListFilter, ChevronDown, Search, Upload } from 'lucide-react'

const normalizeFollowupStatus = (status) => status || 'a_contacter'

export default function Clients() {
  const { advisor } = useAuth()
  const { tr, language } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const STATUS_FILTERS = [
    { key: 'all', label: tr('Tous', 'All') },
    { key: 'completed', label: tr('Quiz completes', 'Completed quizzes') },
    { key: 'pending', label: tr('Quiz en attente', 'Pending quizzes') }
  ]

  const FOLLOWUP_FILTERS = [
    { key: 'all', label: tr('Tous suivis', 'All follow-ups') },
    { key: 'a_contacter', label: tr('A contacter', 'To contact') },
    { key: 'rdv_planifie', label: tr('RDV planifié', 'Meeting scheduled') },
    { key: 'en_cours', label: tr('En cours', 'In progress') },
    { key: 'clos', label: tr('Clos', 'Closed') }
  ]

  const FOLLOWUP_LABELS = {
    a_contacter: tr('A contacter', 'To contact'),
    rdv_planifie: tr('RDV planifié', 'Meeting scheduled'),
    en_cours: tr('En cours', 'In progress'),
    clos: tr('Clos', 'Closed')
  }

  const [clients, setClients] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [stats, setStats] = useState({
    all: 0,
    completed: 0,
    pending: 0,
    a_contacter: 0,
    rdv_planifie: 0,
    en_cours: 0,
    clos: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [infoMessage, setInfoMessage] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [activeFollowupFilter, setActiveFollowupFilter] = useState('all')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [updatingFollowupByClient, setUpdatingFollowupByClient] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const latestRequestIdRef = useRef(0)
  const previousIsMobileRef = useRef(null)
  const planAccess = getPlanAccess(advisor?.plan)
  const remainingClientSlots = getRemainingClientSlots({
    plan: planAccess.code,
    clientCount: stats.all
  })
  const clientLimitReached = remainingClientSlots !== null && remainingClientSlots <= 0

  const loadClients = useCallback(async () => {
    if (!advisor?.id) return

    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorClientsPage({
        advisorId: advisor.id,
        page,
        pageSize,
        statusFilter: activeStatusFilter,
        followupFilter: activeFollowupFilter,
        searchTerm
      })
      if (latestRequestIdRef.current !== requestId) return
      setClients(data?.items || [])
      setTotalItems(data?.totalItems || 0)
      setStats(
        data?.stats || {
          all: 0,
          completed: 0,
          pending: 0,
          a_contacter: 0,
          rdv_planifie: 0,
          en_cours: 0,
          clos: 0
        }
      )
    } catch (err) {
      if (latestRequestIdRef.current !== requestId) return
      console.error('Erreur chargement clients:', err)
      setError(tr('Impossible de charger les clients', 'Unable to load clients'))
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [advisor?.id, page, pageSize, activeStatusFilter, activeFollowupFilter, searchTerm, tr])

  useEffect(() => {
    void loadClients()
  }, [loadClients])

  useEffect(() => {
    if (!advisor?.id) return undefined

    const unsubscribe = subscribeToAdvisorClients(advisor.id, () => {
      void loadClients()
    })

    return unsubscribe
  }, [advisor?.id, loadClients])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const applyMobileState = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (previousIsMobileRef.current === null) {
        setFiltersCollapsed(mobile)
      } else if (!previousIsMobileRef.current && mobile) {
        setFiltersCollapsed(true)
      }
      previousIsMobileRef.current = mobile
    }
    applyMobileState()
    window.addEventListener('resize', applyMobileState)
    return () => window.removeEventListener('resize', applyMobileState)
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput.trim())
    }, 250)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    const quickAction = searchParams.get('quick')
    if (quickAction === 'invite') {
      setInviteModalOpen(true)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('quick')
        return next
      }, { replace: true })
    }
    if (quickAction === 'import') {
      setImportModalOpen(true)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('quick')
        return next
      }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setPage(1)
  }, [activeStatusFilter, activeFollowupFilter, searchTerm])

  const setFollowupQuick = async (clientId, followupStatus) => {
    if (!advisor?.id || !clientId) return
    const optimisticContactDate = followupStatus !== 'a_contacter' ? new Date().toISOString() : null
    let previousClient = null
    let previousStatus = null

    try {
      setError(null)
      setInfoMessage('')
      setUpdatingFollowupByClient((prev) => ({ ...prev, [clientId]: true }))
      setClients((prev) =>
        prev.map((client) => {
          if (client.id !== clientId) return client
          previousClient = client
          previousStatus = normalizeFollowupStatus(client.followup_status)
          return {
            ...client,
            followup_status: followupStatus,
            last_contacted_at: optimisticContactDate || client.last_contacted_at
          }
        })
      )

      if (previousStatus && previousStatus !== followupStatus) {
        setStats((prev) => ({
          ...prev,
          [previousStatus]: Math.max(0, Number(prev[previousStatus] || 0) - 1),
          [followupStatus]: Number(prev[followupStatus] || 0) + 1
        }))
      }

      const updatedClient = await updateClientFollowup({
        clientId,
        advisorId: advisor.id,
        followupStatus,
        markContacted: followupStatus !== 'a_contacter'
      })

      if (updatedClient) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === clientId
              ? {
                  ...client,
                  ...updatedClient
                }
              : client
          )
        )
      }
      setInfoMessage(tr('Suivi client mis a jour', 'Client follow-up updated'))
      setTimeout(() => setInfoMessage(''), 1800)
    } catch (err) {
      console.error('Erreur mise a jour suivi client:', err)
      if (previousClient) {
        setClients((prev) =>
          prev.map((client) => (client.id === clientId ? previousClient : client))
        )
      }
      if (previousStatus && previousStatus !== followupStatus) {
        setStats((prev) => ({
          ...prev,
          [followupStatus]: Math.max(0, Number(prev[followupStatus] || 0) - 1),
          [previousStatus]: Number(prev[previousStatus] || 0) + 1
        }))
      }
      setError(tr('Impossible de mettre a jour le suivi', 'Unable to update follow-up'))
    } finally {
      setUpdatingFollowupByClient((prev) => ({ ...prev, [clientId]: false }))
    }
  }

  const paginatedClients = useMemo(() => clients, [clients])
  const hasActiveFilters =
    Boolean(searchInput.trim()) || activeStatusFilter !== 'all' || activeFollowupFilter !== 'all'

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des clients...', 'Loading clients...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-3">❌ {error}</p>
        <button
          onClick={loadClients}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {tr('Réessayer', 'Retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0">
      {infoMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {infoMessage}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{tr('Mes clients', 'My clients')}</h2>
          <p className="text-gray-600">
            {language === 'fr'
              ? `${totalItems} client${totalItems !== 1 ? 's' : ''} affiche${totalItems !== 1 ? 's' : ''}`
              : `${totalItems} client${totalItems !== 1 ? 's' : ''} shown`}
          </p>
          <p className="text-sm font-semibold text-emerald-700 mt-1">
            {remainingClientSlots === null
              ? tr(`Quota clients: illimite (${planAccess.label})`, `Client quota: unlimited (${planAccess.label})`)
              : tr(
                  `Quota clients: ${stats.all}/${planAccess.maxClients} (${remainingClientSlots} restant${remainingClientSlots > 1 ? 's' : ''})`,
                  `Client quota: ${stats.all}/${planAccess.maxClients} (${remainingClientSlots} left)`
                )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <DashboardGuide guide={dashboardGuides.clients} />
          <button
            onClick={() => setImportModalOpen(true)}
            disabled={clientLimitReached}
            className="flex w-full sm:w-auto justify-center items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            {tr('Importer des clients', 'Import clients')}
          </button>
          <button
            onClick={() => setInviteModalOpen(true)}
            disabled={clientLimitReached}
            className="flex w-full sm:w-auto justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            <UserPlus className="w-4 h-4" />
            {tr('Ajouter / Inviter un client', 'Add / Invite a client')}
          </button>
        </div>
      </div>

        <div className="card p-4 space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          {remainingClientSlots === null
            ? tr(
                `Plan ${planAccess.label}: clients illimites. Envoi d'email ${planAccess.canSendInvitationEmails ? 'active' : 'desactive'}.`,
                `Plan ${planAccess.label}: unlimited clients. Invitation email ${planAccess.canSendInvitationEmails ? 'enabled' : 'disabled'}.`
              )
            : tr(
                `Plan ${planAccess.label}: ${remainingClientSlots} client(s) restant(s) sur ${planAccess.maxClients}. ${clientLimitReached ? 'Passez a un plan payant pour ajouter plus de clients.' : ''}`,
                `Plan ${planAccess.label}: ${remainingClientSlots} client slot(s) left of ${planAccess.maxClients}. ${clientLimitReached ? 'Upgrade to add more clients.' : ''}`
              )}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {tr(
            'Limites: Gratuit 5 | Solo 50 | Pro 200 | Cabinet/Test illimite.',
            'Limits: Free 5 | Solo 50 | Pro 200 | Cabinet/Test unlimited.'
          )}
        </div>

        {isMobile ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-mini">
              <p className="stat-mini-label">{tr('Total', 'Total')}</p>
              <p className="stat-mini-value">{stats.all}</p>
            </div>
            <div className="stat-mini">
              <p className="stat-mini-label">{tr('Completes', 'Completed')}</p>
              <p className="stat-mini-value text-emerald-700">{stats.completed}</p>
            </div>
            <div className="stat-mini">
              <p className="stat-mini-label">{tr('En attente', 'Pending')}</p>
              <p className="stat-mini-value text-sky-700">{stats.pending}</p>
            </div>
            <div className="stat-mini">
              <p className="stat-mini-label">{tr('A contacter', 'To contact')}</p>
              <p className="stat-mini-value text-slate-700">{stats.a_contacter}</p>
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{tr('Recherche', 'Search')}</p>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={tr('Nom ou email client...', 'Client name or email...')}
              className="input pl-9 pr-16"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                {tr('Effacer', 'Clear')}
              </button>
            ) : null}
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs font-semibold text-slate-600">{tr('Filtres actifs', 'Active filters')}</span>
            {searchInput.trim() ? (
              <span className="badge badge-neutral">{tr('Recherche', 'Search')}: {searchInput.trim()}</span>
            ) : null}
            {activeStatusFilter !== 'all' ? (
              <span className="badge badge-brand">{tr('Quiz', 'Quiz')}: {STATUS_FILTERS.find((item) => item.key === activeStatusFilter)?.label}</span>
            ) : null}
            {activeFollowupFilter !== 'all' ? (
              <span className="badge badge-neutral">{tr('Suivi', 'Follow-up')}: {FOLLOWUP_FILTERS.find((item) => item.key === activeFollowupFilter)?.label}</span>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setActiveStatusFilter('all')
                setActiveFollowupFilter('all')
              }}
              className="ml-auto btn-ghost text-xs py-1 px-2"
            >
              {tr('Reinitialiser', 'Reset')}
            </button>
          </div>
        ) : null}

        <button
          onClick={() => setFiltersCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">{tr('Filtres', 'Filters')}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 fm-chevron ${filtersCollapsed ? '' : 'fm-chevron-open'}`} />
        </button>

        {!filtersCollapsed ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{tr('Filtrer par quiz', 'Filter by quiz')}</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveStatusFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeStatusFilter === filter.key
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1.5 opacity-75 tabular-nums">({stats[filter.key] ?? 0})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{tr('Filtrer par suivi commercial', 'Filter by sales follow-up')}</p>
              <div className="flex flex-wrap gap-2">
                {FOLLOWUP_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFollowupFilter(filter.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeFollowupFilter === filter.key
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1.5 opacity-75 tabular-nums">
                      ({filter.key === 'all' ? stats.all : stats[filter.key] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {totalItems === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">
              {stats.all === 0
                ? tr("Aucun client pour l'instant", 'No clients yet')
                : tr('Aucun client dans ces filtres', 'No clients in these filters')}
          </h3>
          <p className="text-gray-600 mb-6">
            {stats.all === 0
              ? tr('Commencez a qualifier vos clients en leur envoyant un questionnaire.', 'Start qualifying clients by sending a questionnaire.')
              : tr('Essayez une autre combinaison de filtres.', 'Try another filter combination.')}
          </p>
          {stats.all === 0 ? (
            <button
              onClick={() => setInviteModalOpen(true)}
              disabled={clientLimitReached}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {tr('Inviter mon premier client', 'Invite my first client')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {tr('Mise a jour de la liste...', 'Updating list...')}
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                footerAction={
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {tr('Suivi', 'Follow-up')}
                      </p>
                      <span className="badge badge-neutral text-[10px]">
                        {FOLLOWUP_LABELS[normalizeFollowupStatus(client.followup_status)] || tr('A contacter', 'To contact')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { key: 'a_contacter', label: tr('Contact', 'Contact'), active: 'bg-sky-600 text-white ring-1 ring-sky-300', inactive: 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700' },
                        { key: 'rdv_planifie', label: tr('RDV', 'Meeting'), active: 'bg-violet-600 text-white ring-1 ring-violet-300', inactive: 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700' },
                        { key: 'clos', label: tr('Clos', 'Closed'), active: 'bg-emerald-600 text-white ring-1 ring-emerald-300', inactive: 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700' },
                      ].map(({ key, label, active, inactive }) => (
                        <button
                          key={key}
                          type="button"
                          disabled={!!updatingFollowupByClient[client.id]}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            void setFollowupQuick(client.id, key)
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-60 ${
                            normalizeFollowupStatus(client.followup_status) === key ? active : inactive
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Link
                      to={`/dashboard/clients/${client.id}`}
                      className="btn-primary block w-full text-center text-sm py-2"
                    >
                      {tr('Voir le détail', 'View details')}
                    </Link>
                  </div>
                }
              />
            ))}
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
            pageSizeOptions={[6, 9, 12, 24]}
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

      <InviteClientModal
        isOpen={inviteModalOpen}
        advisorId={advisor?.id}
        advisorName={advisor?.name}
        advisorEmail={advisor?.email}
        advisorPlan={advisor?.plan}
        currentClientCount={stats.all}
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => {
          void loadClients()
        }}
      />

      <ImportClientsModal
        isOpen={importModalOpen}
        advisorId={advisor?.id}
        advisorPlan={advisor?.plan}
        currentClientCount={stats.all}
        tr={tr}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          void loadClients()
        }}
      />
    </div>
  )
}

