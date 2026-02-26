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