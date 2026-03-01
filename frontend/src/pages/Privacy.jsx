import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Privacy() {
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
            <ShieldCheck className="w-7 h-7 text-emerald-700" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {tr('Politique de confidentialite', 'Privacy Policy')}
            </h1>
          </div>

          <p className="text-sm text-slate-500 mb-8">
            {tr('Derniere mise a jour : 1 mars 2026', 'Last updated: March 1, 2026')}
          </p>

          <section className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              {tr(
                "FinMate est un outil de qualification client pour les conseillers financiers. Cette page explique quelles donnees nous traitons, pourquoi, et quels sont vos droits.",
                'FinMate is a client qualification tool for financial advisors. This page explains which data we process, why, and what your rights are.'
              )}
            </p>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('1. Donnees collectees', '1. Data we collect')}
              </h2>
              <p>
                {tr(
                  "Nous pouvons traiter les informations de compte (nom, email, societe), les donnees de clients que vous saisissez dans l'application, et les donnees techniques necessaires au fonctionnement (logs, securite, diagnostics).",
                  'We may process account information (name, email, company), client data you enter in the app, and technical data required for operation (logs, security, diagnostics).'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('2. Finalites', '2. Purposes')}
              </h2>
              <p>
                {tr(
                  "Les donnees sont utilisees pour fournir le service FinMate, authentifier les utilisateurs, envoyer des invitations, produire des analyses, et assurer la securite de la plateforme.",
                  'Data is used to provide the FinMate service, authenticate users, send invitations, generate analytics, and keep the platform secure.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('3. Base legale', '3. Legal basis')}
              </h2>
              <p>
                {tr(
                  "Le traitement repose sur l'execution du service, votre consentement lorsque requis, et notre interet legitime de securiser et ameliorer l'application.",
                  'Processing relies on service delivery, your consent when required, and our legitimate interest in securing and improving the application.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('4. Conservation', '4. Retention')}
              </h2>
              <p>
                {tr(
                  "Les donnees sont conservees pendant la duree necessaire a la fourniture du service et au respect des obligations legales, puis supprimees ou anonymisees.",
                  'Data is retained for as long as needed to deliver the service and meet legal obligations, then deleted or anonymized.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('5. Partage', '5. Sharing')}
              </h2>
              <p>
                {tr(
                  "Nous ne vendons pas vos donnees. Certaines donnees peuvent etre traitees par nos sous-traitants techniques (hebergement, paiements, email transactionnel) strictement pour exploiter le service.",
                  'We do not sell your data. Some data may be processed by technical providers (hosting, payments, transactional email) strictly to operate the service.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('6. Vos droits', '6. Your rights')}
              </h2>
              <p>
                {tr(
                  "Vous pouvez demander l'acces, la rectification, la suppression, la limitation ou l'export de vos donnees, selon la reglementation applicable (dont RGPD).",
                  'You may request access, correction, deletion, restriction, or export of your data, depending on applicable regulations (including GDPR).'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('7. Contact', '7. Contact')}
              </h2>
              <p>
                {tr(
                  'Pour toute demande relative a la confidentialite, contactez-nous a : bankquest.pro@gmail.com',
                  'For any privacy request, contact us at: bankquest.pro@gmail.com'
                )}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
