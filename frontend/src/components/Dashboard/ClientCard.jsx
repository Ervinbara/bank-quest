import { useState } from 'react'
import { Mail, Calendar, Award, AlertCircle } from 'lucide-react'

export default function ClientCard({ client, onClick }) {
  const isCompleted = client.quiz_status === 'completed'
  
  // Calculer le nombre de forces et faiblesses
  const strengths = client.client_insights?.filter(i => i.type === 'strength') || []
  const weaknesses = client.client_insights?.filter(i => i.type === 'weakness') || []

  // Couleur du score
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div
      onClick={() => onClick(client)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer p-6 border-2 border-transparent hover:border-purple-200"
    >
      {/* Header avec avatar et nom */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {client.avatar || client.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{client.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="text-xs">{client.email}</span>
            </div>
          </div>
        </div>

        {/* Badge de statut */}
        {isCompleted ? (
          <div className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(client.score)}`}>
            {client.score}/100
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            En attente
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>
            {isCompleted 
              ? `Complété le ${formatDate(client.completed_at)}`
              : `Invité le ${formatDate(client.created_at)}`
            }
          </span>
        </div>

        {isCompleted && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <Award className="w-4 h-4" />
              <span className="font-semibold">{strengths.length} forces</span>
            </div>
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold">{weaknesses.length} faiblesses</span>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'action */}
      <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm">
        {isCompleted ? 'Voir les résultats' : 'Relancer l\'invitation'}
      </button>
    </div>
  )
}