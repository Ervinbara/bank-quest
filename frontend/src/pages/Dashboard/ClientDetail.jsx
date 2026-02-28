import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { deleteClient, getClientById, updateClient, updateClientFollowup } from '@/services/clientService'
import { isValidEmail } from '@/services/authService'
import {
  ArrowLeft,
  Award,
  AlertCircle,
  Mail,
  Calendar,
  TrendingUp,
  Loader2,
  Save,
  Trash2,
  Pencil,
  PhoneCall
} from 'lucide-react'

const FOLLOWUP_OPTIONS = [
  { key: 'a_contacter', label: 'A contacter' },
  { key: 'rdv_planifie', label: 'RDV planifie' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'clos', label: 'Clos' }
]

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
  const { advisor } = useAuth()
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingFollowup, setUpdatingFollowup] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: ''
  })
  const [followupData, setFollowupData] = useState({
    followupStatus: 'a_contacter',
    advisorNotes: ''
  })

  const loadClient = useCallback(async () => {
    if (!clientId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getClientById(clientId)
      setClient(data)
      setFormData({
        name: data?.name || '',
        email: data?.email || '',
        avatar: data?.avatar || '👤'
      })
      setFollowupData({
        followupStatus: data?.followup_status || 'a_contacter',
        advisorNotes: data?.advisor_notes || ''
      })
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const handleSave = async () => {
    if (!client?.id || !advisor?.id) return

    if (!formData.name.trim()) {
      setError('Le nom est requis')
      return
    }
    if (!isValidEmail(formData.email)) {
      setError('Email invalide')
      return
    }

    try {
      setSaving(true)
      setError(null)

      await updateClient({
        clientId: client.id,
        advisorId: advisor.id,
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar
      })

      await loadClient()
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Impossible de mettre a jour le client')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFollowup = async (markContacted = false) => {
    if (!client?.id || !advisor?.id) return

    try {
      setUpdatingFollowup(true)
      setError(null)
      await updateClientFollowup({
        clientId: client.id,
        advisorId: advisor.id,
        followupStatus: followupData.followupStatus,
        advisorNotes: followupData.advisorNotes,
        markContacted
      })
      await loadClient()
    } catch (err) {
      setError(err.message || 'Impossible de mettre a jour le suivi')
    } finally {
      setUpdatingFollowup(false)
    }
  }

  const handleDelete = async () => {
    if (!client?.id || !advisor?.id) return

    const confirmed = window.confirm(
      `Supprimer definitivement le client "${client.name}" ? Cette action est irreversible.`
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      setError(null)
      await deleteClient({ clientId: client.id, advisorId: advisor.id })
      navigate('/dashboard/clients', { replace: true })
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le client')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement du client...</p>
        </div>
      </div>
    )
  }

  if (error && !client) {
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
            className="inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold hover:text-emerald-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux clients
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
          <p className="text-gray-600">Fiche detail client</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((prev) => !prev)}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-60"
          >
            <Pencil className="w-4 h-4" />
            {editing ? 'Annuler' : 'Modifier'}
          </button>
          <button
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Supprimer
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {editing ? formData.avatar || '👤' : client.avatar || client.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-bold">{editing ? formData.name : client.name}</h3>
              <div className="flex items-center gap-2 text-emerald-100">
                <Mail className="w-4 h-4" />
                <span>{editing ? formData.email : client.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {editing ? (
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Modifier les informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar</label>
                  <input
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: 👤"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : null}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-blue-900">Suivi commercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-2">Statut</label>
                <select
                  value={followupData.followupStatus}
                  onChange={(event) =>
                    setFollowupData((prev) => ({ ...prev, followupStatus: event.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500"
                >
                  {FOLLOWUP_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Dernier contact</p>
                <p>{client.last_contacted_at ? formatDate(client.last_contacted_at) : 'Aucun contact enregistre'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-2">Notes conseiller</label>
              <textarea
                rows={4}
                value={followupData.advisorNotes}
                onChange={(event) =>
                  setFollowupData((prev) => ({ ...prev, advisorNotes: event.target.value }))
                }
                placeholder="Ajoutez un contexte, une relance, un compte-rendu de rendez-vous..."
                className="w-full px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => void handleSaveFollowup(false)}
                disabled={updatingFollowup}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 text-blue-800 font-semibold hover:bg-blue-100 transition disabled:opacity-60"
              >
                {updatingFollowup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Sauvegarder suivi
              </button>
              <button
                onClick={() => void handleSaveFollowup(true)}
                disabled={updatingFollowup}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60"
              >
                {updatingFollowup ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                Marquer comme contacte
              </button>
            </div>
          </div>

          {isCompleted ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-emerald-700" />
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
                <h4 className="font-bold text-rose-900">Points a ameliorer ({weaknesses.length})</h4>
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


