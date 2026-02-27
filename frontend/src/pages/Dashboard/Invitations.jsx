import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAdvisorInvitationLinks,
  regenerateInvitationLink,
  subscribeToAdvisorClients
} from '@/services/clientService'
import {
  DEFAULT_EMAIL_TEMPLATE,
  INVITE_LINK_PLACEHOLDER,
  getAdvisorEmailTemplate,
  saveAdvisorEmailTemplate,
  sendInvitationEmail
} from '@/services/invitationEmailService'
import { Loader2, Copy, RefreshCw, CheckCircle2, Link2, Send, Save } from 'lucide-react'

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Invitations() {
  const { advisor } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copyState, setCopyState] = useState('')
  const [regeneratingId, setRegeneratingId] = useState('')
  const [sendingId, setSendingId] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateMessage, setTemplateMessage] = useState('')
  const [template, setTemplate] = useState(DEFAULT_EMAIL_TEMPLATE)

  const loadInvitations = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorInvitationLinks(advisor.id)
      setRows(data || [])
    } catch (err) {
      console.error('Erreur chargement invitations:', err)
      setError('Impossible de charger les liens invitations')
    } finally {
      setLoading(false)
    }
  }, [advisor?.id])

  const loadTemplate = useCallback(async () => {
    if (!advisor?.id) return

    try {
      const data = await getAdvisorEmailTemplate(advisor.id)
      setTemplate(data || DEFAULT_EMAIL_TEMPLATE)
    } catch {
      console.warn('Template indisponible, fallback par defaut')
      setTemplate(DEFAULT_EMAIL_TEMPLATE)
    }
  }, [advisor?.id])

  useEffect(() => {
    void loadInvitations()
    void loadTemplate()
  }, [loadInvitations, loadTemplate])

  useEffect(() => {
    if (!advisor?.id) return undefined
    const unsubscribe = subscribeToAdvisorClients(advisor.id, () => {
      void loadInvitations()
    })
    return unsubscribe
  }, [advisor?.id, loadInvitations])

  const pendingRows = useMemo(() => rows.filter((row) => row.quiz_status !== 'completed'), [rows])

  const copyLink = async (row) => {
    if (!row?.invitation?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(row.invitation.inviteUrl)
      setCopyState(row.id)
      setTimeout(() => setCopyState(''), 1500)
    } catch {
      setError("Impossible de copier le lien dans le presse-papiers")
    }
  }

  const regenerate = async (row) => {
    try {
      setRegeneratingId(row.id)
      setError(null)
      await regenerateInvitationLink(row.id)
      await loadInvitations()
    } catch (err) {
      console.error('Erreur regeneration invitation:', err)
      setError("Impossible de regenerer le lien d'invitation")
    } finally {
      setRegeneratingId('')
    }
  }

  const sendEmailForRow = async (row) => {
    if (!row?.invitation?.inviteUrl) return

    try {
      setSendingId(row.id)
      setError(null)
      await sendInvitationEmail({
        toEmail: row.email,
        clientName: row.name,
        advisorName: advisor?.name || 'Votre conseiller',
        advisorEmail: advisor?.email || '',
        inviteLink: row.invitation.inviteUrl,
        template
      })
      setTemplateMessage(`Email envoye a ${row.email}`)
      setTimeout(() => setTemplateMessage(''), 1800)
    } catch (err) {
      setError(err.message || "Impossible d'envoyer l'email d'invitation")
    } finally {
      setSendingId('')
    }
  }

  const saveTemplate = async () => {
    try {
      setTemplateSaving(true)
      setError(null)
      setTemplateMessage('')
      const saved = await saveAdvisorEmailTemplate(advisor.id, template)
      setTemplate(saved)
      setTemplateMessage('Template email enregistre')
      setTimeout(() => setTemplateMessage(''), 2200)
    } catch (err) {
      setError(err.message || "Impossible d'enregistrer le template")
    } finally {
      setTemplateSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Liens invitations</h2>
          <p className="text-gray-600">
            {pendingRows.length} invitation{pendingRows.length > 1 ? 's' : ''} active
            {pendingRows.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Template email d'invitation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Objet</label>
            <input
              type="text"
              value={template.subject}
              onChange={(event) => setTemplate((prev) => ({ ...prev, subject: event.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              rows={8}
              value={template.body}
              onChange={(event) => setTemplate((prev) => ({ ...prev, body: event.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-600 mt-2">
              Placeholders disponibles: {'{{client_name}}'}, {'{{advisor_name}}'}, {'{{advisor_email}}'} et{' '}
              <strong>{INVITE_LINK_PLACEHOLDER}</strong> (obligatoire).
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={saveTemplate}
              disabled={templateSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {templateSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer le template
            </button>
            {templateMessage ? <p className="text-sm text-green-700 font-semibold">{templateMessage}</p> : null}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {pendingRows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <Link2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune invitation active</h3>
          <p className="text-gray-600">Invitez un client depuis les pages Apercu ou Mes clients.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Lien</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Questionnaire</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Expire le</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Maj</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{row.name}</p>
                      <p className="text-gray-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <p className="truncate text-gray-700">{row.invitation?.inviteUrl || 'Lien non genere'}</p>
                      {row.invitation?.legacyMode ? (
                        <p className="text-xs text-amber-700 mt-1">
                          Mode compatibilite actif: migration Supabase requise pour une regeneration unique.
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.invitation?.questionnaireName || 'Questionnaire standard'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.invitation?.expiresAt ? formatDate(row.invitation.expiresAt) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.invitation?.updatedAt ? formatDate(row.invitation.updatedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyLink(row)}
                          disabled={!row.invitation?.inviteUrl}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          {copyState === row.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copyState === row.id ? 'Copie' : 'Copier'}
                        </button>
                        <button
                          onClick={() => sendEmailForRow(row)}
                          disabled={sendingId === row.id || !row.invitation?.inviteUrl}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-purple-300 text-purple-700 font-semibold hover:bg-purple-50 transition disabled:opacity-50"
                        >
                          {sendingId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Envoyer mail
                        </button>
                        <button
                          onClick={() => regenerate(row)}
                          disabled={regeneratingId === row.id || row.invitation?.legacyMode}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                        >
                          {regeneratingId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {row.invitation?.legacyMode ? 'Migration requise' : 'Regenerer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
