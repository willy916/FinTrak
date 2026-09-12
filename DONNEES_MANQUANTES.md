# Données manquantes — Djeli MF

État au **9 septembre 2026**, après intégration des ajouts backend
(`PORTAIL_BANQUE_AJOUTS_BACKEND.md`).

Base API : `https://api.eonda.online`, préfixe `/api/bank-portal`.

---

## ✅ Résolu — intégré côté front

| Sujet | Endpoint / champ | Où c'est utilisé |
|---|---|---|
| Refresh token | `POST /auth/refresh` | `services/http.js` — tenté automatiquement sur 401 avant déconnexion |
| Déconnexion serveur | `POST /auth/logout` | Header et Sidebar, révoque la session |
| Mot de passe oublié | `POST /auth/forgot-password` + `/auth/reset-password` | `LoginView.vue`, parcours OTP complet |
| Profil éditable | `PUT /profile` | Paramètres → Établissement |
| Compte de versement | `GET /payout-account` | Paramètres → pré-remplissage + statut `recipientRegistered` |
| Historique des retraits | `GET /wallet/payouts` | Wallet → tableau paginé |
| Tendance établissement | `GET /activity-trend` | Dashboard (graphique) + page Analytics |
| Coût du crédit | `totalCost` | Formulaire de décaissement + import de prêt externe |
| Statut KYC | `NOT_SUBMITTED`, `EXPIRED` | `utils/format.js` |
| Format d'export | ZIP (confirmé) | `exportClientDossier` déduit nom et extension de la réponse |

### Notes d'intégration

**Refresh token.** Stocké sous `djeli.refreshToken`, séparé de `djeli.token`.
L'intercepteur mutualise les appels : si plusieurs requêtes reçoivent 401 en
parallèle, elles attendent le même refresh au lieu d'en déclencher un chacune.

**Export du dossier.** Le serveur renvoie une archive ZIP. Le front lit
`Content-Disposition`, puis à défaut déduit l'extension du `Content-Type`.
Il détecte aussi les erreurs JSON encapsulées dans un Blob et les blobs vides,
qui produisaient auparavant un fichier illisible.

**Tendance.** Le dashboard bascule sur le calcul local des décaissements si
l'endpoint échoue, pour que le graphique reste alimenté.

---

## ⚠️ CORS — à régler avant la mise en production

Contourné en développement par un proxy Vite (voir `INTEGRATION.md`), qui
supprime les en-têtes `Origin` et `Referer` avant de relayer. Sans cela, Spring
Security répond **403 « Invalid CORS request »**.

En production le proxy n'existe plus. Deux options :

1. **Reverse proxy** — nginx sert le front et route `/api` vers le backend.
   Même domaine, donc pas de CORS. Le plus simple.
2. **Domaines séparés** — autoriser le domaine du front :

```java
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "https://<domaine-du-front>"
));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
```

Deux pièges : `http.cors(Customizer.withDefaults())` doit être activé dans la
chaîne Security, sinon la configuration est ignorée ; et le préflight `OPTIONS`
doit passer sans authentification, sinon Security répond 401 avant de poser les
en-têtes.

---

## ❌ Reste manquant

### 1. Mensualité dans `BankClientSummaryResponse`

`GET /clients` renvoie `principalAmount`, `remainingAmount`, `startDate`,
`endDate`, `nextPaymentDate`, `missedPaymentsCount` — mais pas le montant de
l'échéance.

**Impact :** la colonne « Montant Échéance » de l'échéancier affiche le
**restant dû** à la place. Ce n'est pas la même information.

`BusinessLoanResponse` expose déjà `monthlyPayment` : il suffirait de le
remonter dans le résumé client.

```
monthlyPayment: number
paymentFrequency?: string
interestRate?: number
```

### 2. Dirigeant de la PME

`BankClientSummaryResponse` ne contient que `organizationPhone`.
`BankingLeadProfile` ajoute `whatsappNumber` et `tagline`, rien sur la personne.

**Impact :** la carte « Dirigeant PME » du template est devenue « Fiche PME ».
Champs perdus : nom, prénom, e-mail, photo, adresse.

```
ownerFirstName, ownerLastName, ownerEmail, ownerPhotoUrl, address
```

### 3. Revenu de l'établissement

`totalCost` donne le coût du crédit **par prêt**, mais rien n'agrège les
intérêts et frais réellement encaissés sur une période.

**Impact :** la carte « Bénéfices » a été remplacée par « Encours ».

```
GET /api/bank-portal/revenue?from=&to=
→ { currency, interestEarned, feesEarned, insuranceEarned, totalRevenue }
```

Alternative plus simple : ajouter `interestEarned` / `feesEarned` aux points de
`/activity-trend`, déjà consommé par le dashboard et Analytics.

### 4. Canal de paiement dans `WalletTopUpResponse`

Le DTO a `paystackReference` mais pas le canal utilisé.

**Impact :** la colonne « Méthode » du tableau des transactions (Détail PME) a
été remplacée par « Affectation » (`appliedToLoan`).

```
channel: string    // MOBILE_MONEY, CARD…
provider: string   // ORANGEMONEY, MTN…
```

### 5. Remboursements manuels absents de la tendance

`collectedAmount` ne compte que les rechargements Paystack `SUCCESS`. Les
paiements saisis via `POST /clients/{orgId}/loans/{loanId}/repayments` n'y
figurent pas — c'est noté dans ton document.

**Impact :** une microfinance qui encaisse beaucoup en espèces verra une courbe
d'encaissement sous-évaluée. Le front l'indique sous le graphique Analytics.

Un ledger daté des remboursements résoudrait le problème.

### 6. `loanId` dans `BankClientOverviewResponse`

`ClientOverviewView.vue` (bank-portal-web) utilise `overview.value.loanId`,
mais le type ne déclare pas ce champ dans `api/types.ts`. Soit le type est
incomplet, soit ce code est cassé.

**Contournement :** Djeli récupère le `loanId` depuis `GET /clients`.

---

## 🔎 À confirmer

1. **Valeurs de `productType`** — le front propose `LOAN`, `LINE_OF_CREDIT`,
   `LEASING`, `OVERDRAFT`, `SAVINGS`, `OTHER`.
2. **Valeurs de `requiredKycLevel`** — `BASIC`, `STANDARD`, `FULL`, `ENHANCED`.
3. **Codes opérateurs `providerCode`** — le front propose `ORANGEMONEY`, `MTN`,
   `MOOV`, `WAVE`, `BANK`. Ce sont des suppositions : il faut les codes Paystack
   réellement attendus, sinon la configuration du compte de versement échouera.
4. **`GET /leads` et `minScore`** — bank-portal-web envoie `500` par défaut,
   Djeli envoie `0` pour ne rien masquer dans le portefeuille.
5. **Durée de vie du JWT** — annoncée à 24 h. Le front ne rafraîchit qu'en
   réaction à un 401, pas de façon préventive. Suffisant si la durée ne baisse pas.
6. **Forme de la réponse de `POST/PUT /products`** — le front (page Produits)
   accepte deux formes sans distinction : soit le `PartnerBankResponse` complet
   (avec `products[]`), soit uniquement l'entité produit créée/modifiée. Dans le
   second cas, le produit est fusionné localement dans la liste pour s'afficher
   immédiatement sans recharger la page. Cette tolérance fonctionne dans les
   deux cas, mais il serait plus propre de confirmer laquelle des deux formes
   l'API renvoie réellement, pour retirer la logique de secours si elle n'est
   pas nécessaire.

---

## Endpoints consommés par Djeli MF

**Auth** — `login`, `refresh`, `logout`, `forgot-password`, `reset-password`

**Profil & produits** — `GET|PUT /profile`, `POST|PUT|DELETE /products[/{id}]`

**Leads** — `/leads`, `/leads/{orgId}`, `/financials`, `/financial-statements`,
`/patrimony`, `/patrimony/proof/{fileId}`, `/tax-declarations`, `/accounts`,
`/activity-trend`, `/export`

**Demandes** — `/applications`, `/applications/{id}`, `/review`, `/disburse`

**Clients** — `/clients`, `/clients/{orgId}/overview`, `/repayments`,
`/link-request`, `/link-requests`, `/external-loans`

**Prêts** — `/loans/{loanId}/payoff-quote`, `/early-payoff`

**Wallet** — `GET /wallet`, `GET|PUT /payout-account`, `POST /wallet/payout`,
`GET /wallet/payouts`, `/wallet/clients/{orgId}`, `/wallet/reconcile`

**Portefeuille** — `GET /activity-trend`

**Alertes** — `/risk-alerts`, `/risk-alerts/count`, `/risk-alerts/{id}/resolve`

Seul `GET /applications/{id}` n'est pas appelé : la liste fournit déjà l'objet
complet passé à la modale d'instruction.
