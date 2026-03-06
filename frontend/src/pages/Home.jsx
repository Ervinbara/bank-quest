import { Link } from 'react-router-dom'
import { Clock3, Target, TrendingUp, ArrowRight } from 'lucide-react'
import Header from '@/components/Layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t, tr } = useLanguage()

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-300/20 blur-3xl animate-float-soft" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-float-soft" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center finance-animate-in">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
              <span className="text-sm font-semibold">{t('home.badge')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {tr('Qualifiez vos clients plus vite.', 'Qualify your clients faster.')}
              <br />
              {tr('Convertissez mieux vos rendez-vous.', 'Convert your meetings better.')}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
              {tr(
                'FinMate aide les conseillers financiers à structurer la découverte client avec des questionnaires intelligents, un scoring clair et des insights exploitables.',
                'FinMate helps financial advisors structure client discovery with smart questionnaires, clear scoring, and actionable insights.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/demo"
                className="w-full sm:w-auto text-center bg-white text-emerald-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                {tr('Voir une démo en 60 secondes', 'Watch a 60-second demo')}
              </Link>
              <Link
                to="/auth/register"
                className="w-full sm:w-auto text-center bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-white/10 transition"
              >
                {tr('Lancer une simulation client', 'Run a client simulation')}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">-30%</div>
                <div className="text-white/80">{t('home.statsPrep')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">+22%</div>
                <div className="text-white/80">{t('home.statsConversion')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">+2h</div>
                <div className="text-white/80">{t('home.statsSaved')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="solution" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 finance-animate-in">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-4">
              {tr('Démo conseiller', 'Advisor demo')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {tr('Comment vous utilisez FinMate au quotidien', 'How you use FinMate every day')}
            </h2>
            <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto">
              {tr('Un parcours simple en 3 étapes, orienté rendez-vous et conversion.', 'A simple 3-step flow focused on meetings and conversion.')}
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-6 md:gap-4">
            <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 z-0" />

            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-1">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Clock3 className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.prepTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{tr('J’envoie un questionnaire en 1 clic.', 'I send a questionnaire in 1 click.')}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {tr('Gain: qualification immédiate avant l’appel.', 'Gain: instant qualification before the call.')}
              </p>
            </div>

            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-2">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-200">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.prioritiesTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {tr('Je reçois un score, 3 priorités et les points de vigilance.', 'I get a score, top 3 priorities, and risk points.')}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {tr('Gain: préparation plus rapide et rendez-vous plus pertinent.', 'Gain: faster prep and more relevant meetings.')}
              </p>
            </div>

            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-3">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.followUpTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {tr('Je relance au bon moment et je compare la progression au fil des rendez-vous.', 'I follow up at the right time and track progress across meetings.')}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                {tr('Gain: meilleure conversion et suivi portefeuille structuré.', 'Gain: better conversion and structured portfolio follow-up.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 finance-animate-in">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-4">
              {tr('Impact business', 'Business impact')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              {tr('Pourquoi les conseillers adoptent FinMate', 'Why advisors adopt FinMate')}
            </h2>
            <p className="text-lg sm:text-xl text-slate-500">{tr('Moins de friction, plus de valeur en rendez-vous.', 'Less friction, more value in every meeting.')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 finance-animate-in finance-animate-delay-1">
              <p className="text-4xl font-extrabold text-emerald-700 mb-2">-30%</p>
              <p className="text-sm text-slate-600">{tr('Temps de préparation par RDV', 'Meeting prep time')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 finance-animate-in finance-animate-delay-2">
              <p className="text-4xl font-extrabold text-emerald-700 mb-2">+22%</p>
              <p className="text-sm text-slate-600">{tr('Conversion rendez-vous', 'Meeting conversion')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 finance-animate-in finance-animate-delay-3">
              <p className="text-4xl font-extrabold text-emerald-700 mb-2">+2h</p>
              <p className="text-sm text-slate-600">{tr('Gagnées par conseiller / semaine', 'Saved per advisor / week')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center text-emerald-900 font-semibold">
            {tr(
              'Ce n’est pas un quiz. C’est un pré-diagnostic commercial pour mieux conseiller et mieux convertir.',
              'This is not just a quiz. It is a pre-sales diagnosis to advise better and convert better.'
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/demo" className="btn-primary px-5 py-2.5">
              {tr('Voir une fiche client réelle', 'See a real client profile')}
            </Link>
            <Link to="/auth/register" className="btn-secondary px-5 py-2.5">
              {tr('Créer mon compte', 'Create my account')}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{t('home.pricingTitle')}</h2>
            <p className="text-lg sm:text-xl text-gray-600">{t('home.pricingSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="surface-glass p-8 hover:border-emerald-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Solo</h3>
              <p className="text-gray-600 mb-6">{t('home.soloDesc')}</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                19.99 EUR<span className="text-lg text-gray-600">{t('home.monthly')}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-2xl p-8 transform md:scale-105 shadow-2xl animate-sheen">
              <div className="bg-amber-300 text-slate-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">{t('home.popular')}</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-emerald-100 mb-6">{t('home.proDesc')}</p>
              <div className="text-4xl font-bold mb-6">
                49.99 EUR<span className="text-lg text-emerald-200">{t('home.monthly')}</span>
              </div>
            </div>

            <div className="surface-glass p-8 hover:border-emerald-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Cabinet</h3>
              <p className="text-gray-600 mb-6">{t('home.cabinetDesc')}</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                99.99 EUR<span className="text-lg text-gray-600">{t('home.monthly')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-lg sm:text-xl mb-8 text-emerald-100">{t('home.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="w-full sm:w-auto text-center bg-white text-emerald-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              {t('home.ctaRegister')}
            </Link>
            <Link
              to="/demo"
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              {t('home.ctaTry')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">{t('home.footer')}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-sm">
            <Link to="/privacy" className="text-emerald-300 hover:text-emerald-200">
              {t('auth.privacy')}
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/terms" className="text-emerald-300 hover:text-emerald-200">
              {t('auth.cgu')}
            </Link>
            <span className="text-gray-500">|</span>
            <Link to="/support" className="text-emerald-300 hover:text-emerald-200">
              {t('Support', 'Support')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
