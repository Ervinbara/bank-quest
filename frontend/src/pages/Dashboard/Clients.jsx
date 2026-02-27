import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getAdvisorClients, subscribeToAdvisorClients } from '@/services/clientService'
import ClientCard from '@/components/Dashboard/ClientCard'
import { Loader2, Users, UserPlus, ListFilter } from 'lucide-react'

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'completed', label: 'Completes' },
  { key: 'pending', label: 'En attente' }
]

export default function Clients() {
  const { advisor } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const loadClients = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorClients(advisor.id)
      setClients(data || [])
    } catch (err) {
      console.error('Erreur chargement clients:', err)
      setError('Impossible de charger les clients')
    } finally {
      setLoading(false)
    }
  }, [advisor?.id])

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
      pending
    }
  }, [clients])

  const filteredClients = useMemo(() => {
    if (activeFilter === 'completed') {
      return clients.filter((client) => client.quiz_status === 'completed')
    }

    if (activeFilter === 'pending') {
      return clients.filter((client) => client.quiz_status !== 'completed')
    }

    return clients
  }, [activeFilter, clients])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des clients...</p>
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
          Reessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mes clients</h2>
          <p className="text-gray-600">
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} affiche
            {filteredClients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
          <UserPlus className="w-4 h-4" />
          Inviter un client
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="flex items-center gap-2 mb-3">
          <ListFilter className="w-4 h-4 text-gray-600" />
          <p className="text-sm font-semibold text-gray-700">Filtrer par statut</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeFilter === filter.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className="ml-2 text-xs opacity-90">({stats[filter.key] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {clients.length === 0 ? "Aucun client pour l'instant" : 'Aucun client dans ce filtre'}
          </h3>
          <p className="text-gray-600 mb-6">
            {clients.length === 0
              ? 'Commencez a qualifier vos clients en leur envoyant un questionnaire.'
              : 'Essayez un autre filtre pour afficher des clients.'}
          </p>
          {clients.length === 0 ? (
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
              Inviter mon premier client
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              footerAction={
                <Link
                  to={`/dashboard/clients/${client.id}`}
                  className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm"
                >
                  Voir le detail
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
