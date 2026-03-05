import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const parseAuthErrorFromUrl = (searchParams) => {
  const err = searchParams.get('error') || ''
  const desc = searchParams.get('error_description') || ''
  if (!err && !desc) return ''
  return decodeURIComponent(desc || err).replace(/\+/g, ' ')
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Validation de votre connexion...')

  const nextPath = useMemo(() => {
    const raw = searchParams.get('next') || '/dashboard'
    return raw.startsWith('/') ? raw : '/dashboard'
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    const completeAuth = async () => {
      const urlError = parseAuthErrorFromUrl(searchParams)
      if (urlError) {
        if (cancelled) return
        setStatus('error')
        setMessage(urlError)
        return
      }

      try {
        const href = window.location.href
        const hasCode = href.includes('code=')
        if (hasCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(href)
          if (error) throw error
        }

        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session?.user) {
          throw new Error('Session absente apres confirmation/authentification.')
        }

        if (cancelled) return
        setStatus('success')
        setMessage('Connexion confirmee, redirection en cours...')
        setTimeout(() => {
          navigate(nextPath, { replace: true })
        }, 450)
      } catch (error) {
        if (cancelled) return
        setStatus('error')
        setMessage(error?.message || 'Impossible de finaliser la connexion.')
      }
    }

    void completeAuth()

    return () => {
      cancelled = true
    }
  }, [navigate, nextPath, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 flex items-center justify-center p-4">
      <div className="surface-glass p-6 sm:p-8 w-full max-w-md text-center">
        {status === 'loading' ? (
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
        ) : null}
        {status === 'success' ? (
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
        ) : null}
        {status === 'error' ? (
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-4" />
        ) : null}
        <p
          className={`font-semibold ${
            status === 'error' ? 'text-red-700' : status === 'success' ? 'text-emerald-700' : 'text-gray-700'
          }`}
        >
          {message}
        </p>
        {status === 'error' ? (
          <button
            type="button"
            onClick={() => navigate('/auth/login', { replace: true })}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
          >
            Retour a la connexion
          </button>
        ) : null}
      </div>
    </div>
  )
}
