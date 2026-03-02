import { Link } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Support() {
  const { tr } = useLanguage()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-slate-900">
            FM <span className="text-emerald-700">FinMate</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-emerald-700 hover:underline">
            {tr('Retour accueil', 'Back home')}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-7 h-7 text-emerald-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {tr('Support FinMate', 'FinMate support')}
            </h1>
          </div>

          <p className="text-slate-700">
            {tr(
              'Besoin d aide sur le compte, la facturation, la securite ou les donnees personnelles ?',
              'Need help with account, billing, security, or personal data?'
            )}
          </p>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">{tr('Contact principal', 'Primary contact')}</p>
            <p className="text-slate-700">bankquest.pro@gmail.com</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-900">{tr('Liens utiles', 'Useful links')}</p>
            <ul className="mt-2 space-y-1 text-emerald-700">
              <li>
                <Link to="/privacy" className="hover:underline">
                  {tr('Politique de confidentialite', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:underline">
                  {tr("Conditions d'utilisation", 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link to="/account-deletion" className="hover:underline">
                  {tr('Suppression de compte', 'Account deletion')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
