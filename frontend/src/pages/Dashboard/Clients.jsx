import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdvisorClients, subscribeToAdvisorClients, updateClientFollowup } from '@/services/clientService'
import ClientCard from '@/components/Dashboard/ClientCard'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import InviteClientModal from '@/components/Dashboard/InviteClientModal'
import ImportClientsModal from '@/components/Dashboard/ImportClientsModal'
import PaginationControls from '@/components/common/PaginationControls'
import { dashboardGuides } from '@/data/dashboardGuides'
import { Loader2, Users, UserPlus, ListFilter, ChevronDown, ChevronUp, Search, Upload } from 'lucide-react'

export default function Clients() {
  const { advisor } = useAuth()
  const { tr, language } = useLanguage()
  const STATUS_FILTERS = [
    { key: 'all', label: tr('Tous', 'All') },
    { key: 'completed', label: tr('Quiz completes', 'Completed quizzes') },
    { key: 'pending', label: tr('Quiz en attente', 'Pending quizzes') }
  ]

  const FOLLOWUP_FILTERS = [
    { key: 'all', label: tr('Tous suivis', 'All follow-ups') },
    { key: 'a_contacter', label: tr('A contacter', 'To contact') },
    { key: 'rdv_planifie', label: tr('RDV planifie', 'Meeting scheduled') },
    { key: 'en_cours', label: tr('En cours', 'In progress') },
    { key: 'clos', label: tr('Clos', 'Closed') }
  ]

  const FOLLOWUP_LABELS = {
    a_contacter: tr('A contacter', 'To contact'),
    rdv_planifie: tr('RDV planifie', 'Meeting scheduled'),
    en_cours: tr('En cours', 'In progress'),
    clos: tr('Clos', 'Closed')
  }

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')
  const [activeFollowupFilter, setActiveFollowupFilter] = useState('all')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [updatingFollowupByClient, setUpdatingFollowupByClient] = useState({})

  const loadClients = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorClients(advisor.id)
      setClients(data || [])
    } catch (err) {
      console.error('Erreur chargement clients:', err)
      setError(tr('Impossible de charger les clients', 'Unable to load clients'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

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

  const stats = useMemo(() => {
    const completed = clients.filter((client) => client.quiz_status === 'completed').length
    const pending = clients.length - completed

    return {
      all: clients.length,
      completed,
      pending,
      a_contacter: clients.filter((client) => client.followup_status === 'a_contacter').length,
      rdv_planifie: clients.filter((client) => client.followup_status === 'rdv_planifie').length,
      en_cours: clients.filter((client) => client.followup_status === 'en_cours').length,
      clos: clients.filter((client) => client.followup_status === 'clos').length
    }
  }, [clients])

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return clients.filter((client) => {
      const statusOk =
        activeStatusFilter === 'all'
          ? true
          : activeStatusFilter === 'completed'
            ? client.quiz_status === 'completed'
            : client.quiz_status !== 'completed'

      const followupOk =
        activeFollowupFilter === 'all' ? true : client.followup_status === activeFollowupFilter

      if (!statusOk || !followupOk) return false
      if (!normalizedSearch) return true

      const name = String(client.name || '').toLowerCase()
      const email = String(client.email || '').toLowerCase()
      return name.includes(normalizedSearch) || email.includes(normalizedSearch)
    })
  }, [activeStatusFilter, activeFollowupFilter, clients, searchTerm])

  useEffect(() => {
    setPage(1)
  }, [activeStatusFilter, activeFollowupFilter, searchTerm])

  const setFollowupQuick = async (clientId, followupStatus) => {
    if (!advisor?.id || !clientId) return
    try {
      setUpdatingFollowupByClient((prev) => ({ ...prev, [clientId]: true }))
      await updateClientFollowup({
        clientId,
        advisorId: advisor.id,
        followupStatus,
        markContacted: followupStatus !== 'a_contacter'
      })
      await loadClients()
    } catch (err) {
      console.error('Erreur mise a jour suivi client:', err)
      setError(tr('Impossible de mettre a jour le suivi', 'Unable to update follow-up'))
    } finally {
      setUpdatingFollowupByClient((prev) => ({ ...prev, [clientId]: false }))
    }
  }

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, page, pageSize])

  if (loading) {
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
          {tr('Reessayer', 'Retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{tr('Mes clients', 'My clients')}</h2>
          <p className="text-gray-600">
            {language === 'fr'
              ? `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} affiche${filteredClients.length !== 1 ? 's' : ''}`
              : `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} shown`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DashboardGuide guide={dashboardGuides.clients} />
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            <Upload className="w-4 h-4" />
            {tr('Importer des clients', 'Import clients')}
          </button>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            <UserPlus className="w-4 h-4" />
            {tr('Ajouter / Inviter un client', 'Add / Invite a client')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-4">
        <button
          onClick={() => setFiltersCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-700">{tr('Filtres', 'Filters')}</p>
          </div>
          {filtersCollapsed ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
        </button>

        {!filtersCollapsed ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">{tr('Recherche', 'Search')}</p>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={tr('Nom ou email client...', 'Client name or email...')}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-700">{tr('Filtrer par quiz', 'Filter by quiz')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveStatusFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      activeStatusFilter === filter.key
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 text-xs opacity-90">({stats[filter.key] ?? 0})</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">{tr('Filtrer par suivi commercial', 'Filter by sales follow-up')}</p>
              <div className="flex flex-wrap gap-2">
                {FOLLOWUP_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFollowupFilter(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      activeFollowupFilter === filter.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 text-xs opacity-90">
                      ({filter.key === 'all' ? stats.all : stats[filter.key] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
              {clients.length === 0
                ? tr("Aucun client pour l'instant", 'No clients yet')
                : tr('Aucun client dans ces filtres', 'No clients in these filters')}
          </h3>
          <p className="text-gray-600 mb-6">
            {clients.length === 0
              ? tr('Commencez a qualifier vos clients en leur envoyant un questionnaire.', 'Start qualifying clients by sending a questionnaire.')
              : tr('Essayez une autre combinaison de filtres.', 'Try another filter combination.')}
          </p>
          {clients.length === 0 ? (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {tr('Inviter mon premier client', 'Invite my first client')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                footerAction={
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-600">
                      {tr('Suivi', 'Follow-up')}: {FOLLOWUP_LABELS[client.followup_status] || tr('A contacter', 'To contact')}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        disabled={!!updatingFollowupByClient[client.id]}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void setFollowupQuick(client.id, 'a_contacter')
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition"
                      >
                        {tr('A contacter', 'To contact')}
                      </button>
                      <button
                        type="button"
                        disabled={!!updatingFollowupByClient[client.id]}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void setFollowupQuick(client.id, 'rdv_planifie')
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-60 transition"
                      >
                        {tr('RDV', 'Meeting')}
                      </button>
                      <button
                        type="button"
                        disabled={!!updatingFollowupByClient[client.id]}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void setFollowupQuick(client.id, 'clos')
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 transition"
                      >
                        {tr('Clore', 'Close')}
                      </button>
                    </div>
                    <Link
                      to={`/dashboard/clients/${client.id}`}
                      className="block w-full text-center bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm"
                    >
                      {tr('Voir le detail', 'View details')}
                    </Link>
                  </div>
                }
              />
            ))}
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredClients.length}
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
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => {
          void loadClients()
        }}
      />

      <ImportClientsModal
        isOpen={importModalOpen}
        advisorId={advisor?.id}
        tr={tr}
        onClose={() => setImportModalOpen(false)}
        onImported={() => {
          void loadClients()
        }}
      />
    </div>
  )
}

