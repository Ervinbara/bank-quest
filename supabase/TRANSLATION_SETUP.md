# FinMate - Traduction automatique (mode gratuit uniquement)

## Objectif
Activer la traduction auto FR/EN sans risque de facturation involontaire.

## Modes disponibles
- `disabled` : traduction auto OFF (mode par defaut, zero risque)
- `libretranslate` : traduction via instance LibreTranslate (gratuit si instance gratuite/self-hosted)
- `deepl_free` : traduction DeepL API Free uniquement (cles Pro refusees)

## Protections anti-facturation integrees
1. La fonction refuse toute cle DeepL Pro.
2. Seules les langues `fr/en` sont autorisees.
3. Limite dure par requete: `TRANSLATION_MAX_CHARS_PER_REQUEST` (defaut 1200).
4. Limite dure mensuelle (DeepL): `TRANSLATION_HARD_MONTHLY_LIMIT` (defaut 400000).
5. Mode explicite obligatoire: pas de fallback implicite.

## Secrets Supabase a configurer

### Cas 1: zero risque (recommande au debut)
```
TRANSLATION_MODE=disabled
```

### Cas 2: LibreTranslate (gratuit)
```
TRANSLATION_MODE=libretranslate
LIBRETRANSLATE_URL=https://<votre-instance>/translate
LIBRETRANSLATE_API_KEY=<optionnel>
TRANSLATION_MAX_CHARS_PER_REQUEST=1200
```

### Cas 3: DeepL Free (pas Pro)
```
TRANSLATION_MODE=deepl_free
DEEPL_API_KEY=<cle_deepl_free_qui_se_termine_par_:fx>
TRANSLATION_MAX_CHARS_PER_REQUEST=1200
TRANSLATION_HARD_MONTHLY_LIMIT=400000
```

Important:
- Une cle DeepL Free termine normalement par `:fx`.
- Si la cle ne termine pas par `:fx`, la fonction refuse l'appel.

## Deploy fonction
```bash
npx supabase functions deploy translate-text --no-verify-jwt
```

## Test rapide
Appeler la fonction avec:
```json
{
  "text": "profil de risque",
  "sourceLang": "fr",
  "targetLang": "en"
}
```

## Recommandation operationnelle
1. Commencer avec `TRANSLATION_MODE=disabled`.
2. Tester en `libretranslate`.
3. N'utiliser `deepl_free` que si la qualite est insuffisante.
4. Garder `TRANSLATION_HARD_MONTHLY_LIMIT` en dessous du quota max pour marge de securite.
