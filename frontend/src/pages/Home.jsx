import { Link } from 'react-router-dom'
import { Clock3, Target, TrendingUp, Settings, ArrowRight } from 'lucide-react'
import Header from '@/components/Layout/Header'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-700 text-white py-20 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-300/20 blur-3xl animate-float-soft" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl animate-float-soft" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center finance-animate-in">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
              <span className="text-sm font-semibold">{t('home.badge')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('home.titleLine1')}
              <br />
              {t('home.titleLine2')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">{t('home.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/demo"
                className="bg-white text-emerald-700 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:-translate-y-1"
              >
                {t('home.ctaDemo')}
              </Link>
              <Link
                to="/auth/register"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
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

      <section id="solution" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('home.workflowTitle')}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('home.workflowSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center card finance-animate-in finance-animate-delay-1">
              <Clock3 className="w-12 h-12 mx-auto mb-4 text-emerald-700" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('home.prepTitle')}</h3>
              <p className="text-gray-600">{t('home.prepDesc')}</p>
            </div>
            <div className="text-center card finance-animate-in finance-animate-delay-2">
              <Target className="w-12 h-12 mx-auto mb-4 text-emerald-700" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('home.prioritiesTitle')}</h3>
              <p className="text-gray-600">{t('home.prioritiesDesc')}</p>
            </div>
            <div className="text-center card finance-animate-in finance-animate-delay-3">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-emerald-700" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('home.followUpTitle')}</h3>
              <p className="text-gray-600">{t('home.followUpDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('home.whyTitle')}</h2>
            <p className="text-xl text-gray-600">{t('home.whySubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="card finance-animate-in finance-animate-delay-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.f1Title')}</h3>
              <p className="text-gray-600">{t('home.f1Desc')}</p>
            </div>

            <div className="card finance-animate-in finance-animate-delay-2">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.f2Title')}</h3>
              <p className="text-gray-600">{t('home.f2Desc')}</p>
            </div>

            <div className="card finance-animate-in finance-animate-delay-3">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.f3Title')}</h3>
              <p className="text-gray-600">{t('home.f3Desc')}</p>
            </div>

            <div className="card finance-animate-in finance-animate-delay-2">
              <Settings className="w-12 h-12 text-emerald-700 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.f4Title')}</h3>
              <p className="text-gray-600">{t('home.f4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">{t('home.pricingTitle')}</h2>
            <p className="text-xl text-gray-600">{t('home.pricingSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="surface-glass p-8 hover:border-emerald-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Solo</h3>
              <p className="text-gray-600 mb-6">{t('home.soloDesc')}</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                19 EUR<span className="text-lg text-gray-600">{t('home.monthly')}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-2xl p-8 transform md:scale-105 shadow-2xl animate-sheen">
              <div className="bg-amber-300 text-slate-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                {t('home.popular')}
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-emerald-100 mb-6">{t('home.proDesc')}</p>
              <div className="text-4xl font-bold mb-6">
                49 EUR<span className="text-lg text-emerald-200">{t('home.monthly')}</span>
              </div>
            </div>

            <div className="surface-glass p-8 hover:border-emerald-600 transition-all">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Cabinet</h3>
              <p className="text-gray-600 mb-6">{t('home.cabinetDesc')}</p>
              <div className="text-4xl font-bold text-gray-800 mb-6">
                99 EUR<span className="text-lg text-gray-600">{t('home.monthly')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-xl mb-8 text-emerald-100">{t('home.ctaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-emerald-700 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              {t('home.ctaRegister')}
            </Link>
            <Link
              to="/demo"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              {t('home.ctaTry')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  )
}

