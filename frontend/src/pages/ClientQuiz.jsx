import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { clientQuizQuestions } from '@/data/clientQuizQuestions'
import { getQuizClient, submitClientQuizResult } from '@/services/clientService'

const getScoreTheme = (score) => {
  if (score >= 75) return { color: 'text-green-600', label: 'Excellent niveau' }
  if (score >= 50) return { color: 'text-amber-600', label: 'Bon potentiel' }
  return { color: 'text-red-600', label: 'Priorite d accompagnement' }
}

const buildInsights = (questions, answersByQuestionId) => {
  const conceptAverages = questions.map((question) => {
    const points = answersByQuestionId[question.id] || 0
    return { concept: question.concept, points }
  })

  const strengths = conceptAverages
    .filter((item) => item.points >= 4)
    .sort((a, b) => b.points - a.points)
    .map((item) => item.concept)

  const weaknesses = conceptAverages
    .filter((item) => item.points <= 2)
    .sort((a, b) => a.points - b.points)
    .map((item) => item.concept)

  const fallbackSorted = [...conceptAverages].sort((a, b) => b.points - a.points)
  const finalStrengths = strengths.length > 0 ? strengths.slice(0, 3) : fallbackSorted.slice(0, 2).map((item) => item.concept)
  const finalWeaknesses =
    weaknesses.length > 0
      ? weaknesses.slice(0, 3)
      : [...fallbackSorted].reverse().slice(0, 2).map((item) => item.concept)

  return {
    strengths: Array.from(new Set(finalStrengths)),
    weaknesses: Array.from(new Set(finalWeaknesses))
  }
}

export default function ClientQuiz() {
  const { clientId } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [client, setClient] = useState(null)
  const [loadingClient, setLoadingClient] = useState(true)
  const [error, setError] = useState(null)
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [completedResult, setCompletedResult] = useState(null)

  const currentQuestion = clientQuizQuestions[currentIndex]
  const totalQuestions = clientQuizQuestions.length
  const answeredCount = Object.keys(answers).length
  const progress = Math.round((answeredCount / totalQuestions) * 100)

  const loadClient = useCallback(async () => {
    if (!clientId) return

    try {
      setLoadingClient(true)
      setError(null)
      const data = await getQuizClient(clientId)
      setClient(data)

      if (data?.quiz_status === 'completed' && typeof data.score === 'number') {
        setCompletedResult({
          score: data.score,
          strengths: [],
          weaknesses: []
        })
      }
    } catch (err) {
      console.error('Erreur chargement quiz client:', err)
      setError("Lien invalide ou client introuvable")
    } finally {
      setLoadingClient(false)
    }
  }, [clientId])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  const scorePreview = useMemo(() => {
    const total = Object.values(answers).reduce((sum, value) => sum + value, 0)
    const max = totalQuestions * 5
    return max > 0 ? Math.round((total / max) * 100) : 0
  }, [answers, totalQuestions])

  const selectAnswer = (points) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: points
    }))
  }

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const goPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const submitQuiz = async () => {
    if (answeredCount !== totalQuestions || !clientId) return

    try {
      setSaving(true)
      setError(null)
      const totalPoints = Object.values(answers).reduce((sum, value) => sum + value, 0)
      const score = Math.round((totalPoints / (totalQuestions * 5)) * 100)
      const insights = buildInsights(clientQuizQuestions, answers)

      await submitClientQuizResult({
        clientId,
        score,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses
      })

      setCompletedResult({
        score,
        strengths: insights.strengths,
        weaknesses: insights.weaknesses
      })
    } catch (err) {
      console.error('Erreur soumission quiz:', err)
      setError("Impossible d'enregistrer le quiz, veuillez reessayer")
    } finally {
      setSaving(false)
    }
  }

  if (loadingClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md w-full">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-700 font-medium">Verification de votre invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md w-full">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acces impossible</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (completedResult) {
    const theme = getScoreTheme(completedResult.score)

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Quiz termine</h1>
            <p>Merci {client?.name}, vos resultats ont bien ete enregistres.</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Score global</p>
              <p className={`text-5xl font-bold ${theme.color}`}>{completedResult.score}/100</p>
              <p className="text-sm text-gray-600 mt-2">{theme.label}</p>
            </div>

            {completedResult.strengths.length > 0 || completedResult.weaknesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <h3 className="font-bold text-green-900 mb-2">Points forts</h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    {completedResult.strengths.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <h3 className="font-bold text-rose-900 mb-2">Points a renforcer</h3>
                  <ul className="space-y-1 text-sm text-rose-800">
                    {completedResult.weaknesses.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <p className="text-sm text-gray-600 text-center">
              Votre conseiller recevra ces informations pour preparer un accompagnement personnalise.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Bienvenue {client?.name}</h1>
          <p className="text-gray-700 mb-6">
            Ce quiz rapide permet d'evaluer vos connaissances financieres pour adapter votre prochain rendez-vous.
          </p>

          <div className="space-y-3 mb-6">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-semibold text-gray-800">Duree estimee: 5 minutes</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-semibold text-gray-800">{totalQuestions} questions</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <p className="font-semibold text-gray-800">Aucune bonne ou mauvaise reponse absolue</p>
            </div>
          </div>

          {token ? (
            <p className="text-xs text-gray-500 mb-4">Invitation verifiee.</p>
          ) : (
            <p className="text-xs text-amber-700 mb-4">Lien sans token: acces autorise.</p>
          )}

          <button
            onClick={() => setStarted(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
          >
            Commencer le quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-700 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentIndex + 1}/{totalQuestions}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-indigo-700 font-semibold mb-2">
            {currentQuestion.concept}
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.prompt}</h2>
        </div>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.points
            return (
              <button
                key={option.label}
                onClick={() => selectAnswer(option.points)}
                className={`w-full text-left border rounded-xl px-4 py-3 font-medium transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 mb-4">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrevious}
            disabled={currentIndex === 0 || saving}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Precedent
          </button>

          <div className="text-sm text-gray-600">Score provisoire: {scorePreview}/100</div>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={goNext}
              disabled={!answers[currentQuestion.id] || saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={answeredCount !== totalQuestions || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
