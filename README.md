# FinMate (ex Bank Quest)

Application SaaS pour conseillers financiers:
- qualification client via quiz
- gestion clients/invitations
- analytics de suivi commercial
- abonnement Stripe
- traduction FR/EN
- distribution web + PWA + TWA Android

## 1) Stack technique
- Frontend: React 19, Vite 7, React Router 7, Tailwind CSS
- Backend: Supabase (Postgres, Auth, Realtime, Edge Functions)
- Paiements: Stripe (test/live)
- Traduction: Edge Function avec fallback providers
- Mobile: PWA + TWA (Bubblewrap)

## 2) Arborescence
```txt
bank-quest/
  README.md
  frontend/
    package.json
    vite.config.js
    public/
      .well-known/assetlinks.json
    scripts/
      update-assetlinks.mjs
    src/
      App.jsx
      main.jsx
      lib/supabase.js
      contexts/
        AuthContext.jsx
        LanguageContext.jsx
      services/
        authService.js
        billingService.js
        clientService.js
        invitationEmailService.js
        privacyService.js
        questionnaireService.js
        translationService.js
      pages/
        Home.jsx
        Demo.jsx
        ClientQuiz.jsx
        Privacy.jsx
        Terms.jsx
        Support.jsx
        AccountDeletion.jsx
        Auth/
          Login.jsx
          Register.jsx
          ForgotPassword.jsx
        Dashboard/
          Overview.jsx
          Clients.jsx
          ClientDetail.jsx
          Invitations.jsx
          Questionnaires.jsx
          QuestionBank.jsx
          Analytics.jsx
          Settings.jsx
      components/
        ProtectedRoute.jsx
        LanguageSwitcher.jsx
        common/AppTelemetry.jsx
        common/CookieConsentBanner.jsx
        common/PaginationControls.jsx
        Dashboard/
          DashboardLayout.jsx
          Sidebar.jsx
          DashboardGuide.jsx
          StatsCard.jsx
          ClientCard.jsx
          ClientDetailModal.jsx
          InviteClientModal.jsx
          ImportClientsModal.jsx
          SettingsTabs.jsx
      data/
        dashboardGuides.js
        clientQuizQuestions.js
        scenarios.js
        themes.js
  supabase/
    migrations/
      001_...sql -> 013_...sql
    functions/
      delete-account/
      send-invitation-email/
      stripe-checkout/
      stripe-customer-portal/
      stripe-sync-subscription/
      stripe-webhook/
      submit-quiz-result/
      translate-text/
```

## 3) Blocs principaux
### Frontend
- `contexts/AuthContext.jsx`: session, profil advisor, login/register/logout, OAuth Google.
- `contexts/LanguageContext.jsx`: i18n FR/EN, helper `tr(fr, en)`.
- `services/authService.js`: auth Supabase + creation profil advisor + consentement legal.
- `services/auditService.js`: journalisation des evenements sensibles (audit trail).
- `services/clientService.js`: CRUD clients, invitations, analytics, quiz public.
- `services/privacyService.js`: export RGPD JSON et suppression de compte.
- `pages/Dashboard/Settings.jsx`: profil, securite, abonnement, actions RGPD.
- `components/common/CookieConsentBanner.jsx`: banner cookies necessaires/analytiques avec sync profil.
- `components/common/AppTelemetry.jsx`: capture erreurs frontend (`error`, `unhandledrejection`) vers audit logs.

### Supabase
- `migrations`: schema SQL versionne + politiques RLS.
- `migrations/013_audit_and_consent_hardening.sql`:
  - table `advisor_consent_events`
  - table `advisor_audit_logs`
  - RPC `log_advisor_event(...)`
  - champs advisor `analytics_cookies_enabled`, `analytics_cookies_updated_at`, `marketing_opt_in_updated_at`
- `functions/stripe-*`: checkout, portail client, webhook, sync abonnement.
- `functions/send-invitation-email`: envoi email transactionnel.
- `functions/translate-text`: traduction automatique avec guardrails.
- `functions/submit-quiz-result`: soumission quiz publique securisee par token invitation.
- `functions/delete-account`: suppression compte auth + donnees metier.

## 4) Variables d'environnement
### Frontend (`frontend/.env.local`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Edge Function secrets
#### Stripe
- `STRIPE_MODE=test|live`
- `STRIPE_SECRET_KEY_TEST`
- `STRIPE_SECRET_KEY_LIVE`
- `STRIPE_PRICE_SOLO_MONTHLY_TEST`
- `STRIPE_PRICE_PRO_MONTHLY_TEST`
- `STRIPE_PRICE_CABINET_MONTHLY_TEST`
- `STRIPE_PRICE_TEST_MONTHLY_TEST` (optionnel)
- `STRIPE_PRICE_SOLO_MONTHLY_LIVE`
- `STRIPE_PRICE_PRO_MONTHLY_LIVE`
- `STRIPE_PRICE_CABINET_MONTHLY_LIVE`
- `STRIPE_PRICE_TEST_MONTHLY_LIVE` (optionnel)
- `STRIPE_WEBHOOK_SECRET_TEST`
- `STRIPE_WEBHOOK_SECRET_LIVE`
- `APP_URL`

#### Email
- `EMAIL_PROVIDER_ORDER`
- `EMAIL_FROM_ADDRESS`
- `MAILJET_API_KEY`
- `MAILJET_SECRET_KEY`
- `BREVO_API_KEY`

#### Traduction
- `TRANSLATION_MODE=enabled|disabled`
- `TRANSLATION_PROVIDER_ORDER`
- `TRANSLATION_MAX_CHARS_PER_REQUEST`
- `TRANSLATION_HARD_MONTHLY_LIMIT`
- `DEEPL_API_KEY`
- `LIBRETRANSLATE_URL`
- `LIBRETRANSLATE_API_KEY` (optionnel)
- `GOOGLE_TRANSLATE_API_KEY`
- `GOOGLE_TRANSLATE_ALLOW_BILLING`

## 5) Commandes
### Frontend
Depuis `frontend/`:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### Supabase
Depuis la racine:
- `npx supabase link --project-ref <project_ref>`
- `npx supabase db push`
- `npx supabase functions deploy send-invitation-email`
- `npx supabase functions deploy stripe-checkout --no-verify-jwt`
- `npx supabase functions deploy stripe-customer-portal --no-verify-jwt`
- `npx supabase functions deploy stripe-sync-subscription --no-verify-jwt`
- `npx supabase functions deploy stripe-webhook --no-verify-jwt`
- `npx supabase functions deploy translate-text --no-verify-jwt`
- `npx supabase functions deploy submit-quiz-result --no-verify-jwt`
- `npx supabase functions deploy delete-account`

## 6) Routes
### Publiques
- `/`
- `/demo`
- `/quiz/:token` (nouveau lien invitation)
- `/quiz/:clientId?token=...` (compat legacy)
- `/privacy`
- `/terms`
- `/support`
- `/account-deletion`

### Auth
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`

### Dashboard (protege)
- `/dashboard`
- `/dashboard/clients`
- `/dashboard/clients/:clientId`
- `/dashboard/invitations`
- `/dashboard/questionnaires`
- `/dashboard/question-bank`
- `/dashboard/analytics`
- `/dashboard/settings`

## 7) RGPD (etat actuel)
- Consentement explicite obligatoire en inscription:
  - CGU acceptees
  - Politique de confidentialite acceptee
- Horodatage des consentements stocke en base:
  - `terms_accepted_at`
  - `privacy_accepted_at`
  - `terms_version`
  - `privacy_policy_version`
  - `marketing_opt_in`
  - `marketing_opt_in_updated_at`
  - `analytics_cookies_enabled`
  - `analytics_cookies_updated_at`
- Journal des consentements:
  - `advisor_consent_events` (type, statut, version legale, metadata)
- Journal d'audit:
  - `advisor_audit_logs` (action, categorie, severite, metadata, horodatage)
- RLS activee sur tables metier principales (migration `012_rgpd_foundation.sql`).
- Export des donnees utilisateur en JSON depuis `Parametres > Securite`.
- Suppression definitive de compte depuis `Parametres > Securite`.
- Politique de confidentialite detaillee exposee sur `/privacy`.
- Page support publique exposee sur `/support`.
- Procedure publique de suppression de compte exposee sur `/account-deletion`.

## 7.1) Plans & droits
- `none` (gratuit): jusqu'a 5 clients, generation de liens invitation, pas d'envoi email invitation depuis la plateforme.
- `solo`: 19.99 EUR/mois, jusqu'a 50 clients, 100 emails invitation / mois.
- `pro`: 49.99 EUR/mois, jusqu'a 200 clients, 500 emails invitation / mois.
- `cabinet`: 99.99 EUR/mois, clients illimites, 2000 emails invitation / mois.
- `test`: plan interne pour compte(s) autorise(s), clients et emails invitation illimites.

## 8) Google OAuth (production)
1. Creer un client OAuth 2.0 Web dans Google Cloud.
2. Ajouter callback Supabase:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
3. Dans Supabase > Auth > Sign In / Providers > Google:
   - activer
   - renseigner Client ID + Client Secret
4. Verifier `Site URL` + `Redirect URLs` dans Supabase Auth.

## 9) PWA / TWA / Play Store
- PWA: config dans `frontend/vite.config.js`.
- TWA manifest: `frontend/android-twa/twa-manifest.json`.
- AAB attendu:
  - `frontend/android-twa/app/build/outputs/bundle/release/app-release.aab`

Scripts utiles:
- `npm run twa:doctor`
- `npm run twa:init`
- `npm run twa:build`
- `npm run twa:assetlinks`

## 10) Maintenance repo
- Ne jamais committer de secrets.
- `supabase/.temp/` doit rester ignore.
- Garder les migrations idempotentes et incrementales.
- Verifier `npm run build` avant push.
- Mettre a jour ce README a chaque feature.
