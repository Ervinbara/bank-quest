import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  createClientInvitationForExistingClient,
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
  Copy,
  History,
  Link2,
  Loader2,
  Mail,
  Pencil,
  PhoneCall,
  Save,
  Send,
  Trash2,
  TrendingUp
} from 'lucide-react'

const FOLLOWUP_OPTIONS = [
  { key: 'a_contacter', label: 'A contacter' },
  { key: 'rdv_planifie', label: 'RDV planifie' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'clos', label: 'Clos' }
]

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
  const [invitationError, setInvitationError] = useState(null)
  const [copySuccessId, setCopySuccessId] = useState(null)
  const [sendingInvitationId, setSendingInvitationId] = useState(null)
  const [emailTemplate, setEmailTemplate] = useState(null)

  const [selectedSessionId, setSelectedSessionId] = useState(null)

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

  const averageScore = sessions.length
    ? Math.round(sessions.map((x) => x.score).filter((x) => typeof x === 'number').reduce((a, b) => a + b, 0) / sessions.length)
    : null

  const handleSave = async () => {
    if (!client?.id || !advisor?.id) return
    if (!formData.name.trim()) return setError('Le nom est requis')
    if (!isValidEmail(formData.email)) return setError('Email invalide')
    try {
      setSaving(true)
      setError(null)
      const updated = await updateClient({ clientId: client.id, advisorId: advisor.id, name: formData.name, email: formData.email, avatar: formData.avatar })
      setClient((prev) => ({
        ...prev,
        ...updated,
        quiz_sessions: updated?.quiz_sessions || prev?.quiz_sessions || [],
        quiz_progress: updated?.quiz_progress || prev?.quiz_progress || null
      }))
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
        quiz_progress: updated?.quiz_progress || prev?.quiz_progress || null
      }))
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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-10 h-10 animate-spin text-emerald-700" /></div>
  if (!client) return <div className="text-sm text-red-700">Client introuvable</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/dashboard/clients" className="inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold hover:text-emerald-900 mb-2"><ArrowLeft className="w-4 h-4" />Retour aux clients</Link>
          <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
          <p className="text-gray-600">Fiche detail client</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((x) => !x)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"><Pencil className="w-4 h-4" />{editing ? 'Annuler' : 'Modifier'}</button>
          <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}Supprimer</button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-6">
          <h3 className="text-2xl font-bold">{client.name}</h3>
          <div className="flex items-center gap-2 text-emerald-100"><Mail className="w-4 h-4" /><span>{client.email}</span></div>
        </div>

        <div className="p-6 space-y-6">
          {editing ? (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input name="name" value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="px-3 py-2 border rounded-lg" />
              <input name="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="px-3 py-2 border rounded-lg" />
              <div className="flex justify-end"><button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Enregistrer</button></div>
            </div>
          ) : null}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={followupData.followupStatus} onChange={(e) => setFollowupData((p) => ({ ...p, followupStatus: e.target.value }))} className="px-3 py-2 rounded-lg border">
                {FOLLOWUP_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
              <p className="text-sm text-blue-900">{client.last_contacted_at ? `Dernier contact: ${formatDate(client.last_contacted_at)}` : 'Aucun contact enregistre'}</p>
            </div>
            <textarea rows={3} value={followupData.advisorNotes} onChange={(e) => setFollowupData((p) => ({ ...p, advisorNotes: e.target.value }))} className="mt-3 w-full px-3 py-2 rounded-lg border" placeholder="Notes conseiller" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => void handleSaveFollowup(false)} disabled={updatingFollowup} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-blue-800"><Save className="w-4 h-4" />Sauvegarder suivi</button>
              <button onClick={() => void handleSaveFollowup(true)} disabled={updatingFollowup} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold"><PhoneCall className="w-4 h-4" />Marquer comme contacte</button>
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
            <h4 className="font-bold text-indigo-900 mb-3">Relancer avec un questionnaire</h4>
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
                  <div className="flex gap-2">
                    <button onClick={() => void handleCopyInvitationLink(link)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold"><Copy className="w-4 h-4" />{copySuccessId === (link.id || link.token) ? 'Copie' : 'Copier'}</button>
                    <button onClick={() => void handleSendInvitationEmail(link)} disabled={!planAccess.canSendInvitationEmails || sendingInvitationId === (link.id || link.token)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60">{sendingInvitationId === (link.id || link.token) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Envoyer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><History className="w-5 h-5 text-indigo-700" /><h4 className="font-bold">Parcours questionnaires remplis</h4></div>
            {sessions.length === 0 ? <p className="text-sm text-gray-600">Aucun historique de questionnaire disponible.</p> : (
              <div className="space-y-2">
                {sessions.map((s, index) => {
                  const prev = typeof sessions[index + 1]?.score === 'number' ? sessions[index + 1].score : null
                  const delta = prev !== null && typeof s.score === 'number' ? s.score - prev : null
                  return (
                    <button key={s.id} onClick={() => setSelectedSessionId(s.id)} className={`w-full text-left rounded-lg border px-3 py-2 flex items-center justify-between ${activeSessionId === s.id ? 'border-indigo-400 bg-indigo-50' : 'bg-gray-50 border-gray-200'}`}>
                      <div>
                        <p className="font-semibold">{s.questionnaire_name || 'Questionnaire standard'}</p>
                        <p className="text-xs text-gray-600">{formatDate(s.completed_at || s.created_at)}</p>
                      </div>
                      <div className="text-sm flex items-center gap-2">
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
