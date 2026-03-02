import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Terms() {
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-7 h-7 text-emerald-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {tr("Conditions d'utilisation", 'Terms of Service')}
            </h1>
          </div>

          <p className="text-sm text-slate-500 mb-8">
            {tr('Derniere mise a jour : 2 mars 2026', 'Last updated: March 2, 2026')}
          </p>

          <section className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              {tr(
                "Ces conditions regissent l'utilisation de FinMate. En utilisant le service, vous acceptez ces conditions.",
                'These terms govern use of FinMate. By using the service, you agree to these terms.'
              )}
            </p>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('1. Service', '1. Service')}
              </h2>
              <p>
                {tr(
                  "FinMate fournit des fonctionnalites de gestion client, questionnaires et analyses pour les conseillers financiers.",
                  'FinMate provides client management, questionnaire, and analytics features for financial advisors.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('2. Compte utilisateur', '2. User account')}
              </h2>
              <p>
                {tr(
                  "Vous etes responsable de la confidentialite de vos identifiants et des activites effectuees sur votre compte.",
                  'You are responsible for keeping your credentials confidential and for activity performed on your account.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('3. Usage autorise', '3. Allowed use')}
              </h2>
              <p>
                {tr(
                  "Vous vous engagez a utiliser FinMate de maniere legale, sans tentative d'acces non autorise ni usage malveillant.",
                  'You agree to use FinMate lawfully, without unauthorized access attempts or malicious usage.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('4. Facturation', '4. Billing')}
              </h2>
              <p>
                {tr(
                  "Les abonnements, renouvellements, changements de plan et resiliations sont geres selon les modalites affichees dans l'interface et le portail de facturation.",
                  'Subscriptions, renewals, plan changes, and cancellations are managed according to the terms shown in the app and billing portal.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('5. Disponibilite', '5. Availability')}
              </h2>
              <p>
                {tr(
                  "Nous mettons en oeuvre des efforts raisonnables pour assurer la disponibilite du service, sans garantie d'absence totale d'interruption.",
                  'We use reasonable efforts to keep the service available, without guaranteeing zero interruption.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('6. Responsabilite', '6. Liability')}
              </h2>
              <p>
                {tr(
                  "FinMate est un outil d'aide a l'organisation et ne constitue pas un conseil financier, juridique ou fiscal.",
                  'FinMate is an organization tool and does not constitute financial, legal, or tax advice.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('7. Contact', '7. Contact')}
              </h2>
              <p>
                {tr(
                  "Pour toute question sur ces conditions : bankquest.pro@gmail.com",
                  'For any question about these terms: bankquest.pro@gmail.com'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('8. Donnees personnelles', '8. Personal data')}
              </h2>
              <p>
                {tr(
                  "Le traitement des donnees personnelles est detaille dans la Politique de confidentialite. L'utilisateur reste responsable des donnees clients qu'il importe dans FinMate.",
                  'Personal data processing is detailed in the Privacy Policy. The user remains responsible for client data imported into FinMate.'
                )}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
