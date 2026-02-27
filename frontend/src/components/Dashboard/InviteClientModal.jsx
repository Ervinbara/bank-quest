import { useMemo, useState } from 'react'
import { X, Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { isValidEmail } from '@/services/authService'
import { createClientInvitation } from '@/services/clientService'

export default function InviteClientModal({ isOpen, advisorId, onClose, onInvited }) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [createdInvitation, setCreatedInvitation] = useState(null)
  const [copied, setCopied] = useState(false)

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 1 && isValidEmail(formData.email)
  }, [formData.email, formData.name])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const closeAndReset = () => {
    setFormData({ name: '', email: '' })
    setLoading(false)
    setError(null)
    setCreatedInvitation(null)
    setCopied(false)
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isFormValid || loading) return

    try {
      setLoading(true)
      setError(null)
      const invitation = await createClientInvitation({
        advisorId,
        name: formData.name,
        email: formData.email
      })
      setCreatedInvitation(invitation)
      if (typeof onInvited === 'function') onInvited(invitation)
    } catch (err) {
      setError(err.message || "Impossible de creer l'invitation")
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    if (!createdInvitation?.inviteUrl) return

    try {
      await navigator.clipboard.writeText(createdInvitation.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Impossible de copier le lien automatiquement")
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={closeAndReset}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {!createdInvitation ? (
          <>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Inviter un client</h3>
                  <p className="text-purple-100 text-sm mt-1">
                    Creez un client et generez son lien d'acces au quiz.
                  </p>
                </div>
                <button
                  onClick={closeAndReset}
                  className="p-2 rounded-lg hover:bg-white/15 transition"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du client
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Marie Dubois"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@exemple.fr"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Generer l'invitation
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invitation creee</h3>
                  <p className="text-sm text-gray-600">
                    Client cree avec succes. Partagez maintenant le lien.
                  </p>
                </div>
              </div>
              <button
                onClick={closeAndReset}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                title="Fermer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Lien invitation</p>
              <p className="text-sm text-gray-800 break-all">{createdInvitation.inviteUrl}</p>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 mb-4">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAndReset}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={copyInviteLink}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Lien copie' : 'Copier le lien'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
