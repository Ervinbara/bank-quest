import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function AccountDeletion() {
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
            <Trash2 className="w-7 h-7 text-red-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {tr('Suppression de compte', 'Account deletion')}
            </h1>
          </div>

          <p className="text-slate-700">
            {tr(
              'Vous pouvez supprimer votre compte directement depuis FinMate.',
              'You can delete your account directly from FinMate.'
            )}
          </p>

          <ol className="list-decimal pl-5 text-slate-700 space-y-2">
            <li>{tr('Connectez-vous a votre compte.', 'Sign in to your account.')}</li>
            <li>{tr('Ouvrez Paramètres > Sécurité.', 'Open Settings > Security.')}</li>
            <li>{tr('Cliquez sur "Supprimer mon compte".', 'Click "Delete my account".')}</li>
            <li>
              {tr(
                'Confirmez la suppression (action definitive).',
                'Confirm deletion (permanent action).'
              )}
            </li>
          </ol>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
            {tr(
              'La suppression efface votre compte conseiller et les donnees associees (clients, invitations, questionnaires, analytics).',
              'Deletion removes your advisor account and associated data (clients, invitations, questionnaires, analytics).'
            )}
          </div>

          <p className="text-sm text-slate-600">
            {tr(
              'En cas de blocage d acces, contactez: bankquest.pro@gmail.com',
              'If you cannot access your account, contact: bankquest.pro@gmail.com'
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
