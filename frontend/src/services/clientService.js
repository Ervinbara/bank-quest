import { supabase } from '@/lib/supabase'

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
    .select('id, quiz_status, score')
    .eq('advisor_id', advisorId)

  if (error) throw error

  const stats = {
    totalClients: clients.length,
    completed: clients.filter(c => c.quiz_status === 'completed').length,
    pending: clients.filter(c => c.quiz_status === 'pending').length,
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
  conceptStats: {
    strengths: [],
    weaknesses: []
  }
})

// Récupérer les données analytics d'un conseiller
export const getAdvisorAnalytics = async (advisorId) => {
  const { data: clients, error } = await supabase
    .from('clients')
    .select(`
      id,
      quiz_status,
      score,
      created_at,
      completed_at,
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

  return {
    summary,
    scoreDistribution,
    monthlyEvolution,
    conceptStats
  }
}
