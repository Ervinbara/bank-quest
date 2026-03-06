import { Link } from 'react-router-dom'
import { Clock3, Target, TrendingUp, Settings, ArrowRight, ClipboardList, BarChart3, Send, CheckCircle2 } from 'lucide-react'
import Header from '@/components/Layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()

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
              {t('home.titleLine1')}
              <br />
              {t('home.titleLine2')}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">{t('home.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/demo"
                className="w-full sm:w-auto text-center bg-white text-emerald-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                {t('home.ctaDemo')}
              </Link>
              <Link
                to="/auth/register"
                className="w-full sm:w-auto text-center bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-white/10 transition"
              >
                {t('home.ctaRegister')}
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
              {t('home.workflowBadge', 'Workflow')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('home.workflowTitle')}</h2>
            <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto">{t('home.workflowSubtitle')}</p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-6 md:gap-4">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-0.5 bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 z-0" />

            {/* Step 1 */}
            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-1">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Clock3 className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.prepTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.prepDesc')}</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-2">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-200">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.prioritiesTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.prioritiesDesc')}</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300 finance-animate-in finance-animate-delay-3">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('home.followUpTitle')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.followUpDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 finance-animate-in">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-4 py-1.5 mb-4">
              {t('home.whyBadge', 'Fonctionnalites')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('home.whyTitle')}</h2>
            <p className="text-lg sm:text-xl text-slate-500">{t('home.whySubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* f1 */}
            <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all duration-300 finance-animate-in finance-animate-delay-1">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.f1Title')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.f1Desc')}</p>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.featureIncluded', 'Inclus')}</span>
              </div>
            </div>

            {/* f2 */}
            <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-hidden hover:border-teal-200 hover:shadow-md transition-all duration-300 finance-animate-in finance-animate-delay-2">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-teal-500 to-cyan-400" />
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-5 group-hover:bg-teal-100 transition-colors">
                <BarChart3 className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.f2Title')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.f2Desc')}</p>
              <div className="mt-4 flex items-center gap-1.5 text-teal-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.featureIncluded', 'Inclus')}</span>
              </div>
            </div>

            {/* f3 */}
            <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all duration-300 finance-animate-in finance-animate-delay-3">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <Send className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.f3Title')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.f3Desc')}</p>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.featureIncluded', 'Inclus')}</span>
              </div>
            </div>

            {/* f4 */}
            <div className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-hidden hover:border-slate-200 hover:shadow-md transition-all duration-300 finance-animate-in finance-animate-delay-4">
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-slate-400 to-slate-600" />
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-5 group-hover:bg-slate-100 transition-colors">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('home.f4Title')}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{t('home.f4Desc')}</p>
              <div className="mt-4 flex items-center gap-1.5 text-slate-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.featureIncluded', 'Inclus')}</span>
              </div>
            </div>
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
              <div className="bg-amber-300 text-slate-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                {t('home.popular')}
              </div>
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


