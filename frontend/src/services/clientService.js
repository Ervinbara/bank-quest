import { supabase } from '@/lib/supabase'

const generateInvitationToken = () => {
  const array = new Uint8Array(16)
  window.crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const normalizeEmail = (email) => (email || '').trim().toLowerCase()
const buildInviteUrl = (clientId, token) => `${window.location.origin}/quiz/${clientId}?token=${token}`
const buildLegacyToken = (clientId) => `legacy-${String(clientId).replaceAll('-', '')}`

const isMissingInvitationsTableError = (error) => {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes("could not find the table 'public.client_invitations'") ||
    message.includes('relation "public.client_invitations" does not exist')
  )
}

const upsertClientInvitation = async (clientId) => {
  const token = generateInvitationToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString() // 14 jours

  const { data, error } = await supabase
    .from('client_invitations')
    .upsert(
      [
        {
          client_id: clientId,
          token,
          expires_at: expiresAt,
          revoked_at: null
        }
      ],
      { onConflict: 'client_id' }
    )
    .select('*')
    .single()

  if (error) {
    if (isMissingInvitationsTableError(error)) {
      const legacyToken = buildLegacyToken(clientId)
      return {
        token: legacyToken,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
        inviteUrl: buildInviteUrl(clientId, legacyToken),
        legacyMode: true
      }
    }
    throw error
  }

  return {
    token: data.token,
    expiresAt: data.expires_at,
    updatedAt: data.updated_at,
    inviteUrl: buildInviteUrl(clientId, data.token),
    legacyMode: false
  }
}

// Récupérer tous les clients d'un conseiller
export const getAdvisorClients = async (advisorId) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_insights (
        id,
        type,
        concept
      )
    `)
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Récupérer les statistiques d'un conseiller
export const getAdvisorStats = async (advisorId) => {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, quiz_status, score, followup_status')
    .eq('advisor_id', advisorId)

  if (error) throw error

  const stats = {
    totalClients: clients.length,
    completed: clients.filter(c => c.quiz_status === 'completed').length,
    pending: clients.filter(c => c.quiz_status === 'pending').length,
    toContact: clients.filter(c => c.followup_status === 'a_contacter').length,
    inProgress: clients.filter(c => ['rdv_planifie', 'en_cours'].includes(c.followup_status)).length,
    closed: clients.filter(c => c.followup_status === 'clos').length,
    avgScore: clients.length > 0
      ? Math.round(
          clients
            .filter(c => c.score !== null)
            .reduce((acc, c) => acc + c.score, 0) / 
          clients.filter(c => c.score !== null).length || 0
        )
      : 0
  }

  return stats
}

// Récupérer un client spécifique avec ses insights
export const getClientById = async (clientId) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      client_insights (
        id,
        type,
        concept
      )
    `)
    .eq('id', clientId)
    .single()

  if (error) throw error
  return data
}

// Mettre a jour les informations d'un client
export const updateClient = async ({ clientId, advisorId, name, email, avatar }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const cleanedName = (name || '').trim()
  const cleanedEmail = normalizeEmail(email)
  const cleanedAvatar = (avatar || '').trim() || '👤'

  if (!cleanedName) throw new Error('Le nom est requis')
  if (!cleanedEmail) throw new Error("L'email est requis")

  const { data: duplicate, error: duplicateError } = await supabase
    .from('clients')
    .select('id')
    .eq('advisor_id', advisorId)
    .eq('email', cleanedEmail)
    .neq('id', clientId)
    .maybeSingle()

  if (duplicateError) throw duplicateError
  if (duplicate) throw new Error('Un autre client utilise deja cet email')

  const { data, error } = await supabase
    .from('clients')
    .update({
      name: cleanedName,
      email: cleanedEmail,
      avatar: cleanedAvatar
    })
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Mettre a jour le suivi commercial du client
export const updateClientFollowup = async ({ clientId, advisorId, followupStatus, advisorNotes, markContacted }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const payload = {}

  if (followupStatus) {
    payload.followup_status = followupStatus
  }

  if (typeof advisorNotes === 'string') {
    payload.advisor_notes = advisorNotes
  }

  if (markContacted) {
    payload.last_contacted_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId)
    .eq('advisor_id', advisorId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Supprimer un client
export const deleteClient = async ({ clientId, advisorId }) => {
  if (!clientId) throw new Error('Client introuvable')
  if (!advisorId) throw new Error('Conseiller introuvable')

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('advisor_id', advisorId)

  if (error) throw error
  return { success: true }
}

// Creer une invitation client (creation en base + token de partage)
export const createClientInvitation = async ({ advisorId, name, email }) => {
  const cleanedName = (name || '').trim()
  const cleanedEmail = normalizeEmail(email)

  if (!advisorId) {
    throw new Error('Conseiller introuvable')
  }

  if (!cleanedName) {
    throw new Error('Le nom du client est requis')
  }

  if (!cleanedEmail) {
    throw new Error("L'email du client est requis")
  }

  const { data: existingClient, error: existingError } = await supabase
    .from('clients')
    .select('id, name, email, quiz_status')
    .eq('advisor_id', advisorId)
    .eq('email', cleanedEmail)
    .maybeSingle()

  if (existingError) throw existingError
  if (existingClient) {
    throw new Error('Un client avec cet email existe deja')
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert([
      {
        advisor_id: advisorId,
        name: cleanedName,
        email: cleanedEmail,
        quiz_status: 'pending'
      }
    ])
    .select('*')
    .single()

  if (error) throw error

  const invitation = await upsertClientInvitation(client.id)

  return {
    client,
    token: invitation.token,
    inviteUrl: invitation.inviteUrl,
    expiresAt: invitation.expiresAt,
    updatedAt: invitation.updatedAt,
    legacyMode: invitation.legacyMode
  }
}

// Lister les liens d'invitation d'un conseiller
export const getAdvisorInvitationLinks = async (advisorId) => {
  if (!advisorId) throw new Error('Conseiller introuvable')

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, email, quiz_status, created_at, completed_at')
    .eq('advisor_id', advisorId)
    .order('created_at', { ascending: false })

  if (clientsError) throw clientsError
  if (!clients || clients.length === 0) return []

  const clientIds = clients.map((client) => client.id)

  const { data: invitations, error: invitationsError } = await supabase
    .from('client_invitations')
    .select('client_id, token, expires_at, revoked_at, updated_at')
    .in('client_id', clientIds)

  if (invitationsError && !isMissingInvitationsTableError(invitationsError)) throw invitationsError

  const invitationByClientId = new Map((invitations || []).map((item) => [item.client_id, item]))
  const useLegacyMode = !!invitationsError && isMissingInvitationsTableError(invitationsError)

  return clients.map((client) => {
    if (useLegacyMode) {
      const legacyToken = buildLegacyToken(client.id)
      return {
        ...client,
        invitation: {
          token: legacyToken,
          expiresAt: null,
          revokedAt: null,
          updatedAt: client.created_at,
          inviteUrl: buildInviteUrl(client.id, legacyToken),
          legacyMode: true
        }
      }
    }

    const invitation = invitationByClientId.get(client.id)

    return {
      ...client,
      invitation: invitation
        ? {
            token: invitation.token,
            expiresAt: invitation.expires_at,
            revokedAt: invitation.revoked_at,
            updatedAt: invitation.updated_at,
            inviteUrl: buildInviteUrl(client.id, invitation.token),
            legacyMode: false
          }
        : null
    }
  })
}

// Regenerer le lien d'invitation d'un client
export const regenerateInvitationLink = async (clientId) => {
  if (!clientId) throw new Error('Client introuvable')
  return upsertClientInvitation(clientId)
}

// Recuperer les informations publiques d'un client pour le quiz avec validation token
export const getQuizClient = async (clientId, token) => {
  if (!token) throw new Error("Lien d'invitation incomplet")

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, email, quiz_status, score, completed_at')
    .eq('id', clientId)
    .single()

  if (clientError) throw clientError

  const { data: invitation, error: invitationError } = await supabase
    .from('client_invitations')
    .select('token, expires_at, revoked_at')
    .eq('client_id', clientId)
    .eq('token', token)
    .maybeSingle()

  if (invitationError) {
    if (isMissingInvitationsTableError(invitationError)) {
      const legacyToken = buildLegacyToken(clientId)
      if (token !== legacyToken) {
        throw new Error("Lien d'invitation invalide")
      }
      return client
    }
    throw invitationError
  }
  if (!invitation) throw new Error("Lien d'invitation invalide")

  if (invitation.revoked_at) {
    throw new Error("Lien d'invitation revoque")
  }

  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new Error("Lien d'invitation expire")
  }

  return client
}

// Soumettre un quiz client (score + insights)
export const submitClientQuizResult = async ({ clientId, score, strengths, weaknesses }) => {
  if (!clientId) throw new Error('Client introuvable')

  const { data: updatedClient, error: updateError } = await supabase
    .from('clients')
    .update({
      quiz_status: 'completed',
      score,
      completed_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select('*')
    .single()

  if (updateError) throw updateError

  const { error: deleteError } = await supabase.from('client_insights').delete().eq('client_id', clientId)
  if (deleteError) throw deleteError

  const insightsPayload = [
    ...(strengths || []).map((concept) => ({
      client_id: clientId,
      type: 'strength',
      concept
    })),
    ...(weaknesses || []).map((concept) => ({
      client_id: clientId,
      type: 'weakness',
      concept
    }))
  ]

  if (insightsPayload.length > 0) {
    const { error: insertError } = await supabase.from('client_insights').insert(insightsPayload)
    if (insertError) throw insertError
  }

  return updatedClient
}

// S'abonner aux changements clients/insights d'un conseiller
export const subscribeToAdvisorClients = (advisorId, onChange) => {
  if (!advisorId || typeof onChange !== 'function') {
    return () => {}
  }

  const channel = supabase
    .channel(`advisor-clients-${advisorId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients', filter: `advisor_id=eq.${advisorId}` },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_insights' },
      () => onChange()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'client_invitations' },
      () => onChange()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

const formatMonthKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

const emptyAnalytics = () => ({
  summary: {
    totalClients: 0,
    completed: 0,
    pending: 0,
    avgScore: 0,
    completionRate: 0
  },
  scoreDistribution: [
    { label: '0-49', min: 0, max: 49, count: 0 },
    { label: '50-74', min: 50, max: 74, count: 0 },
    { label: '75-100', min: 75, max: 100, count: 0 }
  ],
  monthlyEvolution: [],
  pipeline: {
    invited: 0,
    completed: 0,
    rdvPlanifie: 0,
    clos: 0
  },
  segmentation: {
    chaud: 0,
    tiede: 0,
    froid: 0
  },
  priorities: [],
  conceptStats: {
    strengths: [],
    weaknesses: []
  }
})

const daysSince = (dateString) => {
  if (!dateString) return 999
  const diff = Date.now() - new Date(dateString).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const segmentClient = (client) => {
  const score = typeof client.score === 'number' ? client.score : 0
  const status = client.followup_status || 'a_contacter'
  const contactDelay = daysSince(client.last_contacted_at)

  if (status === 'clos' || status === 'rdv_planifie') return 'chaud'
  if (score >= 75 && status !== 'a_contacter') return 'chaud'
  if (score >= 50 || status === 'en_cours' || contactDelay <= 10) return 'tiede'
  return 'froid'
}

const computePriority = (client) => {
  const isCompleted = client.quiz_status === 'completed'
  const score = typeof client.score === 'number' ? client.score : 0
  const status = client.followup_status || 'a_contacter'
  const contactDelay = daysSince(client.last_contacted_at || client.created_at)

  if (status === 'clos') {
    return { value: 0, label: 'Clos', reason: 'Dossier deja clos' }
  }

  let value = 0
  if (status === 'a_contacter') value += 40
  if (status === 'en_cours') value += 25
  if (status === 'rdv_planifie') value += 10
  value += isCompleted ? 25 : 10
  value += Math.min(25, contactDelay)
  value += Math.max(0, Math.floor((80 - score) / 4))

  if (value >= 85) return { value, label: 'Urgent', reason: 'Relance immediate recommandee' }
  if (value >= 60) return { value, label: 'Haute', reason: 'A traiter cette semaine' }
  return { value, label: 'Normale', reason: 'Suivi standard' }
}

// Récupérer les données analytics d'un conseiller
export const getAdvisorAnalytics = async (advisorId) => {
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      email,
      quiz_status,
      followup_status,
      advisor_notes,
      score,
      created_at,
      completed_at,
      last_contacted_at,
      client_insights (
        type,
        concept
      )
    `)
    .eq('advisor_id', advisorId)

  if (error) throw error
  if (!clients || clients.length === 0) return emptyAnalytics()

  const completedClients = clients.filter(
    (client) => client.quiz_status === 'completed' && typeof client.score === 'number'
  )

  const avgScore =
    completedClients.length > 0
      ? Math.round(
          completedClients.reduce((sum, client) => sum + client.score, 0) / completedClients.length
        )
      : 0

  const summary = {
    totalClients: clients.length,
    completed: completedClients.length,
    pending: clients.filter((client) => client.quiz_status !== 'completed').length,
    avgScore,
    completionRate:
      clients.length > 0 ? Math.round((completedClients.length / clients.length) * 100) : 0
  }

  const scoreDistribution = [
    {
      label: '0-49',
      min: 0,
      max: 49,
      count: completedClients.filter((client) => client.score <= 49).length
    },
    {
      label: '50-74',
      min: 50,
      max: 74,
      count: completedClients.filter((client) => client.score >= 50 && client.score <= 74).length
    },
    {
      label: '75-100',
      min: 75,
      max: 100,
      count: completedClients.filter((client) => client.score >= 75).length
    }
  ]

  const now = new Date()
  const monthBuckets = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthBuckets.push(formatMonthKey(d))
  }

  const scoreByMonth = new Map(
    monthBuckets.map((monthKey) => [monthKey, { totalScore: 0, count: 0 }])
  )

  completedClients.forEach((client) => {
    const rawDate = client.completed_at || client.created_at
    if (!rawDate) return

    const monthKey = formatMonthKey(new Date(rawDate))
    if (!scoreByMonth.has(monthKey)) return

    const aggregate = scoreByMonth.get(monthKey)
    aggregate.totalScore += client.score
    aggregate.count += 1
  })

  const monthlyEvolution = monthBuckets.map((monthKey) => {
    const aggregate = scoreByMonth.get(monthKey)
    const averageScore = aggregate.count > 0 ? Math.round(aggregate.totalScore / aggregate.count) : 0

    return {
      monthKey,
      label: formatMonthLabel(monthKey),
      averageScore,
      completedCount: aggregate.count
    }
  })

  const strengthCounts = new Map()
  const weaknessCounts = new Map()

  completedClients.forEach((client) => {
    const insights = client.client_insights || []
    insights.forEach((insight) => {
      if (!insight?.concept || !insight?.type) return

      if (insight.type === 'strength') {
        strengthCounts.set(insight.concept, (strengthCounts.get(insight.concept) || 0) + 1)
      } else if (insight.type === 'weakness') {
        weaknessCounts.set(insight.concept, (weaknessCounts.get(insight.concept) || 0) + 1)
      }
    })
  })

  const toTopList = (counterMap) =>
    [...counterMap.entries()]
      .map(([concept, count]) => ({ concept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

  const conceptStats = {
    strengths: toTopList(strengthCounts),
    weaknesses: toTopList(weaknessCounts)
  }

  const pipeline = {
    invited: clients.length,
    completed: clients.filter((client) => client.quiz_status === 'completed').length,
    rdvPlanifie: clients.filter((client) => client.followup_status === 'rdv_planifie').length,
    clos: clients.filter((client) => client.followup_status === 'clos').length
  }

  const segmentation = clients.reduce(
    (acc, client) => {
      const segment = segmentClient(client)
      acc[segment] += 1
      return acc
    },
    { chaud: 0, tiede: 0, froid: 0 }
  )

  const priorities = clients
    .map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      quizStatus: client.quiz_status,
      followupStatus: client.followup_status || 'a_contacter',
      score: typeof client.score === 'number' ? client.score : null,
      lastContactedAt: client.last_contacted_at,
      createdAt: client.created_at,
      advisorNotes: client.advisor_notes || '',
      priority: computePriority(client)
    }))
    .sort((a, b) => b.priority.value - a.priority.value)

  const topPriorities = priorities
    .filter((client) => client.followupStatus !== 'clos')
    .slice(0, 10)

  return {
    summary,
    scoreDistribution,
    monthlyEvolution,
    pipeline,
    segmentation,
    priorities: topPriorities,
    crmRows: priorities,
    conceptStats
  }
}
