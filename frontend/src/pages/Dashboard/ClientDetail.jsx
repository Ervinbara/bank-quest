import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClientById } from '@/services/clientService'
import { ArrowLeft, Award, AlertCircle, Mail, Calendar, TrendingUp, Loader2 } from 'lucide-react'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getScoreColor = (score) => {
  if (score >= 75) return 'text-green-600'
  if (score >= 50) return 'text-orange-600'
  return 'text-red-600'
}

export default function ClientDetail() {
  const { clientId } = useParams()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadClient = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getClientById(clientId)
      setClient(data)
    } catch (err) {
      console.error('Erreur chargement client:', err)
      setError('Impossible de charger le detail du client')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du client...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-3">❌ {error}</p>
        <button
          onClick={loadClient}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Reessayer
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800 font-semibold mb-3">Client introuvable.</p>
        <Link
          to="/dashboard/clients"
          className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour a la liste
        </Link>
      </div>
    )
  }

  const isCompleted = client.quiz_status === 'completed'
  const strengths = client.client_insights?.filter((i) => i.type === 'strength') || []
  const weaknesses = client.client_insights?.filter((i) => i.type === 'weakness') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/dashboard/clients"
            className="inline-flex items-center gap-2 text-sm text-purple-700 font-semibold hover:text-purple-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux clients
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
          <p className="text-gray-600">Fiche detail client</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {client.avatar || client.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{client.name}</h3>
              <div className="flex items-center gap-2 text-purple-100">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isCompleted ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">Score global</h3>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(client.score)} mb-2`}>
                {client.score}/100
              </div>
              <p className="text-sm text-gray-600">Complete le {formatDate(client.completed_at)}</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Questionnaire en attente</h3>
              <p className="text-sm text-gray-600 mb-1">Invite le {formatDate(client.created_at)}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-green-700" />
                <h4 className="font-bold text-green-900">Points forts ({strengths.length})</h4>
              </div>
              {strengths.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {strengths.map((item) => (
                    <span
                      key={item.id}
                      className="px-3 py-1 bg-white text-green-800 border border-green-200 rounded-full text-sm font-medium"
                    >
                      {item.concept}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-900">Aucune force renseignee.</p>
              )}
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-rose-700" />
                <h4 className="font-bold text-rose-900">
                  Points a ameliorer ({weaknesses.length})
                </h4>
              </div>
              {weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {weaknesses.map((item) => (
                    <span
                      key={item.id}
                      className="px-3 py-1 bg-white text-rose-800 border border-rose-200 rounded-full text-sm font-medium"
                    >
                      {item.concept}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-rose-900">Aucun point faible renseigne.</p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Cree le {formatDate(client.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}
