# FinMate (ex Bank Quest)

Application SaaS pour conseillers financiers:
- qualification client via quiz
- gestion des clients/invitations
- analytics de suivi commercial
- abonnement Stripe
- traduction FR/EN + traduction automatique
- distribution web + PWA + TWA Android (Play Store)

## 1) Stack technique

- Frontend: React 19, Vite 7, React Router 7, Tailwind CSS
- Backend: Supabase (Postgres, Auth, Realtime, Edge Functions)
- Paiements: Stripe (test/live)
- Traduction: Edge Function avec fallback providers
- Mobile: PWA + TWA (Bubblewrap)

## 2) Arborescence du projet

```
bank-quest/
  .gitignore
  README.md
  frontend/
    package.json
    vite.config.js
    scripts/
      update-assetlinks.mjs
    public/
      .well-known/
        assetlinks.json
    src/
      main.jsx
      App.jsx
      lib/
        supabase.js
      contexts/
        AuthContext.jsx
        LanguageContext.jsx
      services/
        authService.js
        clientService.js
        questionnaireService.js
        billingService.js
        invitationEmailService.js
        translationService.js
      components/
        ProtectedRoute.jsx
        LanguageSwitcher.jsx
        common/
          PaginationControls.jsx
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
      pages/
        Home.jsx
        Demo.jsx
        ClientQuiz.jsx
        Privacy.jsx
        Terms.jsx
        NotFound.jsx
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
      data/
        dashboardGuides.js
        clientQuizQuestions.js
        scenarios.js
        themes.js
  supabase/
    migrations/
      001_...sql -> 011_...sql
    functions/
      send-invitation-email/
      stripe-checkout/
      stripe-customer-portal/
      stripe-sync-subscription/
      stripe-webhook/
      translate-text/
    STRIPE_SETUP.md
    TRANSLATION_SETUP.md
```

## 3) Ce que fait chaque bloc

### `frontend/src/App.jsx`
- Déclare toutes les routes publiques/auth/dashboard.
- Protège `/dashboard/*` via `ProtectedRoute`.

### `frontend/src/contexts`
- `AuthContext.jsx`: session utilisateur, profil advisor, login/register/logout, OAuth Google.
- `LanguageContext.jsx`: i18n FR/EN, fonction `tr(fr, en)`.

### `frontend/src/services`
- `authService.js`: auth Supabase (email/password + OAuth).
- `clientService.js`: coeur métier clients (CRUD, invitations, suivi, analytics, quiz).
- `questionnaireService.js`: gestion banque de questions/questionnaires.
- `billingService.js`: checkout + portail Stripe via Edge Functions.
- `invitationEmailService.js`: templates + envoi invitations.
- `translationService.js`: appel Edge Function de traduction.

### `frontend/src/pages/Dashboard`
- `Clients.jsx`: listing clients, filtres, pagination, import, invitation, quick actions suivi.
- `ClientDetail.jsx`: édition client, notes conseiller, statut suivi.
- `Invitations.jsx`: gestion templates + liens invitations.
- `Questionnaires.jsx`: construction questionnaires.
- `QuestionBank.jsx`: bibliothèque de questions (incluant traductions).
- `Analytics.jsx`: KPIs, distribution, priorisation relances, export CSV.
- `Settings.jsx`: profil/sécurité/abonnement.

### `supabase/migrations`
- Schéma SQL versionné (clients, insights, invitations, questionnaires, billing, etc.).
- À pousser via `npx supabase db push`.

### `supabase/functions`
- `stripe-*`: checkout, portail client, webhook, synchro abonnement.
- `send-invitation-email`: envoi email via providers.
- `translate-text`: traduction auto avec fallback providers + garde-fous de coût.

## 4) Variables d'environnement

## Frontend (`frontend/.env.local`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase Edge Function secrets (Dashboard Supabase > Edge Functions > Secrets)

### Stripe
- `STRIPE_MODE` = `test` ou `live`
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
- `APP_URL` (URL prod publique)

### Email invitations
- `EMAIL_PROVIDER_ORDER` (ex: `mailjet,brevo`)
- `EMAIL_FROM_ADDRESS`
- `MAILJET_API_KEY`
- `MAILJET_SECRET_KEY`
- `BREVO_API_KEY`

### Traduction
- `TRANSLATION_MODE` = `enabled` ou `disabled`
- `TRANSLATION_PROVIDER_ORDER` (ex: `deepl_free,libretranslate,google`)
- `TRANSLATION_MAX_CHARS_PER_REQUEST`
- `TRANSLATION_HARD_MONTHLY_LIMIT`
- `DEEPL_API_KEY`
- `LIBRETRANSLATE_URL`
- `LIBRETRANSLATE_API_KEY` (optionnel selon instance)
- `GOOGLE_TRANSLATE_API_KEY`
- `GOOGLE_TRANSLATE_ALLOW_BILLING` (`false` recommandé pour contrôle coût)

## 5) Commandes principales

Depuis `frontend/`:
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview: `npm run preview`

Depuis racine (Supabase):
- Lier projet: `npx supabase link --project-ref <project_ref>`
- Push migrations: `npx supabase db push`
- Déployer function: `npx supabase functions deploy <function_name> --no-verify-jwt`

## 6) Routes principales

Publiques:
- `/` Home
- `/demo`
- `/quiz/:clientId` (flux invitation)
- `/privacy`
- `/terms`

Auth:
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`

Dashboard (protégées):
- `/dashboard`
- `/dashboard/clients`
- `/dashboard/clients/:clientId`
- `/dashboard/invitations`
- `/dashboard/questionnaires`
- `/dashboard/question-bank`
- `/dashboard/analytics`
- `/dashboard/settings`

## 7) Fonctionnement “quick actions” (boutons de relance)

Quand on clique sur les boutons (`A contacter`, `RDV`, `Clore`) dans:
- `Clients` (cartes client)
- `Analytics > Priorités de relance`

Alors:
1. Le statut `followup_status` du client est mis à jour en base (`updateClientFollowup`).
2. `last_contacted_at` est actualisé automatiquement pour les statuts hors `a_contacter`.
3. L’écran recharge les données (liste ou analytics) pour refléter le nouveau statut.
4. Le bouton est temporairement désactivé pendant l’update (évite double-clic).

## 8) OAuth Google (résumé prod)

1. Créer un client OAuth 2.0 Web dans Google Cloud.
2. Ajouter l'URL de callback Supabase:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
3. Dans Supabase > Auth > Sign In / Providers > Google:
   - activer provider
   - renseigner `Client ID` et `Client Secret`
4. Vérifier `Site URL` + `Redirect URLs` côté Supabase Auth.

## 9) PWA / TWA / Play Store

### PWA
- Config dans `frontend/vite.config.js` (manifest, service worker).

### TWA
- Manifest TWA: `frontend/android-twa/twa-manifest.json`
- AAB attendu: `frontend/android-twa/app/build/outputs/bundle/release/app-release.aab`

Scripts utiles:
- `npm run twa:doctor`
- `npm run twa:init`
- `npm run twa:build`
- `npm run twa:assetlinks`

Asset Links:
- Généré dans `frontend/public/.well-known/assetlinks.json` via `scripts/update-assetlinks.mjs`.

## 10) Règles de maintenance du repo

- Ne jamais commit de secrets (API keys, service role key, tokens).
- `supabase/.temp/` est ignoré (et doit le rester).
- Garder migrations SQL idempotentes et incrémentales.
- Vérifier build avant push.

## 11) Process “README à mettre à jour à chaque commit”

À chaque feature:
1. Mettre à jour la section concernée (routes, services, env vars, UX).
2. Ajouter une ligne dans “Journal des changements”.
3. Vérifier commandes/chemins encore valides.
4. Committer README avec la feature.

Template rapide à ajouter en fin de commit:
- `README: update <section> for <feature>`

## 12) Journal des changements (récent)

- `4ae174d` feat(dashboard): quick actions de suivi dans `Clients` et `Analytics`.
- `add6e11` feat(clients): import clients CSV/XLSX + modal d’import.
- `6da8f1c` feat(auth): connexion Google OAuth (login/register/context).
- `0c6cca6` feat(legal): pages `/privacy` et `/terms`.

---

Si tu veux, je peux aussi ajouter un `docs/ARCHITECTURE.md` séparé avec des diagrammes (flux Auth, flux Invitation, flux Stripe, flux Traduction) pour faciliter l’onboarding.
