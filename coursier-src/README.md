# Coursier 🛵 — Livraison à Libreville, Gabon

Application mobile complète : restaurants, colis entre particuliers, courses personnalisées. React Native + Expo + TypeScript.

## Installation

    npm install
    npx expo start

Scannez le QR code avec Expo Go (Android/iOS) ou tapez `w` pour le web.

## Les 4 rôles (même backend partagé)

| Rôle | Accès | Description |
|---|---|---|
| Client | Libre | Commander, colis, missions, chat livreur (texte + photos) |
| Livreur | PIN 2468 | Courses, étapes, chat client (texte + photos), gains (80%) |
| Restaurant | PIN 1357 | Commandes entrantes, menu avec photos, cuisine, revenus (85%) |
| Admin | PIN 9024 | KPIs, commissions, pénalités, PIN, audit |

## Structure

    App.tsx              → Routage par rôle (isolation stricte)
    lib/store.tsx         → "BACKEND" partagé : commandes, chat, pénalités, menus
    lib/auth.tsx           → Auth par rôle, anti force-brute
    lib/security.ts        → SHA-256 salé 500 itérations
    lib/imagePicker.ts      → Sélection de photos (caméra/galerie), compression
    screens/                → Client (racine), courier/, restaurant/, admin/

## Photos (nouveau)

- **Menu restaurant** : chaque restaurant peut poster une photo par plat (caméra ou galerie),
  visible ensuite par les clients dans le menu. Sans photo, un emoji est utilisé par défaut.
- **Chat** : client et livreur peuvent s'envoyer des photos dans leur conversation
  (ex. photo du colis, du point de repère, du plat livré...), en plus du texte.
- Les photos sont compressées côté appareil (qualité réduite) puis stockées en base64
  directement dans AsyncStorage. Une validation stricte côté "backend"
  (`validateImageDataUri` dans `lib/store.tsx`) rejette les formats invalides et les
  fichiers trop lourds (limite ~500 Ko par image).
- Permissions caméra/galerie déclarées dans `app.json` (iOS `NSCameraUsageDescription` /
  `NSPhotoLibraryUsageDescription`, Android `CAMERA` / `READ_MEDIA_IMAGES`).

## Pénalités d'annulation (si pas annulé à temps)

- Resto : gratuit avant préparation → prix des plats si préparés → total si livreur en route
- Colis : gratuit avant départ → 50% si livreur déplacé → 100% si colis récupéré
- Mission : gratuit → 50% commencée → 100% accomplie

## Migration production

Remplacez les fonctions de lib/store.tsx par Firebase/Supabase : les écrans consomment déjà useStore(), rien d'autre à changer. Pour les photos : au lieu de stocker le base64 dans AsyncStorage, uploadez-le vers Firebase Storage / Supabase Storage et ne gardez que l'URL dans le document.

— Coursier • Libreville, Gabon 🇬🇦
