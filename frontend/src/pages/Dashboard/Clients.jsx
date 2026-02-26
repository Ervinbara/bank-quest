import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getAdvisorClients } from '@/services/clientService'
import ClientCard from '@/components/Dashboard/ClientCard'
import ClientDetailModal from '@/components/Dashboard/ClientDetailModal'
import { Loader2, Users, UserPlus } from 'lucide-react'

export default function Clients() {
  const { advisor } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => {
    if (advisor?.id) {
      loadClients()
    }
  }, [advisor?.id])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorClients(advisor.id)
      setClients(data || [])
    } catch (err) {
      console.error('❌ Erreur chargement clients:', err)
      setError('Impossible de charger les clients')
    } finally {
      setLoading(false)
    }
  }

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
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mes clients</h2>
          <p className="text-gray-600">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition">
          <UserPlus className="w-4 h-4" />
          Inviter un client
        </button>
      </div>

      {/* Liste vide */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun client pour l'instant</h3>
          <p className="text-gray-600 mb-6">
            Commencez à qualifier vos clients en leur envoyant un questionnaire.
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition">
            Inviter mon premier client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={setSelectedClient}
            />
          ))}
        </div>
      )}

      {/* Modal détail client */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  )
}
