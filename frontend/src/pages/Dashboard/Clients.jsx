import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdvisorClients } from '@/services/clientService'
import ClientCard from '@/components/Dashboard/ClientCard'
import ClientDetailModal from '@/components/Dashboard/ClientDetailModal'
import { Users, Loader2 } from 'lucide-react'

export default function Clients() {
  const { advisor } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [filter, setFilter] = useState('all') // all, completed, pending

  useEffect(() => {
    if (advisor?.id) {
      loadClients()
    }
  }, [advisor])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorClients(advisor.id)
      setClients(data)
    } catch (err) {
      console.error('Erreur chargement clients:', err)
      setError('Impossible de charger les clients')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les clients
  const filteredClients = clients.filter(client => {
    if (filter === 'completed') return client.quiz_status === 'completed'
    if (filter === 'pending') return client.quiz_status === 'pending'
    return true
  })

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">❌ {error}</p>
        <button
          onClick={loadClients}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    )
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Aucun client pour le moment
        </h2>
        <p className="text-gray-600 mb-6">
          Commencez par inviter votre premier client à compléter un questionnaire
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
          + Inviter un client
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              Mes clients
            </h2>
            <p className="text-gray-600">
              {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Filtres */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({clients.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complétés ({clients.filter(c => c.quiz_status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({clients.filter(c => c.quiz_status === 'pending').length})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={setSelectedClient}
          />
        ))}
      </div>

      {/* Modal de détail */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  )
}