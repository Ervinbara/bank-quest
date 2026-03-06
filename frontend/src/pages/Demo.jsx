import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BankQuestGame from '@/components/Game/BankQuestGame'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { CheckCircle2, ClipboardList, Target, TrendingUp, ArrowRight } from 'lucide-react'

export default function Demo() {
  const { t, tr } = useLanguage()
  const [demoResult, setDemoResult] = useState(null)
  const resultRef = useRef(null)

  useEffect(() => {
    if (demoResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [demoResult])

  const normalizedScore = typeof demoResult?.score === 'number' ? Math.max(0, Math.min(100, demoResult.score)) : null
  const profileLabel =
    normalizedScore === null
      ? null
      : normalizedScore >= 75
        ? tr('Prioritaire: client prêt à avancer', 'Priority: client ready to move forward')
        : normalizedScore >= 50
          ? tr('Potentiel: à structurer en rendez-vous', 'Potential: to structure during the meeting')
          : tr('À accompagner: besoins fondamentaux à cadrer', 'To support: foundational needs to frame')
  const nextActions =
    normalizedScore === null
      ? []
      : normalizedScore >= 75
        ? [
            tr('Proposer une stratégie patrimoniale et plan d’exécution.', 'Propose a wealth strategy and execution plan.'),
            tr('Planifier un second rendez-vous de concrétisation.', 'Schedule a second execution-focused meeting.')
          ]
        : normalizedScore >= 50
          ? [
              tr('Concentrer le RDV sur 2 priorités concrètes.', 'Focus the meeting on 2 concrete priorities.'),
              tr('Envoyer un questionnaire de suivi sous 15 jours.', 'Send a follow-up questionnaire within 15 days.')
            ]
          : [
              tr('Reprendre les bases budget/épargne avec plan simple.', 'Review budget/savings fundamentals with a simple plan.'),
              tr('Mettre en place une relance pédagogique à 30 jours.', 'Set a 30-day educational follow-up.')
            ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2 min-w-0">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-2xl sm:text-3xl max-[420px]:hidden">FM</span>
              <span className="text-xl sm:text-2xl font-bold gradient-text truncate">FinMate</span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <LanguageSwitcher compact />
              <Link to="/" className="text-sm sm:text-base text-gray-600 hover:text-emerald-700 font-medium whitespace-nowrap max-[520px]:hidden">
                {t('header.backHome', 'Back to home')}
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
              <div className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 mb-3">
                {tr('Démo conseiller financier', 'Financial advisor demo')}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold gradient-text mb-3">
                {tr('En 60 secondes: de la réponse client au plan de rendez-vous', 'In 60 seconds: from client answers to a meeting plan')}
              </h1>
              <p className="text-sm sm:text-lg text-gray-600">
                {tr(
                  'Cette démo montre exactement ce que vous obtenez: qualification automatique, priorités d’entretien et actions de relance.',
                  'This demo shows exactly what you get: automatic qualification, meeting priorities, and follow-up actions.'
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-slate-900">{tr('Étape 1', 'Step 1')}</p>
                </div>
                <p className="text-sm text-slate-700">
                  {tr('Le client répond à quelques questions ciblées avant le RDV.', 'The client answers focused questions before the meeting.')}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-slate-900">{tr('Étape 2', 'Step 2')}</p>
                </div>
                <p className="text-sm text-slate-700">
                  {tr('FinMate calcule un score et identifie les priorités commerciales.', 'FinMate calculates a score and identifies sales priorities.')}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-bold text-slate-900">{tr('Étape 3', 'Step 3')}</p>
                </div>
                <p className="text-sm text-slate-700">
                  {tr('Vous repartez avec un plan d’action clair et une relance planifiée.', 'You leave with a clear action plan and a scheduled follow-up.')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-4 sm:p-5 mb-6 text-white">
            <p className="font-bold mb-1">{tr('Contexte client simulé', 'Simulated client context')}</p>
            <p className="text-sm text-emerald-50">
              {tr(
                'Profil: actif 30-45 ans, revenus stables, questions sur épargne, fiscalité et préparation long terme.',
                'Profile: 30-45 active client, stable income, questions about savings, taxation, and long-term planning.'
              )}
            </p>
          </div>

          <BankQuestGame
            theme="blue"
            onComplete={(data) => {
              const score = Number.isFinite(data?.score) ? data.score : 0
              const concepts = Array.isArray(data?.concepts) ? data.concepts : []
              setDemoResult({ score, concepts })
            }}
          />

          {demoResult && (
            <section ref={resultRef} className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-600 font-bold">
                    {tr('Restitution conseiller', 'Advisor recap')}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {tr('Ce que vous obtenez immédiatement après le questionnaire', 'What you get immediately after the questionnaire')}
                  </h2>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-semibold">{tr('Score client', 'Client score')}</p>
                  <p className="text-xl font-extrabold text-emerald-700">{normalizedScore}/100</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-1">{tr('Qualification', 'Qualification')}</p>
                  <p className="text-sm font-bold text-slate-900">{profileLabel}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-1">{tr('Priorités de RDV', 'Meeting priorities')}</p>
                  <p className="text-sm text-slate-800">
                    {demoResult.concepts?.length > 0
                      ? demoResult.concepts.slice(0, 3).join(' • ')
                      : tr('Priorités automatiquement extraites des réponses.', 'Priorities automatically extracted from answers.')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-1">{tr('Relance intelligente', 'Smart follow-up')}</p>
                  <p className="text-sm text-slate-800">
                    {tr('Suivi déclenché selon score et évolution au prochain questionnaire.', 'Follow-up triggered based on score and progress on next questionnaire.')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 mb-5">
                <p className="text-sm font-bold text-emerald-900 mb-2">{tr('Actions recommandées', 'Recommended actions')}</p>
                <ul className="space-y-2">
                  {nextActions.map((action) => (
                    <li key={action} className="text-sm text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/auth/register" className="btn-primary px-5 py-2.5 inline-flex items-center justify-center gap-2">
                  {tr('Créer mon compte et lancer un vrai client', 'Create my account and launch a real client')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/auth/login" className="btn-secondary px-5 py-2.5 inline-flex items-center justify-center">
                  {tr('Ouvrir mon tableau de bord', 'Open my dashboard')}
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

