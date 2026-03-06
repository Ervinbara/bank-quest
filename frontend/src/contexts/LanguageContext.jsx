import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'finmate-language'

const translations = {
  fr: {
    common: {
      dashboard: 'Tableau de bord',
      logout: 'Déconnexion',
      loggingOut: 'Déconnexion...',
      login: 'Connexion',
      register: 'Inscription',
      settings: 'Paramètres'
    },
    language: {
      fr: 'FR',
      en: 'EN'
    },
    nav: {
      solution: 'Solution',
      demo: 'Démo',
      features: 'Fonctionnalités'
    },
    header: {
      backHome: 'Retour à l’accueil'
    },
    demo: {
      title: 'Démo interactive',
      description: 'Visualisez FinMate avec plusieurs thèmes de marque',
      themeLabel: 'Choisissez un thème'
    },
    home: {
      badge: 'FinMate for financial advisors',
      workflowBadge: 'Workflow simplifié',
      whyBadge: 'Vos avantages',
      featureIncluded: 'Inclus',
      titleLine1: 'Qualifiez vos clients plus vite.',
      titleLine2: 'Convertissez mieux vos rendez-vous.',
      subtitle:
        'FinMate aide les conseillers financiers à structurer la découverte client avec des questionnaires intelligents, un scoring clair et des insights exploitables.',
      ctaDemo: 'Voir la démo',
      ctaRegister: 'Créer un compte',
      statsPrep: 'Temps de préparation RDV',
      statsConversion: 'Taux de conversion',
      statsSaved: 'Gagnées par conseiller/semaine',
      workflowTitle: 'Un workflow simple pour vos rendez-vous',
      workflowSubtitle:
        'Invitez, analysez, priorisez. FinMate transforme les réponses client en plan de rendez-vous actionnable.',
      prepTitle: 'Préparation accélérée',
      prepDesc: 'Recevez les réponses avant l’appel et arrivez avec les bons sujets.',
      prioritiesTitle: 'Priorités claires',
      prioritiesDesc: 'Identifiez rapidement les besoins urgents et les opportunités de conseil.',
      followUpTitle: 'Suivi commercial',
      followUpDesc: 'Pilotez votre pipeline avec un tableau de bord client centralisé.',
      whyTitle: 'Pourquoi FinMate',
      whySubtitle: 'Un outil de productivité moderne pensé pour les cabinets de conseil financier',
      f1Title: 'Questionnaires personnalisables',
      f1Desc: 'Adaptez vos questions par thème, type de client et niveau de maturité financière.',
      f2Title: 'Scoring automatique',
      f2Desc: 'Obtenez un diagnostic rapide des forces et points de vigilance avant chaque échange.',
      f3Title: 'Gestion des invitations',
      f3Desc: 'Envoyez vos campagnes en quelques clics et suivez le statut des réponses client.',
      f4Title: 'Compatible avec votre process',
      f4Desc: 'Utilisez FinMate comme couche de qualification sans changer vos outils métier.',
      pricingTitle: 'Tarifs simples',
      pricingSubtitle: 'Choisissez la formule adaptée à votre volume de clients',
      soloDesc: 'Pour les indépendants',
      proDesc: 'Pour les conseillers actifs',
      cabinetDesc: 'Pour les équipes',
      monthly: '/mois',
      popular: 'POPULAIRE',
      ctaTitle: 'Prêt à accélérer votre cabinet',
      ctaSubtitle: 'Lancez FinMate et structurez vos rendez-vous clients en moins de 30 minutes.',
      ctaTry: 'Tester la démo',
      footer: '© 2026 FinMate. Tous droits réservés.'
    },
    sidebar: {
      overview: 'Aperçu',
      clients: 'Mes clients',
      invitations: 'Invitations',
      questionnaires: 'Questionnaires',
      questionBank: 'Banque de questions',
      analytics: 'Statistiques',
      settings: 'Paramètres',
      admin: 'Super Admin',
      freeVersion: 'Version gratuite',
      daysLeft: '14 jours restants',
      upgrade: 'Passer Pro'
    },
    dashboardLayout: {
      title: 'Tableau de bord',
      companyFallback: 'Votre cabinet',
      userFallback: 'Utilisateur'
    },
    auth: {
      loginTitle: 'Bon retour !',
      loginSubtitle: 'Connectez-vous à votre espace conseiller',
      remember: 'Se souvenir de moi',
      forgot: 'Mot de passe oublié ?',
      loginSubmit: 'Se connecter',
      loadingLogin: 'Connexion...',
      noAccount: 'Pas encore de compte ?',
      createAccount: 'Créer un compte gratuitement',
      demoAccount: 'Compte de démo',
      demoPassword: 'Mot de passe',
      registerTitle: 'Créer un compte',
      registerSubtitle: 'Commencez votre essai gratuit de 14 jours',
      fullName: 'Nom complet *',
      businessEmail: 'Email professionnel *',
      company: 'Société / Cabinet *',
      phone: 'Téléphone',
      password: 'Mot de passe *',
      confirmPassword: 'Confirmer le mot de passe *',
      min6: 'Minimum 8 caractères, avec majuscule, minuscule et chiffre',
      creating: 'Création...',
      createMyAccount: 'Créer mon compte',
      terms: 'En créant un compte, vous acceptez nos',
      cgu: 'CGU',
      privacy: 'Politique de confidentialité',
      hasAccount: 'Vous avez déjà un compte ?',
      goLogin: 'Se connecter',
      forgotTitle: 'Mot de passe oublié ?',
      forgotSubtitle: 'Entrez votre email et nous vous enverrons un lien de réinitialisation.',
      sendReset: 'Envoyer le lien de réinitialisation',
      sending: 'Envoi...',
      backToLogin: 'Retour à la connexion',
      resetSent: 'Email envoyé !',
      resetMessage: 'Nous avons envoyé un lien de réinitialisation à',
      continueWithGoogle: 'Continuer avec Google',
      or: 'ou'
    }
  },
  en: {
    common: {
      dashboard: 'Dashboard',
      logout: 'Log out',
      loggingOut: 'Logging out...',
      login: 'Log in',
      register: 'Sign up',
      settings: 'Settings'
    },
    language: {
      fr: 'FR',
      en: 'EN'
    },
    nav: {
      solution: 'Solution',
      demo: 'Demo',
      features: 'Features'
    },
    header: {
      backHome: 'Back to home'
    },
    demo: {
      title: 'Interactive demo',
      description: 'Preview FinMate with multiple brand themes',
      themeLabel: 'Choose a theme'
    },
    home: {
      badge: 'FinMate for financial advisors',
      workflowBadge: 'Workflow',
      whyBadge: 'Core features',
      featureIncluded: 'Included',
      titleLine1: 'Qualify clients faster.',
      titleLine2: 'Convert meetings better.',
      subtitle:
        'FinMate helps financial advisors structure client discovery with smart questionnaires, clear scoring, and actionable insights.',
      ctaDemo: 'View demo',
      ctaRegister: 'Create account',
      statsPrep: 'Meeting prep time',
      statsConversion: 'Conversion rate',
      statsSaved: 'Saved per advisor/week',
      workflowTitle: 'A simple workflow for every client meeting',
      workflowSubtitle:
        'Invite, analyze, prioritize. FinMate turns client answers into a clear action plan for your meetings.',
      prepTitle: 'Faster preparation',
      prepDesc: 'Get answers before the call and start with the right topics.',
      prioritiesTitle: 'Clear priorities',
      prioritiesDesc: 'Quickly identify urgent needs and advisory opportunities.',
      followUpTitle: 'Pipeline follow-up',
      followUpDesc: 'Track your pipeline in one centralized client dashboard.',
      whyTitle: 'Why FinMate',
      whySubtitle: 'A modern productivity tool built for financial advisory teams',
      f1Title: 'Custom questionnaires',
      f1Desc: 'Adapt questions by theme, client type, and financial maturity.',
      f2Title: 'Automatic scoring',
      f2Desc: 'Get a quick diagnosis of strengths and risk areas before each meeting.',
      f3Title: 'Invitation management',
      f3Desc: 'Send campaigns in a few clicks and track completion status.',
      f4Title: 'Fits your process',
      f4Desc: 'Use FinMate as a qualification layer without changing your stack.',
      pricingTitle: 'Simple pricing',
      pricingSubtitle: 'Pick the plan that fits your client volume',
      soloDesc: 'For independent advisors',
      proDesc: 'For active advisors',
      cabinetDesc: 'For teams',
      monthly: '/month',
      popular: 'POPULAR',
      ctaTitle: 'Ready to scale your advisory practice',
      ctaSubtitle: 'Start FinMate and structure your client meetings in less than 30 minutes.',
      ctaTry: 'Try demo',
      footer: '© 2026 FinMate. All rights reserved.'
    },
    sidebar: {
      overview: 'Overview',
      clients: 'Clients',
      invitations: 'Invitations',
      questionnaires: 'Questionnaires',
      questionBank: 'Question bank',
      analytics: 'Analytics',
      settings: 'Settings',
      admin: 'Super Admin',
      freeVersion: 'Free plan',
      daysLeft: '14 days left',
      upgrade: 'Upgrade to Pro'
    },
    dashboardLayout: {
      title: 'Dashboard',
      companyFallback: 'Your firm',
      userFallback: 'User'
    },
    auth: {
      loginTitle: 'Welcome back!',
      loginSubtitle: 'Sign in to your advisor workspace',
      remember: 'Remember me',
      forgot: 'Forgot password?',
      loginSubmit: 'Log in',
      loadingLogin: 'Signing in...',
      noAccount: "Don't have an account?",
      createAccount: 'Create a free account',
      demoAccount: 'Demo account',
      demoPassword: 'Password',
      registerTitle: 'Create an account',
      registerSubtitle: 'Start your 14-day free trial',
      fullName: 'Full name *',
      businessEmail: 'Business email *',
      company: 'Company / Firm *',
      phone: 'Phone',
      password: 'Password *',
      confirmPassword: 'Confirm password *',
      min6: 'Minimum 8 characters, with uppercase, lowercase, and number',
      creating: 'Creating...',
      createMyAccount: 'Create my account',
      terms: 'By creating an account, you agree to our',
      cgu: 'Terms',
      privacy: 'Privacy policy',
      hasAccount: 'Already have an account?',
      goLogin: 'Sign in',
      forgotTitle: 'Forgot password?',
      forgotSubtitle: 'Enter your email and we will send you a reset link.',
      sendReset: 'Send reset link',
      sending: 'Sending...',
      backToLogin: 'Back to login',
      resetSent: 'Email sent!',
      resetMessage: 'We sent a reset link to',
      continueWithGoogle: 'Continue with Google',
      or: 'or'
    }
  }
}

const getByPath = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj)

const resolveInitialLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'fr' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(resolveInitialLanguage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, fallback = key) => getByPath(translations[language], key) ?? fallback,
      tr: (fr, en) => (language === 'fr' ? fr : en)
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
