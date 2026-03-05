# FinMate - Publication Play Store (PWA + TWA)

## 1) Ce qui est deja en place
- PWA active (manifest + service worker)
- URL prod HTTPS sur Vercel
- Fichier `public/.well-known/assetlinks.json` present
- Scripts npm pour TWA:
  - `npm run twa:doctor`
  - `npm run twa:init`
  - `npm run twa:build`

## 2) Etapes a faire maintenant
1. Deployer la derniere version sur Vercel.
2. Verifier que ces URLs repondent en production:
   - `https://finmate-advisor.vercel.app/manifest.webmanifest`
   - `https://finmate-advisor.vercel.app/.well-known/assetlinks.json`
3. Creer votre app Android (package recommande: `com.finmate.app`) dans Play Console.
4. Initialiser la TWA:
   - `npm run twa:doctor`
   - `npm run twa:init`
5. Generer l'AAB:
   - `npm run twa:build`
6. Uploader l'AAB dans Play Console.

## 3) Config assetlinks (obligatoire)
Recuperez les SHA-256 de:
- la **Upload key** (votre keystore local)
- la **App signing key** fournie par Google Play (Play Console > App integrity)

Important:
- Si vous n'avez que la Upload key dans `assetlinks.json`, la TWA peut tomber en fallback Custom Tabs et afficher la barre d'URL (comme sur votre capture).
- Pour eviter cette barre, mettez **les 2 empreintes** dans `assetlinks.json`.

Commande utile:
```bash
keytool -list -v -keystore <votre-keystore.jks> -alias <votre-alias>
```

Puis generez automatiquement `public/.well-known/assetlinks.json`:
```bash
ANDROID_PACKAGE_NAME=com.finmate.app ANDROID_SHA256_FINGERPRINTS=AA:BB:...:FF,11:22:...:EE npm run twa:assetlinks
```

Note Windows PowerShell:
```powershell
$env:ANDROID_PACKAGE_NAME="com.finmate.app"
$env:ANDROID_SHA256_FINGERPRINTS="AA:BB:...:FF,11:22:...:EE"
npm run twa:assetlinks
```

## 4) Mises a jour
- Oui, les mises a jour web continuent via Vercel.
- L'app TWA affiche le contenu web du domaine: vos evolutions front sont donc visibles sans republier chaque petit changement.
- Vous republiez sur Play surtout pour les changements natifs Android (icones package, config Android, etc.).

## 5) Recommandations
- Garder TWA pour aller vite sur mobile.
- Ajouter ensuite: push notifications, deep links, analytics mobile.
- Envisager Capacitor/React Native uniquement si vous avez besoin de fonctionnalites natives avancees.
