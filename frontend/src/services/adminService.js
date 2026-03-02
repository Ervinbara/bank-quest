import { supabase } from '@/lib/supabase'

const PLAN_MRR = {
  solo: 19,
  pro: 49,
  cabinet: 99
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

function groupClientsByAdvisor(clients) {
  return clients.reduce((acc, client) => {
    const key = client.advisor_id
    if (!acc[key]) {
      acc[key] = {
        total: 0,
        completed: 0,
        scoreSum: 0,
        scoredCount: 0
      }
    }

    acc[key].total += 1
    if (client.quiz_status === 'completed') acc[key].completed += 1
    if (typeof client.score === 'number') {
      acc[key].scoreSum += client.score
      acc[key].scoredCount += 1
    }

    return acc
  }, {})
}

export async function getAdminOverview() {
  const [{ data: advisors, error: advisorsError }, { data: clients, error: clientsError }] =
    await Promise.all([
      supabase
        .from('advisors')
        .select(
          'id, email, name, company, plan, role, subscription_status, cancel_at_period_end, created_at, current_period_end'
        )
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('advisor_id, quiz_status, score')
    ])

  if (advisorsError) throw advisorsError
  if (clientsError) throw clientsError

  const safeAdvisors = advisors || []
  const safeClients = clients || []
  const groupedClients = groupClientsByAdvisor(safeClients)

  const advisorsWithStats = safeAdvisors.map((advisor) => {
    const stats = groupedClients[advisor.id] || { total: 0, completed: 0, scoreSum: 0, scoredCount: 0 }
    const avgScore = stats.scoredCount > 0 ? Math.round(stats.scoreSum / stats.scoredCount) : null

    return {
      ...advisor,
      client_count: stats.total,
      completed_count: stats.completed,
      average_score: avgScore
    }
  })

  const totalAdvisors = safeAdvisors.filter((advisor) => advisor.role !== 'super_admin').length
  const activeSubscriptions = safeAdvisors.filter((advisor) =>
    ACTIVE_SUBSCRIPTION_STATUSES.has(advisor.subscription_status)
  ).length
  const mrr = safeAdvisors.reduce((sum, advisor) => {
    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(advisor.subscription_status)) return sum
    return sum + (PLAN_MRR[advisor.plan] || 0)
  }, 0)

  const completedClients = safeClients.filter((client) => client.quiz_status === 'completed').length
  const completionRate = safeClients.length > 0 ? Math.round((completedClients / safeClients.length) * 100) : 0

  const plans = {
    none: 0,
    solo: 0,
    pro: 0,
    cabinet: 0
  }
  safeAdvisors.forEach((advisor) => {
    if (plans[advisor.plan] !== undefined) plans[advisor.plan] += 1
  })

  return {
    kpis: {
      totalAdvisors,
      activeSubscriptions,
      totalClients: safeClients.length,
      completionRate,
      mrr
    },
    plans,
    advisors: advisorsWithStats
  }
}
