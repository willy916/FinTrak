# 🚀 Guide de Démarrage Rapide - WareFin MF

## Installation du Projet dans Votre Environnement Vue.js

Votre projet Vue.js est déjà initialisé. Voici comment intégrer les composants :

### Étape 1 : Copier les Fichiers

Copiez tous les fichiers de `/home/claude/waretrack-mf-frontend/` vers votre projet Vue.js existant.

### Étape 2 : Installer les Dépendances

```bash
npm install vue-router
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Étape 3 : Configuration

1. **Remplacer `tailwind.config.js`** avec le fichier fourni
2. **Remplacer `vite.config.js`** avec le fichier fourni
3. **Copier** le dossier `src/` complet

### Étape 4 : Lancer le Projet

```bash
npm run dev
```

## 📚 Utilisation des Composants

### Sidebar

```vue
<template>
  <Sidebar 
    :is-collapsed="false"
    :is-mobile-open="false"
    @toggle-collapse="handleToggle"
    @close-mobile="handleClose"
  />
</template>

<script setup>
import Sidebar from '@/components/layout/Sidebar.vue';
</script>
```

### Header

```vue
<template>
  <Header 
    @toggle-sidebar="handleToggleSidebar"
    @toggle-mobile-sidebar="handleToggleMobile"
  />
</template>

<script setup>
import Header from '@/components/layout/Header.vue';
</script>
```

### Skeleton Loader

```vue
<template>
  <!-- Card Skeleton -->
  <SkeletonLoader type="card" />
  
  <!-- Table Skeleton -->
  <SkeletonLoader type="table" :rows="5" />
  
  <!-- Chart Skeleton -->
  <SkeletonLoader type="chart" />
  
  <!-- Stat Skeleton -->
  <SkeletonLoader type="stat" />
  
  <!-- List Skeleton -->
  <SkeletonLoader type="list" :rows="3" />
</template>

<script setup>
import SkeletonLoader from '@/components/common/SkeletonLoader.vue';
</script>
```

### Dashboard

Le Dashboard est déjà complet et prêt à l'emploi. Il inclut :
- Cartes de statistiques
- Gestion multi-devises
- Graphique de cash flow
- Tableau d'activités récentes

## 🎨 Classes CSS Utilitaires

### Animations

```html
<!-- Slide In -->
<div class="animate-slide-in-up">Contenu</div>
<div class="animate-slide-in-left">Contenu</div>
<div class="animate-slide-in-right">Contenu</div>

<!-- Fade In -->
<div class="animate-fade-in">Contenu</div>

<!-- Scale In -->
<div class="animate-scale-in">Contenu</div>

<!-- Avec délai -->
<div class="animate-slide-in-up animate-delay-100">Contenu</div>
<div class="animate-slide-in-up animate-delay-200">Contenu</div>
```

### Cards avec Hover

```html
<div class="card card-hover">
  <!-- Contenu -->
</div>
```

### Boutons

```html
<!-- Primary Button -->
<button class="btn-primary">Action</button>

<!-- Secondary Button -->
<button class="btn-secondary">Action</button>
```

### Input Fields

```html
<input type="text" class="input-field" placeholder="Entrez votre texte">
```

### Badges

```html
<span class="badge badge-success">Actif</span>
<span class="badge badge-warning">En attente</span>
<span class="badge badge-danger">Erreur</span>
<span class="badge badge-info">Info</span>
```

## 🔧 Personnalisation

### Changer les Couleurs

Dans `tailwind.config.js` :

```js
colors: {
  primary: {
    500: '#VOTRE_COULEUR',
    600: '#VOTRE_COULEUR_FONCEE',
  }
}
```

### Ajouter une Nouvelle Page

1. Créer le fichier dans `src/views/` :

```vue
<!-- src/views/MaNouvellePage.vue -->
<template>
  <div class="animate-slide-in-up">
    <h1 class="text-3xl font-bold">Ma Nouvelle Page</h1>
  </div>
</template>
```

2. Ajouter la route dans `src/router/index.js` :

```js
{
  path: 'ma-page',
  name: 'MaPage',
  component: () => import('../views/MaNouvellePage.vue'),
  meta: { title: 'Ma Page - WareFin MF' }
}
```

3. Ajouter l'entrée dans la Sidebar :

Dans `src/components/layout/Sidebar.vue`, ajouter dans `mainMenuItems` :

```js
{ 
  name: 'Ma Page', 
  path: '/ma-page', 
  icon: 'DashboardIcon', 
  badge: null 
}
```

## 🎯 Bonnes Pratiques

### 1. Utiliser les Skeletons

Toujours afficher un skeleton pendant le chargement :

```vue
<template>
  <div v-if="isLoading">
    <SkeletonLoader type="card" />
  </div>
  <div v-else>
    <!-- Contenu réel -->
  </div>
</template>
```

### 2. Animations Cohérentes

Utiliser les classes d'animation avec des délais pour un effet cascade :

```vue
<div class="animate-slide-in-up">Premier</div>
<div class="animate-slide-in-up animate-delay-100">Deuxième</div>
<div class="animate-slide-in-up animate-delay-200">Troisième</div>
```

### 3. Responsive Design

Toujours tester sur mobile et utiliser les classes Tailwind responsive :

```html
<!-- Caché sur mobile, visible sur desktop -->
<div class="hidden lg:block">Desktop only</div>

<!-- Colonnes responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Cards -->
</div>
```

## 🐛 Résolution des Problèmes

### Les animations ne fonctionnent pas

Vérifier que `main.css` est bien importé dans `main.js` :

```js
import './assets/styles/main.css';
```

### Les icônes ne s'affichent pas

Vérifier l'import dans le composant Sidebar :

```js
import { DashboardIcon, ... } from '../ui/Icons.vue';
```

### Le routing ne fonctionne pas

Vérifier que le router est bien utilisé dans `main.js` :

```js
import router from './router';
app.use(router);
```

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation complète dans `README.md`
2. Vérifier les exemples dans les composants
3. Contacter l'équipe de développement

---

**Bonne construction ! 🚀**
