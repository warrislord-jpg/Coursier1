# Coursier — Guide d'architecture et de déploiement

## Vue d'ensemble

Le repo contient **une seule base de code** qui produit **4 interfaces web
distinctes**, chacune déployée sur son propre sous-domaine. Toutes tapent sur
le même Supabase (`imdiompzettablsfcwpr`). Cette structure est aussi
directement transposable en **4 applications mobiles** (iOS + Android) sans
duplication.

```
coursier.app          → interface CLIENT      (App.client.tsx)
resto.coursier.app    → interface RESTAURANT  (App.restaurant.tsx)
livreur.coursier.app  → interface LIVREUR     (App.courier.tsx)
admin.coursier.app    → interface ADMIN       (App.admin.tsx)
```

Chaque interface :
- Charge uniquement ses propres écrans (bundle allégé)
- A son propre écran de connexion (sauf le client qui n'en a pas)
- N'expose PAS le code des autres rôles dans son bundle JavaScript
  → un client curieux qui ouvre les DevTools ne verra jamais l'interface admin.

## Structure des fichiers

```
lib/           ← code partagé (Supabase, auth, panier, chat…)
components/    ← composants UI partagés
screens/
  ├─ HomeScreen, RestaurantsScreen, CartScreen…  (client)
  ├─ restaurant/  (dashboard + gestion menu)
  ├─ courier/     (courses dispo + chat)
  └─ admin/       (dashboard admin)

App.client.tsx      ← point d'entrée coursier.app
App.restaurant.tsx  ← point d'entrée resto.coursier.app
App.courier.tsx     ← point d'entrée livreur.coursier.app
App.admin.tsx       ← point d'entrée admin.coursier.app

App.tsx             ← ancienne version "tout-en-un" (conservée pour dev local
                      avec RoleGateScreen, non utilisée en production)

scripts/build-web.js ← switch le "main" de package.json puis build
```

## Le .env (à créer, jamais commité)

À la racine de `coursier-src/`, crée `.env` :

```
EXPO_PUBLIC_SUPABASE_URL=https://imdiompzettablsfcwpr.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZGlvbXB6ZXR0YWJsc2Zjd3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTQxMjEsImV4cCI6MjA5ODc3MDEyMX0.uEJLv2sSfN9uk187yuJT1uikpxrAyXFBy09HD-1Rm_Q
```

## Développement local

```bash
npm install

# Version "tout-en-un" avec RoleGateScreen (comme avant) :
npm run web

# Version d'une interface précise :
npx expo start --web           # après avoir édité "main" dans package.json
```

## Builds locaux

```bash
npm run build:client       # → dossier dist-client/
npm run build:restaurant   # → dossier dist-restaurant/
npm run build:courier      # → dossier dist-courier/
npm run build:admin        # → dossier dist-admin/
npm run build:all          # les 4 d'un coup
```

## Déploiement Vercel — étape par étape

Il faut créer **4 projets Vercel séparés**, tous liés au même repo GitHub
`warrislord-jpg/coursier1`. La différence entre les 4 se fait via une
variable d'environnement `ROLE`.

### Pour chaque projet (client, restaurant, courier, admin) :

1. Vercel → **Add New Project** → importer `warrislord-jpg/coursier1`
2. **Project Name** : `coursier-client` (puis `coursier-restaurant`, etc.)
3. **Root Directory** : `coursier-src`
4. **Framework Preset** : `Other`
5. **Environment Variables** (3 à ajouter) :
   - `ROLE` = `client` (ou `restaurant`, `courier`, `admin`)
   - `EXPO_PUBLIC_SUPABASE_URL` = valeur du `.env`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = valeur du `.env`
6. **Deploy**

Le `vercel.json` du repo lit la variable `ROLE` et déclenche automatiquement
le bon script de build (`build:client`, etc.).

### Sous-domaines

Une fois les 4 projets déployés, dans le dashboard Vercel de chacun :
Settings → Domains → ajouter le sous-domaine correspondant :
- projet client → `coursier.app` (ou `www.coursier.app`)
- projet restaurant → `resto.coursier.app`
- projet courier → `livreur.coursier.app`
- projet admin → `admin.coursier.app`

Vercel te donnera les enregistrements DNS à ajouter chez ton registrar.

## Comptes de test (déjà en base)

**Restaurants** (PIN par défaut à `1101`…`1108`) :
- `nyembwe / 1101`, `braise / 1102`, `fleuve / 1103`, `mamiwata / 1104`,
- `akanda / 1105`, `owendo / 1106`, `palmier / 1107`, `nzengpizza / 1108`

**Livreurs** :
- `jeanbosco / 2468`, `prisca / 2469`, `aime / 2470`

**Admin** :
- PIN : `9024`

⚠️ Ces PIN sont hashés côté Supabase (bcrypt via pgcrypto), mais restent des
valeurs par défaut connues. À changer avant mise en production réelle depuis
l'interface admin (fonctionnalité à finaliser dans la phase 2).

## Préparer le passage en app mobile plus tard

L'architecture est **déjà prête** pour ça. Le jour où tu voudras publier sur
l'App Store / Google Play :

1. Chaque `App.<role>.tsx` devient une **app mobile distincte** via EAS Build
   (Expo Application Services) — même code, cible native au lieu de web.
2. Tu créeras 3 `app.json` séparés (l'utilisateur final n'a pas besoin d'une
   app "admin" mobile) avec chacun leur icône, nom et bundle ID :
   - `Coursier` (client) → `com.coursier.client`
   - `Coursier Pro` (restaurant) → `com.coursier.restaurant`
   - `Coursier Livreur` (livreur) → `com.coursier.courier`
3. Toute la logique métier (`lib/`) et les écrans (`screens/`) sont
   **partagés à 100 %** entre web et mobile — pas de duplication.

Modèle éprouvé : c'est la structure d'Uber (app client + app Driver),
Deliveroo (client + Rider + Restaurant Hub), Bolt, etc.

## État actuel du backend Supabase

**Tables (RLS activé partout)** :
- `restaurants`, `menu_items` — lecture publique, écriture via l'app resto
- `orders`, `chat_messages`, `favorites`, `clients` — écriture app
- `courier_accounts`, `restaurant_accounts`, `admin_accounts` — inaccessibles
  directement (RLS = false), lisibles uniquement via les RPC de connexion
- `audit_log` — journal d'audit inaccessible en lecture

**RPC de connexion (sécurisées, bcrypt)** :
- `login_courier(username, pin)`
- `login_restaurant(username, pin)`
- `login_admin(username, pin)`
- `set_courier_pin`, `set_restaurant_pin`, `set_admin_pin` (admin uniquement)

## Ce qui reste à faire (phase 2)

- [ ] Migrer `auth.tsx` local vers les RPC Supabase (login/loginCourier/
      loginRestaurant sont encore basés sur AsyncStorage)
- [ ] Migrer `orders`, `chat_messages`, `favorites` vers Supabase temps réel
      (aujourd'hui encore en local via AsyncStorage)
- [ ] Interface admin pour changer les PIN par défaut
- [ ] Migration `photo` base64 → Supabase Storage (bucket public)
