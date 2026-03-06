import { useEffect, useMemo, useState } from 'react'
import { X, Loader2, Copy, CheckCircle2, Send } from 'lucide-react'
import { isValidEmail } from '@/services/authService'
import { createClientInvitation } from '@/services/clientService'
import {
  DEFAULT_EMAIL_TEMPLATE,
  getAdvisorEmailTemplate,
  sendInvitationEmail
} from '@/services/invitationEmailService'
import { getAdvisorQuestionnaires } from '@/services/questionnaireService'
import { getPlanAccess, getRemainingClientSlots } from '@/lib/planAccess'

export default function InviteClientModal({
  isOpen,
  advisorId,
  advisorName,
  advisorEmail,
  advisorPlan,
  currentClientCount = 0,
  onClose,
  onInvited
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [error, setError] = useState(null)
  const [createdInvitation, setCreatedInvitation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [autoSendEmail, setAutoSendEmail] = useState(true)
  const [template, setTemplate] = useState(DEFAULT_EMAIL_TEMPLATE)
  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('')
  const planAccess = getPlanAccess(advisorPlan)
  const remainingClientSlots = getRemainingClientSlots({
    plan: planAccess.code,
    clientCount: currentClientCount
  })
  const limitReached = remainingClientSlots !== null && remainingClientSlots <= 0

  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 1 && isValidEmail(formData.email)
  }, [formData.email, formData.name])

  useEffect(() => {
    if (!isOpen || !advisorId) return

    const loadTemplate = async () => {
      try {
        const loaded = await getAdvisorEmailTemplate(advisorId)
        setTemplate(loaded || DEFAULT_EMAIL_TEMPLATE)
      } catch {
        console.warn('Template email indisponible, fallback par defaut')
        setTemplate(DEFAULT_EMAIL_TEMPLATE)
      }
    }

    const loadQuestionnaires = async () => {
      try {
        const data = await getAdvisorQuestionnaires(advisorId)
        setQuestionnaires(data || [])
        const defaultQuestionnaire = (data || []).find((item) => item.is_default) || data?.[0]
        setSelectedQuestionnaireId(defaultQuestionnaire?.id || '')
      } catch (err) {
        console.error('Erreur chargement questionnaires:', err)
        setQuestionnaires([])
        setSelectedQuestionnaireId('')
      }
    }

    void loadTemplate()
    void loadQuestionnaires()
  }, [isOpen, advisorId])

  useEffect(() => {
    if (!isOpen) return
    if (!planAccess.canSendInvitationEmails) {
      setAutoSendEmail(false)
    }
  }, [isOpen, planAccess.canSendInvitationEmails])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  const closeAndReset = () => {
    setFormData({ name: '', email: '' })
    setLoading(false)
    setSendingEmail(false)
    setError(null)
    setCreatedInvitation(null)
    setCopied(false)
    setEmailSent(false)
    setAutoSendEmail(true)
    setSelectedQuestionnaireId('')
    onClose()
  }

  const sendEmailNow = async (invitation, useCurrentFormValues = false) => {
    if (!invitation?.inviteUrl) return

    const toEmail = useCurrentFormValues ? formData.email : invitation.client?.email || formData.email
    const clientName = useCurrentFormValues ? formData.name : invitation.client?.name || formData.name

    try {
      setSendingEmail(true)
      setError(null)

      await sendInvitationEmail({
        toEmail,
        clientName,
        advisorName: advisorName || 'Votre conseiller',
        advisorEmail: advisorEmail || '',
        inviteLink: invitation.inviteUrl,
        template
      })

      setEmailSent(true)
    } catch (err) {
      setError(err.message || "Impossible d'envoyer l'email d'invitation")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isFormValid || loading) return
    if (limitReached) {
      setError(
        `Limite atteinte pour le plan ${planAccess.label}: ${planAccess.maxClients} clients maximum.`
      )
      return
    }

    try {
      setLoading(true)
      setError(null)
      setEmailSent(false)

      const invitation = await createClientInvitation({
        advisorId,
        name: formData.name,
        email: formData.email,
        questionnaireId: selectedQuestionnaireId || null
      })

      setCreatedInvitation(invitation)
      if (typeof onInvited === 'function') onInvited(invitation)

      if (autoSendEmail && planAccess.canSendInvitationEmails) {
        await sendEmailNow(invitation, true)
      }
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

  return (
    <div
      className="fm-overlay fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] sm:p-4"
      style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      aria-hidden={!isOpen}
      inert={!isOpen ? '' : undefined}
      onClick={closeAndReset}
    >
      <div
        className="fm-panel bg-white w-full max-h-[calc(100dvh-24px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[92vh] sm:max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(-10px)',
        }}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {!createdInvitation ? (
          <>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 sm:p-6 sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">Inviter un client</h3>
                  <p className="text-emerald-100 text-sm mt-1">
                    Creez un client, obtenez son lien et envoyez un email automatiquement.
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

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoSendEmail}
                  onChange={(event) => setAutoSendEmail(event.target.checked)}
                  disabled={!planAccess.canSendInvitationEmails}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-700"
                />
                Envoyer automatiquement un email au client
              </label>
              {!planAccess.canSendInvitationEmails ? (
                <p className="text-xs text-amber-700">
                  En plan gratuit, vous pouvez generer et partager des liens, mais pas envoyer d'email depuis la plateforme.
                </p>
              ) : null}
              {remainingClientSlots !== null ? (
                <p className="text-xs text-gray-600">
                  Clients restants sur votre plan: {remainingClientSlots}/{planAccess.maxClients}
                </p>
              ) : (
                <p className="text-xs text-gray-600">Clients illimites sur votre plan.</p>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Questionnaire a envoyer</label>
                <select
                  value={selectedQuestionnaireId}
                  onChange={(event) => setSelectedQuestionnaireId(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  {questionnaires.length === 0 ? <option value="">Questionnaire standard</option> : null}
                  {questionnaires.map((questionnaire) => (
                    <option key={questionnaire.id} value={questionnaire.id}>
                      {questionnaire.name}
                      {questionnaire.is_default ? ' (Par defaut)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Conseil: choisissez un questionnaire "Par defaut" dans l'onglet Questionnaires.
                  Sans defaut, l'application prend automatiquement le premier questionnaire cree.
                </p>
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
                  disabled={!isFormValid || loading || limitReached}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Generer l'invitation
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="flex items-start justify-between mb-5 sticky top-0 bg-white py-1 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Invitation creee</h3>
                  <p className="text-sm text-gray-600">
                    Lien genere. Vous pouvez copier le lien et/ou envoyer un email.
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
              <p className="text-sm text-gray-600 mt-2">
                Questionnaire: {createdInvitation.questionnaireName || 'Questionnaire standard'}
              </p>
              {createdInvitation.legacyMode ? (
                <p className="text-xs text-amber-700 mt-2">
                  Mode compatibilite actif: appliquez la migration Supabase pour activer la regeneration unique des liens.
                </p>
              ) : null}
            </div>

            {emailSent ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 mb-4">
                Email d'invitation envoye avec succes.
              </div>
            ) : null}

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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Lien copie' : 'Copier le lien'}
              </button>
              <button
                type="button"
                onClick={() => sendEmailNow(createdInvitation)}
                disabled={sendingEmail}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 transition disabled:opacity-60"
              >
                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer le mail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

