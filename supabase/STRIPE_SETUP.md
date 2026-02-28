# Stripe Setup (FinMate)

## 1) Principe de configuration
L'application supporte maintenant 2 modes sans changer le code:
- `STRIPE_MODE=test` pour tester
- `STRIPE_MODE=live` pour la production

Les Edge Functions lisent en priorite les variables suffixees:
- `_TEST` si mode test
- `_LIVE` si mode live

Compatibilite: les anciens noms sans suffixe (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET`) sont encore acceptes en fallback.

## 2) Secrets a ajouter dans Supabase (Edge Functions)
Dans `Supabase > Edge Functions > Secrets`, ajoute:

- `STRIPE_MODE=test` (ou `live` en production)
- `STRIPE_SECRET_KEY_TEST=sk_test_...`
- `STRIPE_SECRET_KEY_LIVE=sk_live_...`
- `STRIPE_PRICE_SOLO_MONTHLY_TEST=price_...`
- `STRIPE_PRICE_PRO_MONTHLY_TEST=price_...`
- `STRIPE_PRICE_CABINET_MONTHLY_TEST=price_...`
- `STRIPE_PRICE_SOLO_MONTHLY_LIVE=price_...`
- `STRIPE_PRICE_PRO_MONTHLY_LIVE=price_...`
- `STRIPE_PRICE_CABINET_MONTHLY_LIVE=price_...`
- `STRIPE_WEBHOOK_SECRET_TEST=whsec_...`
- `STRIPE_WEBHOOK_SECRET_LIVE=whsec_...`
- `APP_URL=https://finmate-advisor.vercel.app`

Le `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase pour les fonctions.

## 3) Recuperer STRIPE_SECRET_KEY_LIVE
Dans Stripe:
1. Active `View test data` = OFF (mode live).
2. Ouvre `Developers > API keys`.
3. Dans `Standard keys`, copie `Secret key` (format `sk_live_...`).
4. Colle-la dans Supabase:
   - `STRIPE_SECRET_KEY_LIVE=sk_live_...`

## 4) Recuperer STRIPE_PRICE_*_LIVE
Dans Stripe (mode live, `View test data` = OFF):
1. Ouvre `Product catalog` (ou `Products`).
2. Cree/ouvre chaque produit: `Solo`, `Pro`, `Cabinet`.
3. Pour chaque produit, cree un prix recurrent mensuel.
4. Copie l'identifiant de prix (format `price_...`, pas `prod_...`).
5. Colle dans Supabase:
   - `STRIPE_PRICE_SOLO_MONTHLY_LIVE=price_...`
   - `STRIPE_PRICE_PRO_MONTHLY_LIVE=price_...`
   - `STRIPE_PRICE_CABINET_MONTHLY_LIVE=price_...`

Important:
- `prod_...` = ID produit (inutilisable pour checkout line_items).
- `price_...` = ID tarif (obligatoire).

## 5) Webhooks test et live
Cree 2 endpoints webhook dans Stripe:

Mode test:
- URL: `https://<project-ref>.functions.supabase.co/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Secret signe:
  - `STRIPE_WEBHOOK_SECRET_TEST=whsec_...`

Mode live:
- Meme URL
- Memes events
- Secret signe:
  - `STRIPE_WEBHOOK_SECRET_LIVE=whsec_...`

## 6) Deploy des fonctions
Depuis le projet:

```bash
npx supabase functions deploy stripe-checkout --no-verify-jwt
npx supabase functions deploy stripe-customer-portal --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy stripe-sync-subscription --no-verify-jwt
```

## 7) Basculer de test vers live
Quand tout est valide:
1. Garde toutes les variables `_TEST` et `_LIVE`.
2. Change seulement:
   - `STRIPE_MODE=live`
3. Teste un abonnement reel controle.

Pour revenir en test:
- `STRIPE_MODE=test`

## 8) Checklist rapide de validation
1. Checkout ouvre Stripe sans erreur.
2. Retour app: statut/plan/date sont mis a jour.
3. Portail client Stripe ouvre correctement.
4. Changement de plan + resiliation fin de periode se refletent dans l'app.
