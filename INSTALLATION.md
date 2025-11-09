# 📦 Installation de WareFin MF

## Option 1 : Démarrage Rapide (Nouveau Projet)

### Étape 1 : Télécharger et Extraire

```bash
# Extraire l'archive ZIP
unzip waretrack-mf-frontend.zip
cd waretrack-mf-frontend
```

### Étape 2 : Installer les Dépendances

```bash
npm install
```

### Étape 3 : Lancer l'Application

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## Option 2 : Intégration dans un Projet Vue.js Existant

### Si vous avez déjà un projet Vue.js initialisé :

#### Étape 1 : Copier les Fichiers

Copiez les dossiers et fichiers suivants dans votre projet :

```
Votre Projet/
├── src/
│   ├── assets/       ← Copier
│   ├── components/   ← Copier
│   ├── router/       ← Copier (ou fusionner)
│   ├── views/        ← Copier
│   ├── App.vue       ← Remplacer
│   └── main.js       ← Remplacer
├── index.html        ← Remplacer
├── tailwind.config.js ← Copier
├── postcss.config.js  ← Copier
└── vite.config.js     ← Fusionner
```

#### Étape 2 : Installer les Dépendances Manquantes

```bash
npm install vue-router
npm install -D tailwindcss postcss autoprefixer
```

#### Étape 3 : Lancer

```bash
npm run dev
```

---

## 🔧 Configuration Requise

### Prérequis

- **Node.js** : Version 18.0 ou supérieure
- **npm** : Version 9.0 ou supérieure
- **Navigateur** : Chrome, Firefox, Safari, Edge (versions récentes)

### Vérifier les Versions

```bash
node --version   # Devrait afficher v18.x ou supérieur
npm --version    # Devrait afficher 9.x ou supérieur
```

---

## 📝 Structure Après Installation

```
waretrack-mf-frontend/
├── node_modules/          # Dépendances (créé après npm install)
├── public/                # Fichiers statiques
├── src/
│   ├── assets/
│   │   └── styles/
│   │       └── main.css
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   ├── router/
│   ├── views/
│   ├── App.vue
│   └── main.js
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
├── QUICK_START.md
└── PROJECT_OVERVIEW.md
```

---

## ✅ Vérification de l'Installation

### 1. Vérifier que le serveur démarre

```bash
npm run dev
```

Vous devriez voir :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 2. Ouvrir dans le Navigateur

Ouvrir **http://localhost:3000**

Vous devriez voir :
- ✅ Sidebar à gauche avec le menu
- ✅ Header en haut avec notifications
- ✅ Dashboard avec les cartes de statistiques
- ✅ Animations fluides

### 3. Tester la Responsivité

- Réduire la largeur du navigateur
- La sidebar devrait se transformer en menu mobile
- Les cartes devraient s'empiler verticalement

---

## 🐛 Résolution des Problèmes

### Problème : "npm install" échoue

**Solution :**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

### Problème : Port 3000 déjà utilisé

**Solution :**
```bash
# Utiliser un autre port
npm run dev -- --port 3001
```

Ou modifier `vite.config.js` :
```javascript
server: {
  port: 3001
}
```

### Problème : Tailwind CSS ne fonctionne pas

**Solution :**
1. Vérifier que `tailwind.config.js` existe
2. Vérifier que `main.css` est importé dans `main.js`
3. Relancer le serveur

### Problème : Les icônes ne s'affichent pas

**Solution :**
Vérifier l'import dans les composants :
```javascript
import { DashboardIcon } from '../ui/Icons.vue';
```

### Problème : Router ne fonctionne pas

**Solution :**
Vérifier dans `main.js` :
```javascript
import router from './router';
app.use(router);
```

---

## 🔨 Scripts Disponibles

```bash
# Développement
npm run dev          # Lance le serveur de développement

# Production
npm run build        # Crée le build de production
npm run preview      # Prévisualise le build

# Autres
npm run lint         # Linter (à configurer)
```

---

## 🌐 Déploiement

### Build pour Production

```bash
npm run build
```

Cela crée un dossier `dist/` avec tous les fichiers optimisés.

### Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Déployer sur Netlify

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Déployer
netlify deploy --prod
```

---

## 📦 Dépendances Principales

| Package | Version | Description |
|---------|---------|-------------|
| vue | ^3.4.0 | Framework Vue.js |
| vue-router | ^4.2.0 | Routing |
| tailwindcss | ^3.4.0 | CSS Framework |
| vite | ^5.0.0 | Build Tool |

---

## 🎯 Première Connexion

### Compte de Test

- **URL** : http://localhost:3000/login
- **Email** : N'importe quel email
- **Password** : N'importe quel mot de passe

> ⚠️ L'authentification est simulée pour le moment. Intégrez votre API backend pour une vraie authentification.

---

## 📚 Documentation Supplémentaire

Consultez ces fichiers pour plus d'informations :

1. **README.md** - Documentation technique complète
2. **QUICK_START.md** - Guide de démarrage rapide
3. **PROJECT_OVERVIEW.md** - Vue d'ensemble du projet

---

## 🆘 Support

### En cas de problème :

1. ✅ Vérifier que Node.js et npm sont à jour
2. ✅ Supprimer `node_modules/` et réinstaller
3. ✅ Vérifier la console du navigateur pour les erreurs
4. ✅ Consulter la documentation
5. ✅ Contacter l'équipe de développement

---

## 🎉 Félicitations !

Votre application WareFin MF est maintenant installée et prête à l'emploi !

**Prochaines étapes :**
1. Explorer l'interface
2. Consulter le code source
3. Personnaliser selon vos besoins
4. Intégrer votre API backend
5. Déployer en production

**Bon développement ! 🚀**
