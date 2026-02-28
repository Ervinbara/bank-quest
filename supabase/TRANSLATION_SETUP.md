# FinMate - Traduction auto avec roulement providers (DeepL / LibreTranslate / Google)

## 1) Philosophie anti-facturation (important)

Par defaut, vous devez garder:
```
TRANSLATION_MODE=disabled
```

Quand vous activez la traduction:
- vous activez explicitement le mode (`TRANSLATION_MODE=enabled`)
- vous gardez des limites strictes
- Google API payante reste desactivee tant que `GOOGLE_TRANSLATE_ALLOW_BILLING` n'est pas `true`

## 2) Providers supportes

`TRANSLATION_PROVIDER_ORDER` accepte:
- `deepl_free`
- `libretranslate`
- `google`

Exemple:
```
TRANSLATION_PROVIDER_ORDER=deepl_free,libretranslate,google
```

Le systeme essaye chaque provider dans l'ordre jusqu'au premier succes.

## 3) Secrets Supabase recommandes (safe)

### Mode recommande (gratuit / prudent)
```
TRANSLATION_MODE=enabled
TRANSLATION_PROVIDER_ORDER=deepl_free,libretranslate,google
TRANSLATION_MAX_CHARS_PER_REQUEST=1200
TRANSLATION_HARD_MONTHLY_LIMIT=400000
GOOGLE_TRANSLATE_ALLOW_BILLING=false
```

Ajoutez ensuite uniquement les providers que vous utilisez.

## 4) DeepL Free - recuperer la cle API

1. Creer un compte sur DeepL API Free.
2. Dashboard DeepL > API Keys > copier la cle.
3. La cle Free se termine en general par `:fx`.
4. Ajouter dans Supabase:
```
DEEPL_API_KEY=<votre_cle_free>
```

Protection integree:
- Les cles DeepL Pro sont refusees (si pas suffixe `:fx`).

## 5) LibreTranslate - recuperer la config

Option A: instance publique (si disponible).
Option B (recommande): votre instance self-hosted.

Secrets:
```
LIBRETRANSLATE_URL=https://<votre-instance>/translate
LIBRETRANSLATE_API_KEY=<optionnel>
```

## 6) Google Traduction - deux modes

### Mode sans facturation explicite (par defaut)
```
GOOGLE_TRANSLATE_ALLOW_BILLING=false
```
Dans ce cas, le provider `google` utilise l'endpoint gratuit public de traduction web.

### Mode API Google Cloud (potentiellement payant)
N'activer que si vous acceptez la facturation:
```
GOOGLE_TRANSLATE_ALLOW_BILLING=true
GOOGLE_TRANSLATE_API_KEY=<votre_cle_google_cloud>
```

### Recuperer la cle Google Cloud
1. Console Google Cloud > creer un projet.
2. Activer `Cloud Translation API`.
3. Credentials > Create Credentials > API key.
4. Restreindre la cle (obligatoire):
  - Restriction API: Cloud Translation API uniquement
  - Restriction HTTP referrer / IP selon votre infra
5. Ajouter dans Supabase: `GOOGLE_TRANSLATE_API_KEY`.

## 7) Deploy de la fonction

```bash
npx supabase functions deploy translate-text --no-verify-jwt
```

## 8) Test rapide

Payload:
```json
{
  "text": "profil de risque",
  "sourceLang": "fr",
  "targetLang": "en"
}
```

Reponse attendue:
```json
{
  "success": true,
  "provider": "deepl_free",
  "translatedText": "risk profile"
}
```

## 9) Configuration conseillee pour ne pas payer

1. Commencer avec:
```
TRANSLATION_MODE=disabled
```
2. Puis:
```
TRANSLATION_MODE=enabled
TRANSLATION_PROVIDER_ORDER=libretranslate,google
GOOGLE_TRANSLATE_ALLOW_BILLING=false
```
3. Ajouter DeepL Free ensuite si besoin de qualite.
4. Ne mettre `GOOGLE_TRANSLATE_ALLOW_BILLING=true` qu'en toute connaissance de cause.
