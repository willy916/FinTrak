<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logowf from '../../assets/img/logowf.png';
import { useAuth } from '@/stores/auth';
import { listApplications, getUnresolvedRiskAlertsCount } from '@/services/bankPortal';

const route = useRoute();
const router = useRouter();
const { session, logout } = useAuth();

const props = defineProps({
  isCollapsed: { type: Boolean, default: false },
  isMobileOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle-collapse', 'close-mobile']);

const searchQuery = ref('');

/* Compteurs réels affichés en pastille. */
const pendingApplications = ref(0);
const unresolvedAlerts = ref(0);

const mainMenuItems = computed(() => [
  {
    name: 'Tableau de bord',
    path: '/dashboard',
    iconPath:
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    badge: null,
    category: 'Principal',
  },
  {
    name: 'Analytics',
    path: '/analytics',
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    badge: null,
    category: 'Principal',
  },
  {
    name: 'Wallet',
    path: '/wallet',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    badge: null,
    category: 'Principal',
  },
]);

const featureItems = computed(() => [
  {
    name: 'Gestion PME',
    path: '/gestionpme',
    iconPath:
      'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    badge: null,
    category: 'Gestion PME',
  },
  {
    name: 'Détails PME',
    path: '/detailpme',
    iconPath:
      'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    badge: null,
    category: 'Gestion PME',
  },
  {
    name: 'Produits',
    path: '/produits',
    iconPath:
      'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    badge: null,
    category: 'Gestion PME',
  },
  {
    name: 'Demandes',
    path: '/invest',
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    badge: pendingApplications.value > 0 ? String(pendingApplications.value) : null,
    badgeStyle: 'primary',
    category: 'Gestion PME',
  },
  {
    name: 'Alertes de risque',
    path: '/alertes',
    iconPath:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    badge: unresolvedAlerts.value > 0 ? String(unresolvedAlerts.value) : null,
    badgeStyle: 'danger',
    category: 'Gestion PME',
  },
]);

const generalItems = computed(() => [
  {
    name: 'Paramètres',
    path: '/parametres',
    iconPath:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    badge: null,
    category: 'Général',
  },
  {
    name: 'Support',
    path: '/support',
    iconPath:
      'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    badge: null,
    category: 'Général',
  },
  {
    name: 'Déconnexion',
    path: '/logout',
    iconPath: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    action: 'logout',
    category: 'Général',
  },
]);

const allMenuItems = computed(() => [...mainMenuItems.value, ...featureItems.value, ...generalItems.value]);

/**
 * Index de recherche : chaque page est indexée par son nom, sa categorie et
 * des mots-cles supplementaires, pour que « pret », « credit » ou « demande »
 * mènent tous à la page Demandes.
 */
const SEARCH_KEYWORDS = {
  '/dashboard': ['accueil', 'tableau de bord', 'statistiques', 'echeancier', 'resume', 'kpi'],
  '/analytics': ['statistiques', 'tendance', 'evolution', 'graphique', 'rapport', 'analyse', 'performance'],
  '/wallet': ['portefeuille', 'retrait', 'versement', 'paiement', 'solde', 'argent', 'caisse'],
  '/gestionpme': ['portefeuille', 'clients', 'marchands', 'prets', 'remboursement', 'entreprises'],
  '/detailpme': ['fiche', 'client', 'marchand', 'transactions', 'activite', 'dossier'],
  '/invest': ['demandes', 'financement', 'credit', 'pret', 'validation', 'instruction', 'approbation', 'decaissement', 'dossier'],
  '/produits': ['catalogue', 'criteres', 'eligibilite', 'offres', 'conditions', 'financement'],
  '/alertes': ['risque', 'incident', 'retard', 'impaye', 'notification', 'surveillance'],
  '/parametres': ['reglages', 'compte', 'profil', 'versement'],
  '/support': ['aide', 'assistance', 'contact', 'probleme', 'faq'],
};

/** Retire les accents pour que « detail » trouve « Détails PME ». */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const searchResults = computed(() => {
  const query = normalize(searchQuery.value.trim());
  if (!query) return [];

  return allMenuItems.value
    .filter((item) => item.path !== '/logout')
    .map((item) => {
      const name = normalize(item.name);
      const category = normalize(item.category);
      const keywords = (SEARCH_KEYWORDS[item.path] || []).map(normalize);

      // Score decroissant : debut du nom > nom > categorie > mot-cle
      let score = -1;
      if (name.startsWith(query)) score = 0;
      else if (name.includes(query)) score = 1;
      else if (keywords.some((k) => k.startsWith(query))) score = 2;
      else if (category.includes(query)) score = 3;
      else if (keywords.some((k) => k.includes(query))) score = 4;

      return { ...item, score };
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score);
});

const badgeClass = (style) => {
  if (style === 'danger') return 'bg-red-100 text-red-600';
  return 'bg-primary-100 text-primary-600';
};

/* Navigation au clavier dans les résultats. */
const highlightedIndex = ref(0);

watch(searchResults, () => {
  highlightedIndex.value = 0;
});

const moveHighlight = (delta) => {
  const count = searchResults.value.length;
  if (count === 0) return;
  highlightedIndex.value = (highlightedIndex.value + delta + count) % count;
};

const goToResult = (result) => {
  router.push(result.path);
  clearSearch();
};

const performSearch = () => {
  const result = searchResults.value[highlightedIndex.value];
  if (result) goToResult(result);
};

const clearSearch = () => {
  searchQuery.value = '';
  highlightedIndex.value = 0;
  closeMobileSidebar();
};

/** Ferme les résultats au clic en dehors de la zone de recherche. */
const closeSearchOnOutsideClick = (event) => {
  if (!event.target.closest?.('[data-search-root]')) {
    searchQuery.value = '';
  }
};

const isActiveRoute = (path) => route.path === path || route.path.startsWith(`${path}/`);

const handleGeneralItemClick = async (item) => {
  if (item.action === 'logout') {
    await logout();
    router.push('/login');
  }
  closeMobileSidebar();
};

const closeMobileSidebar = () => emit('close-mobile');

async function loadBadges() {
  try {
    const page = await listApplications({ status: 'PENDING', size: 1 });
    pendingApplications.value = page.totalElements ?? 0;
  } catch (error) {
    console.warn('Compteur demandes indisponible :', error);
  }

  try {
    unresolvedAlerts.value = (await getUnresolvedRiskAlertsCount()) ?? 0;
  } catch (error) {
    console.warn('Compteur alertes indisponible :', error);
  }
}

onMounted(() => {
  loadBadges();
  document.addEventListener('click', closeSearchOnOutsideClick);
});
</script>

<template>
  <aside
    class="sidebar fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col"
    :class="[isCollapsed ? 'w-20' : 'w-72', isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
  >
    <!-- Logo -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200">
      <transition name="fade" mode="out-in">
        <div v-if="!isCollapsed" class="flex items-center space-x-3 min-w-0" key="full-logo">
          <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg flex-shrink-0">
            <img class="w-10 h-10" :src="logowf" alt="" />
          </div>
          <div class="min-w-0">
            <span class="text-xl font-bold text-gray-900 block leading-tight">Djeli Fin</span>
            <span v-if="session?.organizationName" class="text-xs text-gray-500 truncate block">
              {{ session.organizationName }}
            </span>
          </div>
        </div>
        <div v-else class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg" key="icon-only">
          <img class="w-6 h-6" :src="logowf" alt="" />
        </div>
      </transition>
    </div>

    <!-- Recherche -->
    <div class="px-4 py-4 relative" v-if="!isCollapsed" data-search-root @click.stop>
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          @keydown.enter.prevent="performSearch"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.esc="searchQuery = ''"
          placeholder="Rechercher une page..."
          class="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Effacer la recherche"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="searchQuery"
          class="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          <div v-if="searchResults.length === 0" class="px-4 py-6 text-center">
            <p class="text-sm text-gray-500">Aucune page ne correspond</p>
            <p class="text-xs text-gray-400 mt-1">Essayez « demandes », « retrait » ou « alertes ».</p>
          </div>

          <div v-else class="p-2">
            <p class="text-xs text-gray-500 px-2 py-1">{{ searchResults.length }} résultat(s)</p>
            <button
              v-for="(result, index) in searchResults"
              :key="result.path"
              type="button"
              @click="goToResult(result)"
              @mouseenter="highlightedIndex = index"
              class="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group"
              :class="highlightedIndex === index ? 'bg-primary-50' : 'hover:bg-gray-50'"
            >
              <svg
                class="w-4 h-4 flex-shrink-0"
                :class="highlightedIndex === index ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="result.iconPath" />
              </svg>
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium truncate"
                  :class="highlightedIndex === index ? 'text-primary-700' : 'text-gray-900'"
                >
                  {{ result.name }}
                </p>
                <p class="text-xs text-gray-500">{{ result.category }}</p>
              </div>
              <span
                v-if="result.badge"
                class="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                :class="badgeClass(result.badgeStyle)"
              >
                {{ result.badge }}
              </span>
            </button>
          </div>

          <p class="px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400">
            ↑ ↓ pour naviguer · Entrée pour ouvrir · Échap pour fermer
          </p>
        </div>
      </transition>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 overflow-y-auto">
      <!-- Principal -->
      <div class="mb-6">
        <h3 v-if="!isCollapsed" class="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Menu principal
        </h3>
        <ul class="space-y-1">
          <li v-for="item in mainMenuItems" :key="item.name">
            <router-link
              :to="item.path"
              class="menu-item flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all group relative"
              :class="isActiveRoute(item.path) ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'"
              @click="closeMobileSidebar"
            >
              <svg
                class="w-5 h-5 transition-colors flex-shrink-0"
                :class="isActiveRoute(item.path) ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
              </svg>

              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium truncate">{{ item.name }}</span>
              </transition>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div
                v-if="isCollapsed"
                class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              >
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Gestion PME -->
      <div class="mb-6">
        <h3 v-if="!isCollapsed" class="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Gestion PME
        </h3>
        <ul class="space-y-1">
          <li v-for="item in featureItems" :key="item.name">
            <router-link
              :to="item.path"
              class="menu-item flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all group relative"
              :class="isActiveRoute(item.path) ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'"
              @click="closeMobileSidebar"
            >
              <svg
                class="w-5 h-5 transition-colors flex-shrink-0"
                :class="isActiveRoute(item.path) ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
              </svg>

              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium truncate">{{ item.name }}</span>
              </transition>

              <transition name="fade">
                <span
                  v-if="!isCollapsed && item.badge"
                  class="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  :class="badgeClass(item.badgeStyle)"
                >
                  {{ item.badge }}
                </span>
              </transition>

              <span
                v-if="isCollapsed && item.badge"
                class="absolute top-2 right-2 w-2 h-2 rounded-full"
                :class="item.badgeStyle === 'danger' ? 'bg-red-500' : 'bg-primary-500'"
              ></span>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div
                v-if="isCollapsed"
                class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              >
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Général -->
      <div>
        <h3 v-if="!isCollapsed" class="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Général
        </h3>
        <ul class="space-y-1">
          <li v-for="item in generalItems" :key="item.name">
            <router-link
              v-if="item.path !== '/logout'"
              :to="item.path"
              class="menu-item flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all group relative hover:bg-gray-50"
              :class="isActiveRoute(item.path) ? 'bg-primary-50 text-primary-600' : ''"
              @click="closeMobileSidebar"
            >
              <svg
                class="w-5 h-5 transition-colors flex-shrink-0"
                :class="isActiveRoute(item.path) ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
              </svg>

              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium truncate">{{ item.name }}</span>
              </transition>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div
                v-if="isCollapsed"
                class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              >
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>

            <button
              v-else
              @click="handleGeneralItemClick(item)"
              class="menu-item w-full flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all group relative hover:bg-red-50 hover:text-red-600"
            >
              <svg
                class="w-5 h-5 text-gray-500 transition-colors group-hover:text-red-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
              </svg>

              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium">{{ item.name }}</span>
              </transition>

              <div
                v-if="isCollapsed"
                class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
              >
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Encart application mobile 
    <div v-if="!isCollapsed" class="p-4 border-t border-gray-200">
      <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
        <div class="flex items-start space-x-2 mb-3">
          <span class="text-2xl">🔥</span>
          <div>
            <h4 class="font-semibold text-sm">Application Djeli</h4>
            <p class="text-xs text-white/80 mt-1">Téléchargez l'application mobile pour plus de flexibilité.</p>
          </div>
        </div>
        <button
          class="w-full bg-white text-primary-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <span>Télécharger</span>
        </button>
      </div>
    </div>-->
  </aside>

  <div v-if="isMobileOpen" @click="closeMobileSidebar" class="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"></div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.menu-item {
  position: relative;
}

.menu-tooltip {
  z-index: 50;
  pointer-events: none;
}

nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
</style>
