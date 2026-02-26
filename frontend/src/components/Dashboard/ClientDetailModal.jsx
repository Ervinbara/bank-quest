import { X, Award, AlertCircle, Mail, Calendar, TrendingUp } from 'lucide-react'

export default function ClientDetailModal({ client, onClose }) {
  if (!client) return null

  const isCompleted = client.quiz_status === 'completed'
  const strengths = client.client_insights?.filter(i => i.type === 'strength') || []
  const weaknesses = client.client_insights?.filter(i => i.type === 'weakness') || []

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold">
                {client.avatar || client.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{client.name}</h2>
                <div className="flex items-center gap-2 text-purple-100">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score */}
          {isCompleted && (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">Score global</h3>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(client.score)} mb-2`}>
                {client.score}/100
              </div>
              <p className="text-sm text-gray-600">
                Complété le {formatDate(client.completed_at)}
              </p>
            </div>
          )}

          {/* Status en attente */}
          {!isCompleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Questionnaire en attente
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Invité le {formatDate(client.created_at)}
              </p>
              <button className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition">
                Renvoyer l'invitation
              </button>
            </div>
          )}

          {/* Forces */}
          {isCompleted && strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Points forts ({strengths.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {strengths.map((strength) => (
                  <span
                    key={strength.id}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    ✓ {strength.concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Faiblesses */}
          {isCompleted && weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Points à améliorer ({weaknesses.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((weakness) => (
                  <span
                    key={weakness.id}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    ⚠ {weakness.concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {isCompleted && weaknesses.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-900 mb-2">
                💡 Recommandations pour le rendez-vous
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {weaknesses.slice(0, 3).map((weakness) => (
                  <li key={weakness.id}>
                    • Préparer des exemples concrets sur : <strong>{weakness.concept}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition">
              Télécharger le rapport PDF
            </button>
            <button className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
              Programmer un RDV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}