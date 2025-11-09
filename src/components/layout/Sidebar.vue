<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logowf from "../../assets/img/logowf.png"
const route = useRoute();
const router = useRouter();

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isMobileOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-collapse', 'close-mobile']);

const searchQuery = ref('');

const mainMenuItems = ref([
  { 
    name: 'Dashboard', 
    path: '/dashboard', 
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    badge: null,
    category: 'Principal'
  },
  { 
    name: 'Wallet', 
    path: '/wallet', 
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    badge: null,
    category: 'Principal'
  },
]);

const featureItems = ref([
  { 
    name: 'Gestion PME', 
    path: '/gestionpme', 
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    badge: null,
    category: 'Gestion PME'
  },
  { 
    name: 'Détails PME', 
    path: '/detailpme', 
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    badge: null,
    category: 'Gestion PME'
  },
  { 
    name: 'Investissements', 
    path: '/invest', 
    iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    badge: '24',
    category: 'Gestion PME'
  }
]);

const generalItems = ref([
  { 
    name: 'Paramètres', 
    path: '/Paramètres', 
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    badge: null,
    category: 'Général'
  },
  { 
    name: 'Support', 
    path: '/support', 
    iconPath: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    badge: '16',
    category: 'Général'
  },
  { 
    name: 'Log out', 
    path: '/logout', 
    iconPath: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    action: 'logout',
    category: 'Général'
  }
]);

const allMenuItems = computed(() => {
  return [...mainMenuItems.value, ...featureItems.value, ...generalItems.value];
});

const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  
  const query = searchQuery.value.toLowerCase();
  return allMenuItems.value.filter(item => 
    item.name.toLowerCase().includes(query) && item.path !== '/logout'
  );
});

const handleSearch = () => {
  // Real-time filtering
};

const performSearch = () => {
  if (searchResults.value.length > 0) {
    router.push(searchResults.value[0].path);
    clearSearch();
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  closeMobileSidebar();
};

const isActiveRoute = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const handleGeneralItemClick = (item) => {
  if (item.action === 'logout') {
    // Supprimer toutes les données d'authentification
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Redirection vers la page de login
    window.location.href = '/login';
    
    console.log('Déconnexion effectuée');
  }
  closeMobileSidebar();
};

const closeMobileSidebar = () => {
  emit('close-mobile');
};
</script>

<template>
  <aside 
    class="sidebar fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col"
    :class="[
      isCollapsed ? 'w-20' : 'w-72',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <!-- Logo Section -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200">
      <transition name="fade" mode="out-in">
        <div v-if="!isCollapsed" class="flex items-center space-x-3" key="full-logo">
          <div class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">

            <img class="w-6 h-6" :src="logowf" alt="">
          </div>
          <span class="text-xl font-bold text-gray-900">FinTrak - MF</span>
        </div>
        <div v-else class="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg" key="icon-only">
          <img class="w-6 h-6" :src="logowf" alt="">
        </div>
      </transition>
    </div>

    <!-- Search Bar -->
    <div class="px-4 py-4" v-if="!isCollapsed">
      <div class="relative">
        <input 
          type="text" 
          v-model="searchQuery"
          @input="handleSearch"
          @keydown.enter="performSearch"
          placeholder="Rechercher..." 
          class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        >
        <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="absolute right-3 top-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">⌘ K</span>
      </div>

      <!-- Search Results Dropdown -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div v-if="searchQuery && searchResults.length > 0" class="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          <div class="p-2">
            <p class="text-xs text-gray-500 px-2 py-1">{{ searchResults.length }} résultat(s)</p>
            <router-link
              v-for="result in searchResults"
              :key="result.path"
              :to="result.path"
              @click="clearSearch"
              class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <svg class="w-4 h-4 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="result.iconPath" />
              </svg>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ result.name }}</p>
                <p class="text-xs text-gray-500">{{ result.category }}</p>
              </div>
            </router-link>
          </div>
        </div>
      </transition>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 px-3 py-4 overflow-y-auto" style="max-height: calc(100vh - 180px);">
      <!-- Main Menu -->
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
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="item.iconPath"
                />
              </svg>
              
              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium">{{ item.name }}</span>
              </transition>

              <transition name="fade">
                <span v-if="!isCollapsed && item.badge" 
                      class="ml-auto bg-primary-100 text-primary-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </transition>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div v-if="isCollapsed" class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- Features -->
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
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="item.iconPath"
                />
              </svg>
              
              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium">{{ item.name }}</span>
              </transition>

              <transition name="fade">
                <span v-if="!isCollapsed && item.badge" 
                      class="ml-auto bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </transition>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div v-if="isCollapsed" class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- General -->
      <div>
        <h3 v-if="!isCollapsed" class="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Generale
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
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="item.iconPath"
                />
              </svg>
              
              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium">{{ item.name }}</span>
              </transition>

              <transition name="fade">
                <span v-if="!isCollapsed && item.badge" 
                      class="ml-auto bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </transition>

              <div v-if="isActiveRoute(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r-full"></div>

              <div v-if="isCollapsed" class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </router-link>

            <button
              v-else
              @click="handleGeneralItemClick(item)"
              class="menu-item w-full flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all group relative hover:bg-gray-50"
            >
              <svg 
                class="w-5 h-5 text-gray-500 transition-colors group-hover:text-primary-600 flex-shrink-0"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="item.iconPath"
                />
              </svg>
              
              <transition name="fade">
                <span v-if="!isCollapsed" class="ml-3 font-medium">{{ item.name }}</span>
              </transition>

              <div v-if="isCollapsed" class="menu-tooltip absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {{ item.name }}
                <div class="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Upgrade Pro Section -->
    <div v-if="!isCollapsed" class="p-4 border-t border-gray-200">
      <div class="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-4 text-white">
        <div class="flex items-start space-x-2 mb-3">
          <span class="text-2xl">🔥</span>
          <div>
            <h4 class="font-semibold text-sm">Application FinTrak</h4>
            <p class="text-xs text-white/80 mt-1">Téléchargez l’application mobile pour plus de flexibilité.</p>
          </div>
        </div>
        <button class="w-full bg-white text-primary-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Téléchargez</span>
        </button>
        <button class="w-full text-white text-xs mt-2 hover:underline">Voir plus</button>
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div 
    v-if="isMobileOpen"
    @click="closeMobileSidebar"
    class="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
  ></div>
</template>



<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
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