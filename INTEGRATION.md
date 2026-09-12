# Intégration API — Djeli MF

Le template est désormais branché sur l'API Bank Portal.
Toutes les données affichées viennent du backend : plus aucune donnée factice.

---

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
```

L'URL de l'API se configure dans `.env` :

```
VITE_API_BASE_URL=https://api.eonda.online
```

Un `.env.example` est fourni. `.env` est ignoré par Git.

---

## Connexion

L'ancien parcours **téléphone → PIN → OTP** est supprimé.
La connexion se fait par **e-mail + mot de passe** :

```
POST /api/bank-portal/auth/login   { email, password }
```

La réponse (`token`, `email`, `role`, `organizationName`…) est stockée dans
`localStorage` sous `djeli.token` et `djeli.session`.
Toute réponse `401` purge la session et renvoie vers `/login`.

Le `refreshToken` est un token distinct et révocable, conservé sous
`djeli.refreshToken`. À la première `401`, l'intercepteur tente
`POST /auth/refresh` avant de déconnecter ; plusieurs requêtes en échec
simultané partagent le même appel de rafraîchissement.

La déconnexion appelle `POST /auth/logout` pour révoquer la session côté serveur,
puis purge le stockage local — un échec réseau n'empêche jamais la déconnexion.

**Mot de passe oublié** : lien depuis l'écran de connexion →
`POST /auth/forgot-password` (code OTP à 6 chiffres par e-mail, 15 minutes) →
saisie du code et du nouveau mot de passe → `POST /auth/reset-password`.
Toutes les sessions sont alors révoquées, l'utilisateur se reconnecte.

Écrans supprimés (parcours obsolète, récupérables dans Git) :
`Inscription.vue`, `Inscription2.vue`, `Verifypin.vue`, `Createpin.vue`, `LoginView2.vue`.

---

## Architecture

```
src/
├── services/
│   ├── http.js           Instance axios : baseURL, Bearer token, gestion du 401
│   ├── authService.js    login / logout / session
│   ├── bankPortal.js     Tous les endpoints de l'API
│   └── portfolio.js      Fusion /clients + /leads, calcul des KPI
├── stores/
│   └── auth.js           Session réactive (sans Pinia, aucune dépendance ajoutée)
├── utils/
│   └── format.js         Devise XOF, dates, secteurs, statuts, scores
└── views/ components/    Vues et composants
```

Aucune dépendance n'a été ajoutée : `vue`, `vue-router`, `axios` et `jspdf`
étaient déjà présents.

---

## Correspondance page ↔ API

| Page | Endpoints |
|---|---|
| **Tableau de bord** | `/clients`, `/leads`, `/activity-trend`, `/profile` |
| **Gestion PME** | `/clients`, `/leads`, `/clients/link-requests` |
| **Détail PME** | `/clients/{id}/overview`, `/leads/{id}`, `/leads/{id}/activity-trend`, `/wallet/clients/{id}`, `/loans/{id}/payoff-quote` |
| **Demandes** *(validation)* | `/applications`, `/leads/{id}` + financials + patrimony + tax-declarations, `/applications/{id}/review`, `/applications/{id}/disburse` |
| **Wallet** | `/wallet`, `/wallet/payout`, `/wallet/payouts`, `/wallet/reconcile` |
| **Alertes de risque** | `/risk-alerts`, `/risk-alerts/count`, `/risk-alerts/{id}/resolve` |
| **Paramètres** | `GET\|PUT /profile`, `GET\|PUT /payout-account` |
| **Produits** | `/products` (CRUD) — page dédiée, accessible depuis la sidebar et depuis Paramètres → Établissement |
| **Analytics** | `/activity-trend` |

---

## Le parcours de validation (page Demandes)

C'est ici que les demandes sont instruites, en fonction du profil du marchand.

1. `GET /applications` liste les demandes, triées : à traiter d'abord.
2. Un clic ouvre la modale, qui charge en parallèle le dossier complet :
   score et sous-scores, finances, patrimoine, conformité fiscale, tendance d'activité.
3. Onglet **Décision** :
   - `PENDING` / `UNDER_REVIEW` → Mettre en instruction · Approuver · Rejeter
     (`POST /applications/{id}/review`, rejet avec confirmation)
   - `APPROVED` → formulaire de décaissement avec les comptes du marchand
     (`GET /leads/{id}/accounts`, puis `POST /applications/{id}/disburse`)
4. Le prêt décaissé apparaît immédiatement dans le portefeuille.

Un indicateur calculé côté front affiche la **charge de remboursement estimée**
(mensualité / CA mensuel), coloré selon le seuil (vert < 25 %, ambre < 40 %, rouge au-delà).

---

## Corrections apportées au template

- `views/Paramètres.vue` → `views/Parametres.vue`, route `/parametres`.
  Le caractère accentué faisait **échouer le build** (`Could not resolve
  "../views/Paramètres.vue"`) et cassait l'état actif du menu (le Sidebar
  pointait vers `/Paramètres`, le Header vers `/paramètres`).
- Services cassés supprimés : `api.js`, `authServices.js`, `axosInstance.js`,
  `axosInstance2.js` (appelaient `response.ok` / `response.json()` sur des
  réponses axios, et pointaient vers trois URLs différentes).
- Garde de navigation basée sur le token au lieu de
  `localStorage.isAuthenticated === 'true'`.
- Faux délais de chargement (`setTimeout`) remplacés par de vrais états de requête.
- Devise `$` remplacée par `F CFA` (XOF) partout.
- Ajout de `views/RiskAlertsView.vue` (les alertes existaient dans l'API mais
  n'étaient exposées nulle part dans le template).

---

## CORS — pourquoi ça marche en local

En développement, le front tourne sur `localhost:3000` et l'API sur un autre
domaine. Le navigateur bloque l'appel tant que le serveur ne renvoie pas
d'en-tête `Access-Control-Allow-Origin` pour cette origine :

```
Access to XMLHttpRequest at 'https://api.eonda.online/...' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution appliquée : un proxy dans le serveur de dev Vite.**

`.env.development` laisse `VITE_API_BASE_URL` **vide** → axios émet des requêtes
relatives (`/api/bank-portal/...`). Le navigateur appelle donc `localhost:3000`,
sa propre origine : aucun contrôle CORS. Vite relaie ensuite la requête
côté serveur vers `VITE_API_PROXY_TARGET`.

```
Navigateur ──▶ localhost:3000/api/...   (même origine, pas de CORS)
                     │
                proxy Vite (côté serveur)
                     │
                     ▼
             https://api.eonda.online/api/...
```

Pour taper un backend lancé en local, changer la cible dans `.env.development` :

```
VITE_API_PROXY_TARGET=http://localhost:8080
```

**Ne pas remplir `VITE_API_BASE_URL` en développement** : cela court-circuite le
proxy et fait réapparaître l'erreur CORS.

### En production

Le proxy Vite n'existe qu'en développement. Deux options :

1. **Reverse proxy** (recommandé) — nginx sert le front et route `/api` vers le
   backend. Front et API partagent le domaine, donc pas de CORS.
   Laisser `VITE_API_BASE_URL` vide dans `.env.production`.
2. **Domaines séparés** — le backend doit autoriser le domaine du front.
   Renseigner l'URL complète dans `.env.production` et demander la configuration
   CORS au backend (voir `DONNEES_MANQUANTES.md`).

---

## Fichiers d'environnement

| Fichier | Rôle | Versionné |
|---|---|---|
| `.env.development` | Dev : base vide + cible du proxy | oui |
| `.env.production` | Prod : URL de l'API | oui |
| `.env.example` | Documentation des variables | oui |
| `.env.local` | Surcharge personnelle | non (gitignore) |

---

## Données manquantes

Voir **`DONNEES_MANQUANTES.md`** — liste des endpoints et champs à demander
au backend, classés par criticité.
