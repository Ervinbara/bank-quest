# Stripe Setup (Bank Quest)

## 1) Recuperer les cles Stripe
Dans votre dashboard Stripe:

1. Ouvrir `Developers > API keys`
2. Copier:
   - `Secret key` (commence par `sk_...`)
3. Ouvrir `Products` et creer 3 prix mensuels:
   - Solo
   - Pro
   - Cabinet
4. Copier chaque `Price ID` (commence par `price_...`)

## 2) Ajouter les secrets dans Supabase (Edge Functions)
Dans Supabase:

1. `Edge Functions > Secrets`
2. Ajouter ces variables:
   - `STRIPE_SECRET_KEY=sk_...`
   - `STRIPE_PRICE_SOLO_MONTHLY=price_...`
   - `STRIPE_PRICE_PRO_MONTHLY=price_...`
   - `STRIPE_PRICE_CABINET_MONTHLY=price_...`
   - `APP_URL=https://bank-quest.vercel.app`

Le `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase pour les fonctions deployees.

## 3) Webhook Stripe
Dans Stripe:

1. `Developers > Webhooks > Add endpoint`
2. Endpoint URL:
   - `https://<project-ref>.functions.supabase.co/stripe-webhook`
3. Events a ecouter:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copier le `Signing secret` (`whsec_...`)

Ajouter ensuite ce secret dans Supabase:
- `STRIPE_WEBHOOK_SECRET=whsec_...`

## 4) Deploy des fonctions
Depuis le projet:

```bash
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-customer-portal
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

## 5) Appliquer la migration SQL
```bash
npx supabase db push
```

## 6) Test rapide
1. Aller dans `Dashboard > Parametres > Abonnement`
2. Cliquer `Choisir ce plan`
3. Completer paiement test Stripe
4. Verifier retour dans l'app avec statut mis a jour
