import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getAdvisorClients, getAdvisorStats, subscribeToAdvisorClients } from '@/services/clientService'
import StatsCard from '@/components/Dashboard/StatsCard'
import DashboardGuide from '@/components/Dashboard/DashboardGuide'
import { dashboardGuides } from '@/data/dashboardGuides'
import InviteClientModal from '@/components/Dashboard/InviteClientModal'
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Flag,
  Flame,
  Gift,
  Loader2,
  BellRing,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users
} from 'lucide-react'

export default function Overview() {
  const { advisor, updateProfile, refreshAdvisor } = useAuth()
  const { tr, language } = useLanguage()
  const [stats, setStats] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [gamificationLoading, setGamificationLoading] = useState(false)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [isJourneyCollapsed, setIsJourneyCollapsed] = useState(() => {
    try {
      return localStorage.getItem('finmate-overview-journey-collapsed') === '1'
    } catch {
      return false
    }
  })
  const gamificationEnabled = advisor?.gamification_enabled !== false
  const smartAlertsEnabled = advisor?.smart_alerts_enabled !== false
  const alertDelayDays = Math.max(1, Number(advisor?.smart_alerts_delay_days || 7))

  const loadStats = useCallback(async () => {
    if (!advisor?.id) return

    try {
      setLoading(true)
      setError(null)
      const [statsData, clientsData] = await Promise.all([
        getAdvisorStats(advisor.id),
        getAdvisorClients(advisor.id)
      ])
      setStats(statsData)
      setClients(clientsData || [])
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      setError(tr('Impossible de charger les statistiques', 'Unable to load statistics'))
    } finally {
      setLoading(false)
    }
  }, [advisor?.id, tr])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    if (!advisor?.id) return undefined

    const unsubscribe = subscribeToAdvisorClients(advisor.id, () => {
      void loadStats()
    })

    return unsubscribe
  }, [advisor?.id, loadStats])

  const setGamificationVisibility = async (enabled) => {
    if (!advisor?.id || gamificationLoading) return
    try {
      setGamificationLoading(true)
      await updateProfile({
        gamification_enabled: Boolean(enabled),
        gamification_updated_at: new Date().toISOString()
      })
      await refreshAdvisor()
    } catch (err) {
      console.error('Erreur mise a jour gamification:', err)
    } finally {
      setGamificationLoading(false)
    }
  }

  const setSmartAlertsVisibility = async (enabled) => {
    if (!advisor?.id || alertsLoading) return
    try {
      setAlertsLoading(true)
      await updateProfile({
        smart_alerts_enabled: Boolean(enabled),
        smart_alerts_updated_at: new Date().toISOString()
      })
      await refreshAdvisor()
    } catch (err) {
      console.error('Erreur mise a jour alertes intelligentes:', err)
    } finally {
      setAlertsLoading(false)
    }
  }

  const toggleJourneyCollapsed = () => {
    setIsJourneyCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('finmate-overview-journey-collapsed', next ? '1' : '0')
      } catch {
        // ignore storage failures
      }
      return next
    })
  }

  const missionPhases = useMemo(() => {
    const phase1Missions = [
      {
        key: 'first_client',
        title: tr('Etape 1 - Ajouter votre premier client', 'Step 1 - Add your first client'),
        description: tr(
          'Demarrez votre pipeline en creant votre premier contact client.',
          'Kick off your pipeline by creating your first client contact.'
        ),
        done: (stats?.totalClients || 0) >= 1,
        points: 40,
        ctaLabel: tr('Inviter un client', 'Invite a client'),
        ctaAction: () => setInviteModalOpen(true)
      },
      {
        key: 'first_quiz',
        title: tr('Etape 2 - Obtenir un questionnaire complete', 'Step 2 - Get a completed questionnaire'),
        description: tr(
          'Envoyez votre premier lien et validez un questionnaire rempli.',
          'Send your first link and validate a completed questionnaire.'
        ),
        done: (stats?.completed || 0) >= 1,
        points: 35,
        ctaLabel: tr('Voir les invitations', 'View invitations'),
        ctaTo: '/dashboard/invitations'
      },
      {
        key: 'first_followup',
        title: tr('Etape 3 - Lancer un suivi conseiller', 'Step 3 - Start advisor follow-up'),
        description: tr(
          'Passez un client en suivi actif pour structurer votre relance.',
          'Move one client to active follow-up to structure your outreach.'
        ),
        done: (stats?.inProgress || 0) + (stats?.closed || 0) >= 1,
        points: 25,
        ctaLabel: tr('Ouvrir mes clients', 'Open my clients'),
        ctaTo: '/dashboard/clients'
      }
    ]

    const phase2Missions = [
      {
        key: 'portfolio_5',
        title: tr('Objectif - 5 clients actifs', 'Goal - 5 active clients'),
        description: tr(
          'Consolidez votre portefeuille avec au moins 5 clients.',
          'Grow your portfolio to at least 5 clients.'
        ),
        done: (stats?.totalClients || 0) >= 5,
        points: 40,
        ctaLabel: tr('Gerer mes clients', 'Manage clients'),
        ctaTo: '/dashboard/clients'
      },
      {
        key: 'quiz_3',
        title: tr('Objectif - 3 quiz completes', 'Goal - 3 completed quizzes'),
        description: tr(
          'Validez 3 questionnaires pour fiabiliser vos insights.',
          'Complete 3 questionnaires to improve insight quality.'
        ),
        done: (stats?.completed || 0) >= 3,
        points: 35,
        ctaLabel: tr('Suivre mes invitations', 'Track invitations'),
        ctaTo: '/dashboard/invitations'
      },
      {
        key: 'avg_70',
        title: tr('Objectif - Score moyen 70+', 'Goal - Average score 70+'),
        description: tr(
          'Atteignez 70/100 de score moyen sur vos quiz completes.',
          'Reach a 70/100 average score on completed quizzes.'
        ),
        done: (stats?.avgScore || 0) >= 70 && (stats?.completed || 0) >= 2,
        points: 30,
        ctaLabel: tr('Voir analytics', 'View analytics'),
        ctaTo: '/dashboard/analytics'
      },
      {
        key: 'followup_3',
        title: tr('Objectif - 3 suivis actifs', 'Goal - 3 active follow-ups'),
        description: tr(
          'Passez 3 clients en statut RDV planifie ou en cours.',
          'Move 3 clients to scheduled/in-progress follow-up.'
        ),
        done: (stats?.inProgress || 0) >= 3,
        points: 35,
        ctaLabel: tr('Piloter les suivis', 'Manage follow-ups'),
        ctaTo: '/dashboard/clients'
      }
    ]

    const phase3Missions = [
      {
        key: 'portfolio_12',
        title: tr('Maitrise - 12 clients', 'Mastery - 12 clients'),
        description: tr(
          'Passez un cap avec 12 clients dans votre portefeuille.',
          'Reach the next milestone with 12 clients in your portfolio.'
        ),
        done: (stats?.totalClients || 0) >= 12,
        points: 45,
        ctaLabel: tr('Developper mon portefeuille', 'Grow my portfolio'),
        ctaTo: '/dashboard/clients'
      },
      {
        key: 'quiz_10',
        title: tr('Maitrise - 10 quiz completes', 'Mastery - 10 completed quizzes'),
        description: tr(
          'Installez un rythme regulier de collecte de donnees.',
          'Build a steady rhythm of data collection.'
        ),
        done: (stats?.completed || 0) >= 10,
        points: 45,
        ctaLabel: tr('Lancer plus de quiz', 'Launch more quizzes'),
        ctaTo: '/dashboard/invitations'
      },
      {
        key: 'avg_80',
        title: tr('Maitrise - Score moyen 80+', 'Mastery - Average score 80+'),
        description: tr(
          'Maintenez un niveau de qualification eleve.',
          'Maintain a high qualification standard.'
        ),
        done: (stats?.avgScore || 0) >= 80 && (stats?.completed || 0) >= 5,
        points: 40,
        ctaLabel: tr('Optimiser la qualite', 'Optimize quality'),
        ctaTo: '/dashboard/analytics'
      },
      {
        key: 'close_3',
        title: tr('Maitrise - 3 dossiers clos', 'Mastery - 3 closed deals'),
        description: tr(
          'Transformez vos suivis en resultats concrets.',
          'Turn follow-ups into concrete business outcomes.'
        ),
        done: (stats?.closed || 0) >= 3,
        points: 50,
        ctaLabel: tr('Suivre les opportunites', 'Track opportunities'),
        ctaTo: '/dashboard/clients'
      }
    ]

    return [
      {
        key: 'starter',
        name: tr('Phase 1 - Demarrage', 'Phase 1 - Starter'),
        icon: Sparkles,
        missions: phase1Missions
      },
      {
        key: 'acceleration',
        name: tr('Phase 2 - Acceleration', 'Phase 2 - Acceleration'),
        icon: Rocket,
        missions: phase2Missions
      },
      {
        key: 'mastery',
        name: tr('Phase 3 - Maitrise', 'Phase 3 - Mastery'),
        icon: Crown,
        missions: phase3Missions
      }
    ]
  }, [stats?.totalClients, stats?.completed, stats?.inProgress, stats?.closed, stats?.avgScore, tr])

  const phaseProgress = useMemo(
    () =>
      missionPhases.map((phase, index) => {
        const completed = phase.missions.filter((mission) => mission.done).length
        const total = phase.missions.length
        const unlocked = index === 0 || missionPhases[index - 1].missions.every((mission) => mission.done)
        return {
          ...phase,
          completed,
          total,
          progress: Math.round((completed / total) * 100),
          complete: completed === total,
          unlocked
        }
      }),
    [missionPhases]
  )

  const onboardingCompletedCount = phaseProgress[0]?.completed || 0
  const onboardingProgress = phaseProgress[0]?.progress || 0
  const activePhase = phaseProgress.find((phase) => phase.unlocked && !phase.complete) || phaseProgress[phaseProgress.length - 1]

  const gamification = useMemo(() => {
    const missions = phaseProgress.flatMap((phase) => phase.missions)
    const missionXp = missions.filter((mission) => mission.done).reduce((total, mission) => total + mission.points, 0)
    const volumeXp = Math.min((stats?.completed || 0) * 5, 40)
    const qualityXp = (stats?.avgScore || 0) >= 80 ? 20 : (stats?.avgScore || 0) >= 65 ? 10 : 0
    const consistencyXp = Math.min((stats?.inProgress || 0) * 4 + (stats?.closed || 0) * 8, 50)
    const totalXp = missionXp + volumeXp + qualityXp + consistencyXp

    let level = 1
    let threshold = 80
    let accumulated = totalXp
    while (accumulated >= threshold) {
      accumulated -= threshold
      level += 1
      threshold = Math.round(threshold * 1.15)
    }
    const currentLevelXp = accumulated
    const nextLevelAt = threshold
    const levelProgress = Math.min(100, Math.round((currentLevelXp / nextLevelAt) * 100))
    const tierLabel =
      level >= 10
        ? tr('Legendaire', 'Legendary')
        : level >= 7
          ? tr('Expert', 'Expert')
          : level >= 4
            ? tr('Confirme', 'Advanced')
            : tr('Debutant', 'Starter')

    const badges = [
      {
        key: 'starter',
        label: tr('Demarrage', 'Starter'),
        unlocked: (stats?.totalClients || 0) > 0
      },
      {
        key: 'first_win',
        label: tr('Premier quiz', 'First quiz'),
        unlocked: (stats?.completed || 0) > 0
      },
      {
        key: 'coach',
        label: tr('Coach actif', 'Active coach'),
        unlocked: (stats?.inProgress || 0) + (stats?.closed || 0) > 0
      },
      {
        key: 'performer',
        label: tr('Performance 80+', '80+ performer'),
        unlocked: (stats?.completed || 0) >= 3 && (stats?.avgScore || 0) >= 80
      },
      {
        key: 'acceleration',
        label: tr('Accelerateur', 'Accelerator'),
        unlocked: phaseProgress[1]?.complete || false
      },
      {
        key: 'closer',
        label: tr('Closer', 'Closer'),
        unlocked: (stats?.closed || 0) >= 3
      }
    ]

    return {
      totalXp,
      level,
      tierLabel,
      currentLevelXp,
      nextLevelAt,
      levelProgress,
      badges,
      unlockedBadges: badges.filter((badge) => badge.unlocked).length
    }
  }, [phaseProgress, stats?.avgScore, stats?.closed, stats?.completed, stats?.inProgress, stats?.totalClients, tr])

  const smartAlerts = useMemo(() => {
    const safeClients = Array.isArray(clients) ? clients : []
    const now = Date.now()
    const msPerDay = 1000 * 60 * 60 * 24

    const noResponse = safeClients
      .filter((client) => client.quiz_status !== 'completed')
      .map((client) => {
        const refDateRaw = client.last_contacted_at || client.created_at
        const refDate = refDateRaw ? new Date(refDateRaw).getTime() : now
        const daysSince = Math.max(0, Math.floor((now - refDate) / msPerDay))
        return { ...client, daysSince }
      })
      .filter((client) => client.daysSince >= alertDelayDays)
      .sort((a, b) => b.daysSince - a.daysSince)

    const scoreDown = safeClients
      .filter((client) => typeof client.quiz_progress_delta === 'number' && client.quiz_progress_delta < 0)
      .sort((a, b) => a.quiz_progress_delta - b.quiz_progress_delta)

    return {
      noResponse,
      scoreDown,
      total: noResponse.length + scoreDown.length
    }
  }, [clients, alertDelayDays])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{tr('Chargement des statistiques...', 'Loading statistics...')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">❌ {error}</p>
        <button
          onClick={loadStats}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {tr('Reessayer', 'Retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <DashboardGuide guide={dashboardGuides.overview} />
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {tr('Bonjour', 'Hello')} {advisor?.name?.split(' ')[0]} !
        </h2>
        <p className="text-emerald-100 text-lg">{tr('Voici un apercu de votre activite', 'Here is your activity overview')}</p>
      </div>

      {gamificationEnabled ? (
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 rounded-xl p-5 sm:p-6 text-white shadow-lg">
        <div className="mb-3 flex justify-start">
          <button
            onClick={() => void setGamificationVisibility(false)}
            disabled={gamificationLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300/70 bg-rose-500/20 px-3.5 py-2 text-sm font-bold text-rose-100 shadow-sm hover:bg-rose-500/30 hover:border-rose-200 disabled:opacity-60"
          >
            {gamificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
            {tr('Masquer la gamification', 'Hide gamification')}
          </button>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <Sparkles className="w-4 h-4" />
              {tr('Mission de demarrage', 'Starter mission')}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold">
              {activePhase?.complete
                ? tr('Parcours termine, continuez votre serie', 'Quest completed, keep your streak going')
                : tr('Objectif en cours', 'Current objective') + `: ${activePhase?.name || ''}`}
            </h3>
            <p className="text-sm text-slate-200">
              {tr('Progression onboarding', 'Onboarding progress')}: {onboardingCompletedCount}/3 ({onboardingProgress}%)
            </p>
            <div className="w-full max-w-xl h-2 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${onboardingProgress}%` }} />
            </div>
          </div>

          <div className="min-w-[230px] rounded-xl border border-white/20 bg-white/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-100">{tr('Niveau conseiller', 'Advisor level')}</p>
            <p className="mt-1 text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-300" />
              {tr('Niv.', 'Lvl')} {gamification.level}
            </p>
            <p className="text-sm text-slate-200 mt-1">{gamification.totalXp} XP - {gamification.tierLabel}</p>
            <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-300 to-emerald-300" style={{ width: `${gamification.levelProgress}%` }} />
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {tr('Prochain niveau', 'Next level')}: {gamification.currentLevelXp}/{gamification.nextLevelAt} XP
            </p>
          </div>
        </div>
      </div>
      ) : (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{tr('Gamification masquee', 'Gamification hidden')}</p>
          <p className="text-sm text-slate-600">
            {tr('Vous pouvez la reactiver ici ou dans Parametres.', 'You can re-enable it here or in Settings.')}
          </p>
        </div>
        <button
          onClick={() => void setGamificationVisibility(true)}
          disabled={gamificationLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
        >
          {gamificationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {tr('Afficher la gamification', 'Show gamification')}
        </button>
      </div>
      )}

      {gamificationEnabled ? (
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            {tr('Parcours guide evolutif', 'Progressive guided journey')}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              {tr('Badges debloques', 'Unlocked badges')}: {gamification.unlockedBadges}/{gamification.badges.length}
            </p>
            <button
              onClick={toggleJourneyCollapsed}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isJourneyCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              {isJourneyCollapsed ? tr('Deplier', 'Expand') : tr('Plier', 'Collapse')}
            </button>
          </div>
        </div>

        {!isJourneyCollapsed ? (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {phaseProgress.map((phase) => {
            const Icon = phase.icon
            return (
              <div
                key={phase.key}
                className={`rounded-lg border px-3 py-2 ${phase.unlocked ? 'border-indigo-200 bg-indigo-50/60' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {phase.name}
                </p>
                <p className="text-xs mt-1">
                  {phase.completed}/{phase.total} - {phase.progress}%
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {(activePhase?.missions || []).map((step) => (
            <div
              key={step.key}
              className={`rounded-xl border p-4 transition-all ${step.done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${step.done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  {step.done ? <CheckCircle className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
                  {step.done ? tr('Valide', 'Done') : tr('A faire', 'To do')}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-700">+{step.points} XP</p>
                {step.ctaTo ? (
                  <Link
                    to={step.ctaTo}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    {step.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={step.ctaAction}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    {step.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {gamification.badges.map((badge) => (
            <span
              key={badge.key}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}
            >
              {badge.unlocked ? <Gift className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
              {badge.label}
            </span>
          ))}
        </div>
        </>
        ) : null}
      </div>
      ) : null}

      {smartAlertsEnabled ? (
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            {tr('Alertes intelligentes de relance', 'Smart follow-up alerts')}
          </h3>
          <button
            onClick={() => void setSmartAlertsVisibility(false)}
            disabled={alertsLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          >
            {alertsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
            {tr('Masquer les alertes', 'Hide alerts')}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {tr('Seuil sans reponse', 'No-response threshold')}: {alertDelayDays} {tr('jours', 'days')}
          {' - '}
          {tr('Alertes detectees', 'Detected alerts')}: {smartAlerts.total}
        </p>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="font-semibold text-orange-900 mb-2">
              {tr('Clients sans reponse depuis X jours', 'Clients without response for X days')} ({smartAlerts.noResponse.length})
            </p>
            {smartAlerts.noResponse.length === 0 ? (
              <p className="text-sm text-orange-800">{tr('Aucune alerte pour le moment.', 'No alert for now.')}</p>
            ) : (
              <div className="space-y-2">
                {smartAlerts.noResponse.slice(0, 5).map((client) => (
                  <div key={`nr-${client.id}`} className="rounded-lg border border-orange-200 bg-white px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-600">
                      {client.daysSince} {tr('jours sans reponse', 'days without response')}
                    </p>
                    <Link
                      to={`/dashboard/clients/${client.id}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-800 hover:underline"
                    >
                      {tr('Ouvrir la fiche client', 'Open client profile')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="font-semibold text-rose-900 mb-2">
              {tr('Clients avec score en baisse', 'Clients with declining score')} ({smartAlerts.scoreDown.length})
            </p>
            {smartAlerts.scoreDown.length === 0 ? (
              <p className="text-sm text-rose-800">{tr('Aucune baisse detectee.', 'No decline detected.')}</p>
            ) : (
              <div className="space-y-2">
                {smartAlerts.scoreDown.slice(0, 5).map((client) => (
                  <div key={`sd-${client.id}`} className="rounded-lg border border-rose-200 bg-white px-3 py-2">
                    <p className="font-semibold text-sm text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-600">
                      {tr('Variation', 'Variation')}: {client.quiz_progress_delta} pts
                      {typeof client.latest_session_score === 'number' ? ` - ${tr('Dernier score', 'Latest score')}: ${client.latest_session_score}/100` : ''}
                    </p>
                    <Link
                      to={`/dashboard/clients/${client.id}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline"
                    >
                      {tr('Ouvrir la fiche client', 'Open client profile')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{tr('Alertes intelligentes masquees', 'Smart alerts hidden')}</p>
          <p className="text-sm text-slate-600">
            {tr('Vous pouvez les reactiver ici ou dans Parametres.', 'You can re-enable them here or in Settings.')}
          </p>
        </div>
        <button
          onClick={() => void setSmartAlertsVisibility(true)}
          disabled={alertsLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
        >
          {alertsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {tr('Afficher les alertes', 'Show alerts')}
        </button>
      </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title={tr('Total clients', 'Total clients')} value={stats?.totalClients || 0} icon={Users} color="purple" />
        <StatsCard title={tr('Quiz completes', 'Completed quizzes')} value={stats?.completed || 0} icon={CheckCircle} color="green" />
        <StatsCard title={tr('En attente', 'Pending')} value={stats?.pending || 0} icon={Clock} color="orange" />
        <StatsCard
          title={tr('Score moyen', 'Average score')}
          value={stats?.avgScore ? `${stats.avgScore}/100` : 'N/A'}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">{tr('Clients a contacter', 'Clients to contact')}</p>
          <p className="text-3xl font-bold text-amber-700">{stats?.toContact || 0}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">{tr('Suivis en cours', 'Follow-ups in progress')}</p>
          <p className="text-3xl font-bold text-blue-700">{stats?.inProgress || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{tr('Actions rapides', 'Quick actions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left"
          >
            <div className="text-2xl mb-2">+</div>
            <h4 className="font-semibold text-gray-800">{tr('Inviter un client', 'Invite a client')}</h4>
            <p className="text-sm text-gray-600">{tr('Envoyez un questionnaire', 'Send a questionnaire')}</p>
          </button>

          <Link
            to="/dashboard/clients"
            className="p-4 border-2 border-teal-200 rounded-lg hover:border-teal-600 hover:bg-teal-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Resultats</div>
            <h4 className="font-semibold text-gray-800">{tr('Voir les resultats', 'View results')}</h4>
            <p className="text-sm text-gray-600">{tr('Consultez les performances', 'Review performance')}</p>
          </Link>

          <Link
            to="/dashboard/analytics"
            className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Analytics</div>
            <h4 className="font-semibold text-gray-800">{tr('Analytics avancees', 'Advanced analytics')}</h4>
            <p className="text-sm text-gray-600">{tr('Analysez les tendances clients', 'Analyze client trends')}</p>
          </Link>

          <Link
            to="/dashboard/questionnaires"
            className="p-4 border-2 border-emerald-200 rounded-lg hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Quiz</div>
            <h4 className="font-semibold text-gray-800">{tr('Questionnaires', 'Questionnaires')}</h4>
            <p className="text-sm text-gray-600">{tr('Templates et banque de questions', 'Templates and question bank')}</p>
          </Link>

          <Link
            to="/dashboard/question-bank"
            className="p-4 border-2 border-orange-200 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Banque</div>
            <h4 className="font-semibold text-gray-800">{tr('Questions par theme', 'Questions by topic')}</h4>
            <p className="text-sm text-gray-600">{tr('Creer vos themes et questions', 'Create topics and questions')}</p>
          </Link>

          <Link
            to="/dashboard/settings"
            className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all text-left block"
          >
            <div className="text-2xl mb-2">Reglages</div>
            <h4 className="font-semibold text-gray-800">{tr('Parametres', 'Settings')}</h4>
            <p className="text-sm text-gray-600">{tr('Gerer votre compte', 'Manage your account')}</p>
          </Link>
        </div>
      </div>

      {stats?.totalClients === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-2">{tr('Prochaine etape : Invitez votre premier client', 'Next step: invite your first client')}</h3>
          <p className="text-blue-800 mb-4">
            {tr('Commencez a qualifier vos clients en leur envoyant un questionnaire personnalise.', 'Start qualifying your clients by sending a personalized questionnaire.')}
          </p>
          <button
            onClick={() => setInviteModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {tr('Creer une invitation', 'Create invitation')}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-2">{tr('Excellent travail', 'Great work')}</h3>
          <p className="text-green-800 mb-4">
            {language === 'fr'
              ? `Vous avez ${stats.completed} questionnaire${stats.completed > 1 ? 's completes' : ' complete'} sur ${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''}.${stats.pending > 0 ? ` Il reste ${stats.pending} client${stats.pending > 1 ? 's' : ''} en attente.` : ''}`
              : `You have ${stats.completed} completed questionnaire${stats.completed > 1 ? 's' : ''} out of ${stats.totalClients} client${stats.totalClients > 1 ? 's' : ''}.${stats.pending > 0 ? ` ${stats.pending} client${stats.pending > 1 ? 's are' : ' is'} still pending.` : ''}`}
          </p>
          <div className="flex gap-3">
            <Link
              to="/dashboard/clients"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition inline-block"
            >
              {tr('Voir tous les clients', 'View all clients')}
            </Link>
            {stats.pending > 0 && (
              <button className="bg-white text-green-700 border-2 border-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
                  {tr('Relancer les invitations', 'Resend invitations')}
              </button>
            )}
          </div>
        </div>
      )}

      <InviteClientModal
        isOpen={inviteModalOpen}
        advisorId={advisor?.id}
        advisorName={advisor?.name}
        advisorEmail={advisor?.email}
        advisorPlan={advisor?.plan}
        currentClientCount={stats?.totalClients || 0}
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => {
          void loadStats()
        }}
      />
    </div>
  )
}


