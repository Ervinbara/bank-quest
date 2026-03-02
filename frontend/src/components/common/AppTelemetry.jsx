import { useEffect, useRef } from 'react'
import { logAdvisorEvent } from '@/services/auditService'

const MAX_EVENTS_PER_MINUTE = 10

export default function AppTelemetry() {
  const telemetryWindow = useRef({ count: 0, startedAt: Date.now() })

  useEffect(() => {
    const canSend = () => {
      const now = Date.now()
      if (now - telemetryWindow.current.startedAt > 60000) {
        telemetryWindow.current = { count: 0, startedAt: now }
      }
      if (telemetryWindow.current.count >= MAX_EVENTS_PER_MINUTE) return false
      telemetryWindow.current.count += 1
      return true
    }

    const sendError = (payload) => {
      if (!canSend()) return
      void logAdvisorEvent('frontend_runtime_error', {
        category: 'monitoring',
        severity: 'error',
        metadata: payload
      })
    }

    const onError = (event) => {
      sendError({
        kind: 'error',
        message: event.message || 'Unknown frontend error',
        source: event.filename || null,
        line: event.lineno || null,
        column: event.colno || null
      })
    }

    const onUnhandledRejection = (event) => {
      const reason = event.reason
      sendError({
        kind: 'unhandledrejection',
        message:
          typeof reason === 'string'
            ? reason
            : reason?.message || 'Unhandled promise rejection',
        stack: reason?.stack || null
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
