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
            {tr('Derniere mise a jour : 2 mars 2026', 'Last updated: March 2, 2026')}
          </p>

          <section className="space-y-6 text-slate-700 leading-relaxed">
            <p>
              {tr(
                'FinMate est un service SaaS de qualification client pour conseillers financiers. Cette politique detaille le traitement de vos donnees personnelles au sens du RGPD.',
                'FinMate is a SaaS client qualification platform for financial advisors. This policy details personal data processing under GDPR.'
              )}
            </p>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('1. Responsable du traitement', '1. Data controller')}
              </h2>
              <p>
                {tr(
                  'Le responsable du traitement est FinMate. Contact: bankquest.pro@gmail.com',
                  'The data controller is FinMate. Contact: bankquest.pro@gmail.com'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('2. Donnees traitees', '2. Processed data')}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>{tr('Compte conseiller: nom, email, societe, telephone.', 'Advisor account: name, email, company, phone.')}</li>
                <li>{tr('Donnees clients saisies dans FinMate.', 'Client data entered in FinMate.')}</li>
                <li>{tr('Resultats de quiz, scoring et suivi commercial.', 'Quiz results, scoring and sales follow-up.')}</li>
                <li>{tr('Donnees techniques de securite (logs, diagnostics).', 'Technical security data (logs, diagnostics).')}</li>
                <li>{tr('Donnees de facturation Stripe (references, statut).', 'Stripe billing data (references, status).')}</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('3. Finalites et bases legales', '3. Purposes and legal bases')}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>{tr('Execution du contrat: acces a la plateforme et gestion des comptes.', 'Contract performance: platform access and account management.')}</li>
                <li>{tr('Interet legitime: securite, prevention de fraude, amelioration du service.', 'Legitimate interest: security, fraud prevention, service improvement.')}</li>
                <li>{tr('Obligation legale: conservation des donnees liees a la facturation.', 'Legal obligation: retention of billing-related records.')}</li>
                <li>{tr('Consentement: communications marketing optionnelles.', 'Consent: optional marketing communications.')}</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('4. Sous-traitants', '4. Processors')}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>{tr('Supabase: base de donnees, authentification, fonctions serveur.', 'Supabase: database, authentication, server functions.')}</li>
                <li>{tr('Stripe: gestion des paiements et abonnements.', 'Stripe: payment and subscription management.')}</li>
                <li>{tr('Fournisseurs email transactionnel (Mailjet/Brevo selon configuration).', 'Transactional email providers (Mailjet/Brevo depending on configuration).')}</li>
                <li>{tr('Vercel: hebergement de l application web.', 'Vercel: web application hosting.')}</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('5. Durees de conservation', '5. Retention periods')}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>{tr('Donnees de compte: pendant la duree du compte actif.', 'Account data: while account is active.')}</li>
                <li>{tr('Donnees clients et quiz: jusqu a suppression du compte ou demande explicite.', 'Client and quiz data: until account deletion or explicit request.')}</li>
                <li>{tr('Donnees de facturation: selon obligations fiscales et comptables applicables.', 'Billing data: according to applicable tax/accounting obligations.')}</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('6. Vos droits RGPD', '6. Your GDPR rights')}
              </h2>
              <p>
                {tr(
                  'Depuis Parametres > Securite, vous pouvez exporter vos donnees (JSON) et supprimer votre compte. Vous pouvez aussi demander rectification, limitation ou opposition en contactant bankquest.pro@gmail.com.',
                  'From Settings > Security, you can export your data (JSON) and delete your account. You can also request rectification, restriction or objection by contacting bankquest.pro@gmail.com.'
                )}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {tr('7. Securite', '7. Security')}
              </h2>
              <p>
                {tr(
                  'FinMate applique des controles techniques (authentification, cloisonnement des donnees, journalisation) pour proteger vos informations.',
                  'FinMate applies technical safeguards (authentication, data isolation, logging) to protect your information.'
                )}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

