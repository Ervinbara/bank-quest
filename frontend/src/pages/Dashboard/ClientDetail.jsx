import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  createClientInvitationForExistingClient,
  deleteClientInvitationLink,
  deleteClient,
  getClientById,
  getClientInvitationLinks,
  updateClient,
  updateClientFollowup
} from '@/services/clientService'
import { getAdvisorQuestionnaires } from '@/services/questionnaireService'
import { getAdvisorEmailTemplate, sendInvitationEmail } from '@/services/invitationEmailService'
import { getPlanAccess } from '@/lib/planAccess'
import { isValidEmail } from '@/services/authService'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  CheckCircle2,
  Copy,
  History,
  Link2,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  PhoneCall,
  Save,
  Send,
  Trash2,
  TrendingUp
} from 'lucide-react'

const FOLLOWUP_OPTIONS = [
  { key: 'a_contacter', label: 'A contacter' },
  { key: 'rdv_planifie', label: 'RDV planifié' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'clos', label: 'Clos' }
]

const FOLLOWUP_LABELS = {
  a_contacter: 'A contacter',
  rdv_planifie: 'RDV planifié',
  en_cours: 'En cours',
  clos: 'Clos'
}

const THEME_LABELS = {
  budget: 'Budget',
  fiscalite: 'Fiscalite',
  epargne: 'Epargne',
  investissement: 'Investissement',
  retraite: 'Retraite',
  protection: 'Protection',
  general: 'General'
}

const canonicalThemeKey = (value) => {
  const text = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (!text) return null
  if (text.includes('budget') || text.includes('depense')) return 'budget'
  if (text.includes('fiscal')) return 'fiscalite'
  if (text.includes('epargne')) return 'epargne'
  if (
    text.includes('invest') ||
    text.includes('risque') ||
    text.includes('portefeuille') ||
    text.includes('patrimoine')
  ) {
    return 'investissement'
  }
  if (text.includes('retraite') || text.includes('projection')) return 'retraite'
  if (
    text.includes('protection') ||
    text.includes('assurance') ||
    text.includes('prevoyance') ||
    text.includes('dette')
  ) {
    return 'protection'
  }
  return 'general'
}

const formatDate = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scoreClass = (score) => {
  if (score >= 75) return 'text-green-600'
  if (score >= 50) return 'text-orange-600'
  return 'text-red-600'
}

export default function ClientDetail() {
  const { advisor } = useAuth()
  const { clientId } = useParams()
  const navigate = useNavigate()
  const planAccess = getPlanAccess(advisor?.plan)

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingFollowup, setUpdatingFollowup] = useState(false)

  const [formData, setFormData] = useState({ name: '', email: '', avatar: '' })
  const [followupData, setFollowupData] = useState({ followupStatus: 'a_contacter', advisorNotes: '' })

  const [questionnaires, setQuestionnaires] = useState([])
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState('')
  const [invitationLinks, setInvitationLinks] = useState([])
  const [invitationLoading, setInvitationLoading] = useState(false)
  const [invitationActionLoading, setInvitationActionLoading] = useState(false)
  const [deletingInvitationId, setDeletingInvitationId] = useState('')
  const [invitationError, setInvitationError] = useState(null)
  const [copySuccessId, setCopySuccessId] = useState(null)
  const [sendingInvitationId, setSendingInvitationId] = useState(null)
  const [emailTemplate, setEmailTemplate] = useState(null)

  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false)
  const [isRelanceCollapsed, setIsRelanceCollapsed] = useState(false)

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
      setError(err.message || 'Impossible de charger le detail du client')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  const loadInvitationContext = useCallback(async () => {
    if (!advisor?.id || !clientId) return
    try {
      setInvitationLoading(true)
      setInvitationError(null)
      const [links, list, template] = await Promise.all([
        getClientInvitationLinks({ advisorId: advisor.id, clientId }),
        getAdvisorQuestionnaires(advisor.id),
        getAdvisorEmailTemplate(advisor.id)
      ])
      setInvitationLinks(links || [])
      setQuestionnaires(list || [])
      const defaultId = (list || []).find((x) => x.is_default)?.id || list?.[0]?.id || ''
      setSelectedQuestionnaireId(defaultId)
      setEmailTemplate(template)
    } catch (err) {
      setInvitationError(err.message || 'Impossible de charger les liens')
    } finally {
      setInvitationLoading(false)
    }
  }, [advisor?.id, clientId])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  useEffect(() => {
    void loadInvitationContext()
  }, [loadInvitationContext])

  const sessions = useMemo(() => {
    const list = client?.quiz_sessions || []
    return [...list].sort(
      (a, b) =>
        new Date(b.completed_at || b.created_at || 0).getTime() -
        new Date(a.completed_at || a.created_at || 0).getTime()
    )
  }, [client?.quiz_sessions])

  const followupDirty = useMemo(() => {
    if (!client) return false
    return (
      (followupData.followupStatus || 'a_contacter') !== (client.followup_status || 'a_contacter') ||
      String(followupData.advisorNotes || '') !== String(client.advisor_notes || '')
    )
  }, [client, followupData.advisorNotes, followupData.followupStatus])

  const profileDirty = useMemo(() => {
    if (!client) return false
    return (
      formData.name.trim() !== String(client.name || '').trim() ||
      formData.email.trim().toLowerCase() !== String(client.email || '').trim().toLowerCase() ||
      String(formData.avatar || '') !== String(client.avatar || '')
    )
  }, [client, formData.avatar, formData.email, formData.name])

  const activeSessionId = selectedSessionId || sessions[0]?.id || null
  const selectedSession = sessions.find((s) => s.id === activeSessionId) || null
  const latestSession = sessions[0] || null

  const latestScore = typeof latestSession?.score === 'number' ? latestSession.score : typeof client?.score === 'number' ? client.score : null
  const progress = client?.quiz_progress || { sessionCount: sessions.length, bestScore: latestScore, progressDelta: null }

  const questionnaireTracking = useMemo(() => {
    const map = new Map()
    sessions.forEach((s) => {
      const key = s.questionnaire_name || 'Questionnaire standard'
      const arr = map.get(key) || []
      arr.push(s)
      map.set(key, arr)
    })
    return [...map.entries()].map(([name, arr]) => {
      const ordered = [...arr].sort(
        (a, b) =>
          new Date(a.completed_at || a.created_at || 0).getTime() -
          new Date(b.completed_at || b.created_at || 0).getTime()
      )
      const scores = ordered.map((x) => x.score).filter((x) => typeof x === 'number')
      const first = scores[0] ?? null
      const last = scores[scores.length - 1] ?? null
      return {
        name,
        count: ordered.length,
        latest: last,
        best: scores.length ? Math.max(...scores) : null,
        avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
        delta: first !== null && last !== null && ordered.length > 1 ? last - first : null
      }
    })
  }, [sessions])

  const questionnaireThemeProgress = useMemo(() => {
    const grouped = new Map()

    const orderedSessions = [...sessions].sort(
      (a, b) =>
        new Date(a.completed_at || a.created_at || 0).getTime() -
        new Date(b.completed_at || b.created_at || 0).getTime()
    )

    orderedSessions.forEach((session) => {
      const answers = Array.isArray(session.question_answers) ? session.question_answers : []
      if (answers.length === 0) return

      const questionnaireName = session.questionnaire_name || 'Questionnaire standard'
      const byTheme = new Map()

      answers.forEach((answer) => {
        const points = Number(answer?.points)
        if (!Number.isFinite(points)) return

        const themeKey =
          canonicalThemeKey(answer?.theme) ||
          canonicalThemeKey(answer?.concept) ||
          canonicalThemeKey(answer?.prompt) ||
          'general'

        const current = byTheme.get(themeKey) || { points: 0, count: 0 }
        current.points += points
        current.count += 1
        byTheme.set(themeKey, current)
      })

      if (byTheme.size === 0) return

      const sessionThemeRows = [...byTheme.entries()].map(([themeKey, values]) => ({
        themeKey,
        score: Math.round((values.points / (values.count * 5)) * 100)
      }))

      const rows = grouped.get(questionnaireName) || []
      rows.push({
        sessionId: session.id,
        completedAt: session.completed_at || session.created_at,
        themes: sessionThemeRows
      })
      grouped.set(questionnaireName, rows)
    })

    return [...grouped.entries()].map(([questionnaireName, sessionsByTheme]) => {
      const themeMap = new Map()

      sessionsByTheme.forEach((sessionRow) => {
        sessionRow.themes.forEach((themeRow) => {
          const list = themeMap.get(themeRow.themeKey) || []
          list.push({
            sessionId: sessionRow.sessionId,
            completedAt: sessionRow.completedAt,
            score: themeRow.score
          })
          themeMap.set(themeRow.themeKey, list)
        })
      })

      const themes = [...themeMap.entries()]
        .map(([themeKey, entries]) => {
          const baseline = entries[0]?.score ?? null
          const latest = entries[entries.length - 1]?.score ?? null
          return {
            themeKey,
            label: THEME_LABELS[themeKey] || themeKey,
            attempts: entries.length,
            baseline,
            latest,
            delta: baseline !== null && latest !== null && entries.length > 1 ? latest - baseline : null,
            points: entries.map((entry) => entry.score)
          }
        })
        .sort((a, b) => b.attempts - a.attempts)

      return {
        questionnaireName,
        sessionsCount: sessionsByTheme.length,
        themes
      }
    })
  }, [sessions])

  const averageScore = sessions.length
    ? Math.round(sessions.map((x) => x.score).filter((x) => typeof x === 'number').reduce((a, b) => a + b, 0) / sessions.length)
    : null

  const sessionDeltaById = useMemo(() => {
    const byId = new Map()
    const ordered = [...sessions].sort(
      (a, b) =>
        new Date(a.completed_at || a.created_at || 0).getTime() -
        new Date(b.completed_at || b.created_at || 0).getTime()
    )

    ordered.forEach((session, index) => {
      if (index === 0) {
        byId.set(session.id, null)
        return
      }
      const previous = ordered[index - 1]
      const delta =
        typeof session.score === 'number' && typeof previous?.score === 'number'
          ? session.score - previous.score
          : null
      byId.set(session.id, delta)
    })

    return byId
  }, [sessions])

  const timelineEvents = useMemo(() => {
    const events = []

    if (client?.created_at) {
      events.push({
        id: `created-${client.id}`,
        type: 'created',
        createdAt: client.created_at,
        title: 'Client cree',
        detail: `${client.name || 'Client'} a ete ajoute au portefeuille.`
      })
    }

    ;(invitationLinks || []).forEach((link, index) => {
      const createdAt = link.createdAt || link.expiresAt
      if (!createdAt) return
      events.push({
        id: `invite-${link.id || link.token || index}`,
        type: 'invitation',
        createdAt,
        title: 'Invitation envoyee',
        detail: `${link.questionnaireName || 'Questionnaire standard'}${link.expiresAt ? ` (expire le ${formatDate(link.expiresAt)})` : ''}`
      })
    })

    sessions.forEach((session) => {
      const createdAt = session.completed_at || session.created_at
      if (!createdAt) return
      const delta = sessionDeltaById.get(session.id)
      events.push({
        id: `quiz-${session.id}`,
        type: 'quiz',
        createdAt,
        title: `Questionnaire complete - ${session.questionnaire_name || 'Questionnaire standard'}`,
        detail:
          typeof session.score === 'number'
            ? `Score ${session.score}/100${typeof delta === 'number' ? ` (${delta >= 0 ? '+' : ''}${delta} pts)` : ''}`
            : 'Résultat enregistré'
      })
    })

    ;(client?.followup_events || []).forEach((event) => {
      if (!event?.created_at) return
      const statusLabel = event.followup_status ? FOLLOWUP_LABELS[event.followup_status] || event.followup_status : null
      const note = typeof event.advisor_notes === 'string' ? event.advisor_notes.trim() : ''
      events.push({
        id: `followup-${event.id}`,
        type: 'followup',
        createdAt: event.created_at,
        title: statusLabel ? `Suivi mis a jour - ${statusLabel}` : 'Suivi mis a jour',
        detail: note ? (note.length > 140 ? `${note.slice(0, 140)}...` : note) : 'Mise a jour du suivi client.'
      })
    })

    if ((client?.followup_events || []).length === 0) {
      if (client?.last_contacted_at) {
        events.push({
          id: `fallback-contact-${client.id}`,
          type: 'followup',
          createdAt: client.last_contacted_at,
          title: 'Contact client',
          detail: 'Dernier contact enregistré.'
        })
      }
      if (client?.advisor_notes) {
        const note = String(client.advisor_notes || '').trim()
        events.push({
          id: `fallback-note-${client.id}`,
          type: 'followup',
          createdAt: client.updated_at || client.created_at,
          title: 'Note conseiller',
          detail: note.length > 140 ? `${note.slice(0, 140)}...` : note
        })
      }
    }

    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [client, invitationLinks, sessionDeltaById, sessions])

  const handleSave = async () => {
    if (!client?.id || !advisor?.id) return
    if (!profileDirty) return
    if (!formData.name.trim()) return setError('Le nom est requis')
    if (!isValidEmail(formData.email)) return setError('Email invalide')
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage('')
      const updated = await updateClient({ clientId: client.id, advisorId: advisor.id, name: formData.name, email: formData.email, avatar: formData.avatar })
      setClient((prev) => ({
        ...prev,
        ...updated,
        quiz_sessions: updated?.quiz_sessions || prev?.quiz_sessions || [],
        quiz_progress: updated?.quiz_progress || prev?.quiz_progress || null,
        followup_events: updated?.followup_events || prev?.followup_events || []
      }))
      setEditing(false)
      setSuccessMessage('Fiche client enregistrée')
      setTimeout(() => setSuccessMessage(''), 2200)
    } catch (err) {
      setError(err.message || 'Impossible de mettre a jour le client')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFollowup = async (markContacted = false) => {
    if (!client?.id || !advisor?.id) return
    if (!followupDirty && !markContacted) return
    try {
      setUpdatingFollowup(true)
      setError(null)
      setSuccessMessage('')
      const updated = await updateClientFollowup({
        clientId: client.id,
        advisorId: advisor.id,
        followupStatus: followupData.followupStatus,
        advisorNotes: followupData.advisorNotes,
        markContacted
      })
      setClient((prev) => ({
        ...prev,
        ...updated,
        quiz_sessions: updated?.quiz_sessions || prev?.quiz_sessions || [],
        quiz_progress: updated?.quiz_progress || prev?.quiz_progress || null,
        followup_events: updated?.followup_events || prev?.followup_events || []
      }))
      setFollowupData({
        followupStatus: updated?.followup_status || followupData.followupStatus || 'a_contacter',
        advisorNotes: updated?.advisor_notes || ''
      })
      setSuccessMessage(markContacted ? 'Contact enregistré' : 'Suivi client enregistré')
      setTimeout(() => setSuccessMessage(''), 2200)
    } catch (err) {
      setError(err.message || 'Impossible de mettre a jour le suivi')
    } finally {
      setUpdatingFollowup(false)
    }
  }

  const handleDelete = async () => {
    if (!client?.id || !advisor?.id) return
    if (!window.confirm(`Supprimer definitivement le client "${client.name}" ?`)) return
    try {
      setDeleting(true)
      await deleteClient({ clientId: client.id, advisorId: advisor.id })
      navigate('/dashboard/clients', { replace: true })
    } catch (err) {
      setError(err.message || 'Impossible de supprimer le client')
    } finally {
      setDeleting(false)
    }
  }

  const handleGenerateInvitation = async () => {
    if (!advisor?.id || !client?.id) return
    try {
      setInvitationActionLoading(true)
      setInvitationError(null)
      const generated = await createClientInvitationForExistingClient({
        advisorId: advisor.id,
        clientId: client.id,
        questionnaireId: selectedQuestionnaireId || null
      })
      setInvitationLinks((prev) => [generated, ...(prev || []).filter((x) => x.token !== generated.token)])
    } catch (err) {
      setInvitationError(err.message || 'Impossible de generer le lien')
    } finally {
      setInvitationActionLoading(false)
    }
  }

  const handleCopyInvitationLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.inviteUrl)
      setCopySuccessId(link.id || link.token)
      setTimeout(() => setCopySuccessId(null), 1500)
    } catch {
      setInvitationError('Impossible de copier le lien')
    }
  }

  const handleSendInvitationEmail = async (link) => {
    if (!planAccess.canSendInvitationEmails) return
    try {
      setSendingInvitationId(link.id || link.token)
      await sendInvitationEmail({
        toEmail: client.email,
        clientName: client.name,
        advisorName: advisor?.name || 'Votre conseiller',
        advisorEmail: advisor?.email || '',
        inviteLink: link.inviteUrl,
        template: emailTemplate || undefined
      })
    } catch (err) {
      setInvitationError(err.message || "Impossible d'envoyer l'email")
    } finally {
      setSendingInvitationId(null)
    }
  }

  const handleDeleteInvitationLink = async (link) => {
    if (!advisor?.id || !client?.id) return
    const confirmed = window.confirm('Supprimer ce lien invitation pour ce client ?')
    if (!confirmed) return

    try {
      setDeletingInvitationId(link.id || link.token)
      setInvitationError(null)
      await deleteClientInvitationLink({
        advisorId: advisor.id,
        clientId: client.id,
        linkId: link.id || null,
        token: link.token || null
      })
      setInvitationLinks((prev) => (prev || []).filter((item) => (item.id || item.token) !== (link.id || link.token)))
    } catch (err) {
      setInvitationError(err.message || 'Impossible de supprimer le lien')
    } finally {
      setDeletingInvitationId('')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-emerald-700" /></div>
  if (!client) return <div className="text-sm text-red-700">Client introuvable</div>

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link to="/dashboard/clients" className="inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold hover:text-emerald-900 mb-2"><ArrowLeft className="w-4 h-4" />Retour aux clients</Link>
          <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
          <p className="text-gray-600">Fiche detail client</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
          <button onClick={() => setEditing((x) => !x)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"><Pencil className="w-4 h-4" />{editing ? 'Annuler' : 'Modifier'}</button>
          <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Supprimer</button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {successMessage ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</div> : null}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden min-w-0">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-5 sm:p-6">
          <h3 className="text-2xl font-bold">{client.name}</h3>
          <div className="flex items-start gap-2 text-emerald-100 min-w-0"><Mail className="w-4 h-4 mt-0.5 shrink-0" /><span className="break-all">{client.email}</span></div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {editing ? (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="px-3 py-2 border rounded-lg" />
              <input name="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="px-3 py-2 border rounded-lg" />
              <div className="flex justify-end"><button onClick={handleSave} disabled={saving || !profileDirty} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{profileDirty ? 'Enregistrer' : 'Aucune modification'}</button></div>
            </div>
          ) : null}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={followupData.followupStatus} onChange={(e) => setFollowupData((p) => ({ ...p, followupStatus: e.target.value }))} className="px-3 py-2 rounded-lg border">
                {FOLLOWUP_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <p className="text-sm text-blue-900">{client.last_contacted_at ? `Dernier contact: ${formatDate(client.last_contacted_at)}` : 'Aucun contact enregistré'}</p>
            </div>
            <textarea rows={3} value={followupData.advisorNotes} onChange={(e) => setFollowupData((p) => ({ ...p, advisorNotes: e.target.value }))} className="mt-3 w-full px-3 py-2 rounded-lg border" placeholder="Notes conseiller" />
            <div className="mt-2 text-xs font-semibold text-slate-600">
              {followupDirty ? 'Modifications non enregistrées' : 'Suivi à jour'}
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onClick={() => void handleSaveFollowup(false)} disabled={updatingFollowup || !followupDirty} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border font-semibold text-blue-800 disabled:opacity-50"><Save className="w-4 h-4" />Sauvegarder suivi</button>
              <button onClick={() => void handleSaveFollowup(true)} disabled={updatingFollowup} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60"><PhoneCall className="w-4 h-4" />Marquer comme contacte</button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Score global</p>
              <p className={`text-5xl font-bold ${latestScore !== null ? scoreClass(latestScore) : 'text-gray-400'}`}>{latestScore !== null ? `${latestScore}/100` : 'N/A'}</p>
              {latestSession?.questionnaire_name ? (
                <p className="text-xs text-gray-600 mt-1">Questionnaire: {latestSession.questionnaire_name}</p>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-gray-500">Questionnaires completes</p><p className="font-bold">{progress.sessionCount || 0}</p></div>
              <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-gray-500">Score moyen global</p><p className="font-bold">{averageScore !== null ? `${averageScore}/100` : 'N/A'}</p></div>
              <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-gray-500">Meilleur score global</p><p className="font-bold">{typeof progress.bestScore === 'number' ? `${progress.bestScore}/100` : 'N/A'}</p></div>
              <div className="rounded-lg border bg-white px-3 py-2"><p className="text-xs text-gray-500">Progression globale</p><p className={`font-bold ${typeof progress.progressDelta === 'number' ? (progress.progressDelta >= 0 ? 'text-green-700' : 'text-red-700') : ''}`}>{typeof progress.progressDelta === 'number' ? `${progress.progressDelta >= 0 ? '+' : ''}${progress.progressDelta} pts` : 'N/A'}</p></div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 min-w-0">
                <History className="w-5 h-5 text-slate-700" />
                <h4 className="font-bold">Timeline client (RDV, questionnaires, notes, evolution score)</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTimelineCollapsed((prev) => !prev)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
              >
                <ChevronDown className={`w-4 h-4 fm-chevron ${isTimelineCollapsed ? '' : 'fm-chevron-open'}`} />
                {isTimelineCollapsed ? 'Deplier' : 'Plier'}
              </button>
            </div>
            {!isTimelineCollapsed && timelineEvents.length === 0 ? (
              <p className="text-sm text-gray-600">Aucun evenement disponible pour le moment.</p>
            ) : null}
            {!isTimelineCollapsed ? (
              <div className="space-y-2">
                {timelineEvents.map((event) => {
                  const isQuiz = event.type === 'quiz'
                  const isFollowup = event.type === 'followup'
                  const isInvitation = event.type === 'invitation'

                  return (
                    <div key={event.id} className="rounded-lg border bg-gray-50 px-3 py-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {isQuiz ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                          ) : isFollowup ? (
                            <Phone className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                          ) : isInvitation ? (
                            <Mail className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{event.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{event.detail}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(event.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h4 className="font-bold mb-3">Synthese par questionnaire</h4>
            {questionnaireTracking.length === 0 ? <p className="text-sm text-gray-600">Aucun tracking disponible pour le moment.</p> : questionnaireTracking.map((item) => (
              <div key={item.name} className="rounded-lg border bg-gray-50 px-3 py-2 grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm">Nb: {item.count}</p>
                <p className="text-sm">Dernier: {item.latest !== null ? `${item.latest}/100` : 'N/A'}</p>
                <p className="text-sm">Meilleur: {item.best !== null ? `${item.best}/100` : 'N/A'}</p>
                <p className="text-sm">Moyenne: {item.avg !== null ? `${item.avg}/100` : 'N/A'}</p>
                <p className={`text-sm font-semibold ${item.delta === null ? '' : item.delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>Delta: {item.delta === null ? 'N/A' : `${item.delta >= 0 ? '+' : ''}${item.delta} pts`}</p>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h4 className="font-bold text-indigo-900">Relancer avec un questionnaire</h4>
              <button
                type="button"
                onClick={() => setIsRelanceCollapsed((prev) => !prev)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 self-start sm:self-auto"
              >
                <ChevronDown className={`w-4 h-4 fm-chevron ${isRelanceCollapsed ? '' : 'fm-chevron-open'}`} />
                {isRelanceCollapsed ? 'Deplier' : 'Plier'}
              </button>
            </div>
            {!isRelanceCollapsed ? (
              <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={selectedQuestionnaireId} onChange={(e) => setSelectedQuestionnaireId(e.target.value)} className="md:col-span-2 px-3 py-2 rounded-lg border bg-white">
                {questionnaires.length === 0 ? <option value="">Questionnaire standard</option> : null}
                {questionnaires.map((q) => <option key={q.id} value={q.id}>{q.name}{q.is_default ? ' (Par defaut)' : ''}</option>)}
              </select>
              <button onClick={() => void handleGenerateInvitation()} disabled={invitationActionLoading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">{invitationActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}Generer un lien</button>
            </div>
            {invitationError ? <p className="text-sm text-red-700 mt-2">{invitationError}</p> : null}
            {invitationLoading ? <p className="text-sm text-indigo-900 mt-2">Chargement des liens...</p> : null}
            <div className="mt-3 space-y-2">
              {invitationLinks.map((link) => (
                <div key={link.id || link.token} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{link.questionnaireName || 'Questionnaire standard'}</p>
                    <p className="text-xs text-gray-600">{link.createdAt ? formatDate(link.createdAt) : 'Date inconnue'}{link.expiresAt ? ` • expire le ${formatDate(link.expiresAt)}` : ''}</p>
                    <p className="text-xs text-gray-600 break-all">{link.inviteUrl}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
                    <button onClick={() => void handleCopyInvitationLink(link)} className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold"><Copy className="w-4 h-4" />{copySuccessId === (link.id || link.token) ? 'Copie' : 'Copier'}</button>
                    <button onClick={() => void handleSendInvitationEmail(link)} disabled={!planAccess.canSendInvitationEmails || sendingInvitationId === (link.id || link.token)} className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60">{sendingInvitationId === (link.id || link.token) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Envoyer</button>
                    <button
                      onClick={() => void handleDeleteInvitationLink(link)}
                      disabled={deletingInvitationId === (link.id || link.token)}
                      className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingInvitationId === (link.id || link.token) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
              </>
            ) : null}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <h4 className="font-bold">Comparaison avant/apres par questionnaire</h4>
            </div>
            {questionnaireThemeProgress.length === 0 ? (
              <p className="text-sm text-gray-600">Aucune progression par theme disponible pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {questionnaireThemeProgress.map((item) => (
                  <div key={item.questionnaireName} className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-semibold text-gray-900">{item.questionnaireName}</p>
                      <p className="text-xs text-gray-600">{item.sessionsCount} session{item.sessionsCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="space-y-2">
                      {item.themes.map((theme) => (
                        <div key={`${item.questionnaireName}-${theme.themeKey}`} className="rounded-md border bg-white p-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-gray-800">{theme.label}</span>
                            <span className={`font-semibold ${theme.delta === null ? 'text-gray-600' : theme.delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              {theme.baseline ?? 'N/A'}% {'->'} {theme.latest ?? 'N/A'}%
                              {theme.delta !== null ? ` (${theme.delta >= 0 ? '+' : ''}${theme.delta} pts)` : ''}
                            </span>
                          </div>
                          <div className="mt-2 flex items-end gap-1 h-10">
                            {theme.points.map((point, idx) => (
                              <div
                                key={`${item.questionnaireName}-${theme.themeKey}-${idx}`}
                                className="flex-1 rounded-sm bg-emerald-400/70"
                                style={{ height: `${Math.max(8, point)}%` }}
                                title={`${point}/100`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><History className="w-5 h-5 text-indigo-700" /><h4 className="font-bold">Parcours questionnaires remplis</h4></div>
            {sessions.length === 0 ? <p className="text-sm text-gray-600">Aucun historique de questionnaire disponible.</p> : (
              <div className="space-y-2">
                {sessions.map((s, index) => {
                  const prev = typeof sessions[index + 1]?.score === 'number' ? sessions[index + 1].score : null
                  const delta = prev !== null && typeof s.score === 'number' ? s.score - prev : null
                  return (
                    <button key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`w-full text-left rounded-lg border px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${activeSessionId === s.id ? 'border-indigo-400 bg-indigo-50' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="min-w-0">
                        <p className="font-semibold">{s.questionnaire_name || 'Questionnaire standard'}</p>
                        <p className="text-xs text-gray-600">{formatDate(s.completed_at || s.created_at)}</p>
                      </div>
                      <div className="text-sm flex items-center gap-2 self-start sm:self-auto">
                        <span className={`font-bold ${scoreClass(s.score || 0)}`}>{s.score}/100</span>
                        {delta !== null ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{delta >= 0 ? '+' : ''}{delta} pts</span> : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h4 className="font-bold mb-3">Reponses du questionnaire selectionne</h4>
            {!selectedSession ? <p className="text-sm text-gray-600">Aucune tentative selectionnee.</p> : (
              <>
                <div className="rounded-lg border bg-gray-50 px-3 py-2 mb-3">
                  <p className="font-semibold">{selectedSession.questionnaire_name || 'Questionnaire standard'}</p>
                  <p className="text-xs text-gray-600">{formatDate(selectedSession.completed_at || selectedSession.created_at)} • {selectedSession.score}/100</p>
                </div>
                {Array.isArray(selectedSession.question_answers) && selectedSession.question_answers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSession.question_answers.map((answer, index) => (
                      <div key={`${selectedSession.id}-${index}`} className="rounded-lg border bg-gray-50 p-3">
                        <p className="font-semibold text-sm">{index + 1}. {answer.prompt || answer.concept || 'Question'}</p>
                        <p className="text-xs text-gray-600 mt-1">{answer.concept || 'General'}</p>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          <span>{answer.answerLabel || 'Reponse non disponible'}</span>
                          <span className="font-semibold text-indigo-700">{typeof answer.points === 'number' ? `${answer.points}/5` : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Le detail question par question n est pas disponible pour cette tentative (ancienne version).</p>
                )}
              </>
            )}
          </div>

          <div className="text-sm text-gray-600 flex items-center gap-2"><Calendar className="w-4 h-4" />Cree le {formatDate(client.created_at)}</div>
        </div>
      </div>
    </div>
  )
}
