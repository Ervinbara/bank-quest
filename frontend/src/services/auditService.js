import { supabase } from '@/lib/supabase'

const ALLOWED_SEVERITIES = new Set(['info', 'warning', 'error'])

const cleanMetadata = (value) => {
  if (!value || typeof value !== 'object') return {}
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return {}
  }
}

export const logAdvisorEvent = async (action, options = {}) => {
  if (!action) return

  const category = options.category || 'general'
  const severity = ALLOWED_SEVERITIES.has(options.severity) ? options.severity : 'info'
  const metadata = cleanMetadata(options.metadata)

  try {
    const { error } = await supabase.rpc('log_advisor_event', {
      p_action: action,
      p_category: category,
      p_severity: severity,
      p_metadata: metadata
    })
    if (error) throw error
  } catch (error) {
    console.warn('Unable to log advisor event:', error?.message || error)
  }
}

export const getAdvisorAuditLogs = async (limit = 50) => {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50))
  const { data, error } = await supabase
    .from('advisor_audit_logs')
    .select('id, action, category, severity, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) throw error
  return data || []
}
