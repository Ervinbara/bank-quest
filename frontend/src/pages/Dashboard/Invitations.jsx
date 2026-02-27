import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAdvisorInvitationLinks,
  regenerateInvitationLink,
  subscribeToAdvisorClients
} from '@/services/clientService'
import { Loader2, Copy, RefreshCw, CheckCircle2, Link2 } from 'lucide-react'

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

  useEffect(() => {
    void loadInvitations()
  }, [loadInvitations])

  useEffect(() => {
    if (!advisor?.id) return undefined
    const unsubscribe = subscribeToAdvisorClients(advisor.id, () => {
      void loadInvitations()
    })
    return unsubscribe
  }, [advisor?.id, loadInvitations])

  const pendingRows = useMemo(
    () => rows.filter((row) => row.quiz_status !== 'completed'),
    [rows]
  )

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
                          onClick={() => regenerate(row)}
                          disabled={regeneratingId === row.id}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-60"
                        >
                          {regeneratingId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Regenerer
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
