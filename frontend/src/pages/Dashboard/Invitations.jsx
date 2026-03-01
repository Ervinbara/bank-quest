import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import PaginationControls from '@/components/common/PaginationControls'
import { dashboardGuides } from '@/data/dashboardGuides'
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
import { Loader2, Copy, RefreshCw, CheckCircle2, Link2, Send, Save, Search } from 'lucide-react'

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
  const { tr, language } = useLanguage()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copyState, setCopyState] = useState('')
  const [regeneratingId, setRegeneratingId] = useState('')
  const [sendingId, setSendingId] = useState('')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateMessage, setTemplateMessage] = useState('')
  const [template, setTemplate] = useState(DEFAULT_EMAIL_TEMPLATE)
  const [searchTerm, setSearchTerm] = useState('')
  const [quizFilter, setQuizFilter] = useState('pending')
  const [linkFilter, setLinkFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const loadInvitations = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getAdvisorInvitationLinks(advisor.id)
      setRows(data || [])
    } catch (err) {
      console.error('Erreur chargement invitations:', err)
      setError(tr('Impossible de charger les liens invitations', 'Unable to load invitation links'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

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

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const isCompleted = row.quiz_status === 'completed'
      const hasLink = Boolean(row.invitation?.inviteUrl)

      const quizOk =
        quizFilter === 'all'
          ? true
          : quizFilter === 'pending'
            ? !isCompleted
            : isCompleted

      const linkOk =
        linkFilter === 'all'
          ? true
          : linkFilter === 'with_link'
            ? hasLink
            : !hasLink

      if (!quizOk || !linkOk) return false
      if (!normalizedSearch) return true

      const name = String(row.name || '').toLowerCase()
      const email = String(row.email || '').toLowerCase()
      return name.includes(normalizedSearch) || email.includes(normalizedSearch)
    })
  }, [rows, searchTerm, quizFilter, linkFilter])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, quizFilter, linkFilter])

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const copyLink = async (row) => {
    if (!row?.invitation?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(row.invitation.inviteUrl)
      setCopyState(row.id)
      setTimeout(() => setCopyState(''), 1500)
    } catch {
      setError(tr("Impossible de copier le lien dans le presse-papiers", 'Unable to copy link to clipboard'))
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
      setError(tr("Impossible de regenerer le lien d'invitation", 'Unable to regenerate invitation link'))
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
        advisorName: advisor?.name || tr('Votre conseiller', 'Your advisor'),
        advisorEmail: advisor?.email || '',
        inviteLink: row.invitation.inviteUrl,
        template
      })
      setTemplateMessage(
        language === 'fr' ? `Email envoye a ${row.email}` : `Email sent to ${row.email}`
      )
      setTimeout(() => setTemplateMessage(''), 1800)
    } catch (err) {
      setError(err.message || tr("Impossible d'envoyer l'email d'invitation", 'Unable to send invitation email'))
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
      setTemplateMessage(tr('Template email enregistre', 'Email template saved'))
      setTimeout(() => setTemplateMessage(''), 2200)
    } catch (err) {
      setError(err.message || tr("Impossible d'enregistrer le template", 'Unable to save template'))
    } finally {
      setTemplateSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des invitations...', 'Loading invitations...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{tr('Liens invitations', 'Invitation links')}</h2>
          <p className="text-gray-600">
            {language === 'fr'
              ? `${filteredRows.length} invitation${filteredRows.length > 1 ? 's' : ''} affichee${filteredRows.length > 1 ? 's' : ''}`
              : `${filteredRows.length} invitation${filteredRows.length > 1 ? 's' : ''} shown`}
          </p>
        </div>
        <DashboardGuide guide={dashboardGuides.invitations} />
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={tr('Rechercher client/email...', 'Search client/email...')}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={quizFilter}
            onChange={(event) => setQuizFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="pending">{tr('Quiz en attente', 'Pending quiz')}</option>
            <option value="completed">{tr('Quiz completes', 'Completed quiz')}</option>
            <option value="all">{tr('Tous les quiz', 'All quiz statuses')}</option>
          </select>
          <select
            value={linkFilter}
            onChange={(event) => setLinkFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="all">{tr('Avec et sans lien', 'With and without link')}</option>
            <option value="with_link">{tr('Lien disponible', 'Link available')}</option>
            <option value="without_link">{tr('Sans lien', 'No link')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{tr("Template email d'invitation", 'Invitation email template')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('Objet', 'Subject')}</label>
            <input
              type="text"
              value={template.subject}
              onChange={(event) => setTemplate((prev) => ({ ...prev, subject: event.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{tr('Message', 'Message')}</label>
            <textarea
              rows={8}
              value={template.body}
              onChange={(event) => setTemplate((prev) => ({ ...prev, body: event.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <p className="text-xs text-gray-600 mt-2">
              {tr('Placeholders disponibles', 'Available placeholders')}: {'{{client_name}}'}, {'{{advisor_name}}'}, {'{{advisor_email}}'} {tr('et', 'and')}{' '}
              <strong>{INVITE_LINK_PLACEHOLDER}</strong> ({tr('obligatoire', 'required')}).
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={saveTemplate}
              disabled={templateSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {templateSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {tr('Enregistrer le template', 'Save template')}
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

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <Link2 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">{tr('Aucun resultat', 'No results')}</h3>
          <p className="text-gray-600">{tr('Ajustez vos filtres ou ajoutez de nouveaux clients.', 'Adjust your filters or add new clients.')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{tr('Client', 'Client')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{tr('Lien', 'Link')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{tr('Questionnaire', 'Questionnaire')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{tr('Expire le', 'Expires')}</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">{tr('Maj', 'Updated')}</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">{tr('Actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{row.name}</p>
                        <p className="text-gray-500">{row.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="truncate text-gray-700">{row.invitation?.inviteUrl || tr('Lien non genere', 'Link not generated')}</p>
                        {row.invitation?.legacyMode ? (
                          <p className="text-xs text-amber-700 mt-1">
                            {tr('Mode compatibilite actif: migration Supabase requise pour une regeneration unique.', 'Compatibility mode enabled: Supabase migration required for unique regeneration.')}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.invitation?.questionnaireName || tr('Questionnaire standard', 'Standard questionnaire')}
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
                            {copyState === row.id ? tr('Copie', 'Copied') : tr('Copier', 'Copy')}
                          </button>
                          <button
                            onClick={() => sendEmailForRow(row)}
                            disabled={sendingId === row.id || !row.invitation?.inviteUrl}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-emerald-300 text-emerald-700 font-semibold hover:bg-emerald-50 transition disabled:opacity-50"
                          >
                            {sendingId === row.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            {tr('Envoyer mail', 'Send email')}
                          </button>
                          <button
                            onClick={() => regenerate(row)}
                            disabled={regeneratingId === row.id || row.invitation?.legacyMode}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                          >
                            {regeneratingId === row.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            {row.invitation?.legacyMode ? tr('Migration requise', 'Migration required') : tr('Regenerer', 'Regenerate')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={filteredRows.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value)
              setPage(1)
            }}
            pageSizeOptions={[5, 10, 20, 30]}
            labels={{
              itemsPerPage: tr('Par page', 'Per page'),
              showing: tr('Affichage', 'Showing'),
              of: tr('sur', 'of'),
              prev: tr('Precedent', 'Previous'),
              next: tr('Suivant', 'Next'),
              page: tr('Page', 'Page')
            }}
          />
        </div>
      )}
    </div>
  )
}


