<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/stores/auth';
import { getRiskAlerts, listApplications } from '@/services/bankPortal';
import { formatDateLong, formatCurrency, riskLabel, normalizeRiskLevel } from '@/utils/format';
import iconApplication from '@/assets/img/Doc.png';
import iconAlert from '@/assets/img/encourrembourssement.png';

const route = useRoute();
const router = useRouter();
const { session, fullName, initials, logout } = useAuth();

const emit = defineEmits(['toggle-sidebar', 'toggle-mobile-sidebar']);

const showUserMenu = ref(false);
const showNotifications = ref(false);

const riskAlerts = ref([]);
const pendingApplications = ref([]);
const loadingNotifications = ref(false);

const PAGE_LABELS = {
  dashboard: 'Tableau de bord',
  gestionpme: 'Gestion PME',
  detailpme: 'Détail PME',
  invest: 'Demandes de financement',
  produits: 'Produits',
  wallet: 'Wallet',
  alertes: 'Alertes de risque',
  parametres: 'Paramètres',
  support: 'Support',
  analytics: 'Analytics',
};

const currentPageName = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  const base = segments[0] || 'dashboard';
  return PAGE_LABELS[base] || base.charAt(0).toUpperCase() + base.slice(1);
});

const organizationName = computed(() => session.value?.organizationName || 'Djeli - Fin');
const userEmail = computed(() => session.value?.email || '');

/**
 * Flux de notifications unifié : demandes de financement à instruire
 * + alertes de risque non résolues, les plus récentes en premier.
 */
const notifications = computed(() => {
  const items = [];

  pendingApplications.value.forEach((app) => {
    items.push({
      id: `app-${app.id}`,
      kind: 'application',
      title: `Demande de ${app.organizationName}`,
      subtitle: `${formatCurrency(app.requestedAmount)} sur ${app.requestedDurationMonths} mois`,
      tag: app.status === 'UNDER_REVIEW' ? 'En instruction' : 'À instruire',
      tagClass: 'bg-gray-900 text-white',
      date: app.createdAt,
      route: '/invest',
    });
  });

  riskAlerts.value.forEach((alert) => {
    items.push({
      id: `alert-${alert.id}`,
      kind: 'alert',
      title: alert.title,
      subtitle: alert.organizationName,
      tag: riskLabel(alert.level),
      tagClass: 'bg-gray-900 text-white',
      date: alert.createdAt,
      route: '/alertes',
    });
  });

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const unreadCount = computed(() => notifications.value.length);

async function loadNotifications() {
  loadingNotifications.value = true;

  const [alerts, apps] = await Promise.allSettled([
    getRiskAlerts({ resolved: false, size: 10 }),
    listApplications({ status: 'PENDING', size: 10 }),
  ]);

  // Même normalisation que la page Alertes : le niveau renvoyé peut différer
  // du contrat (casse, libellé, nom de champ).
  riskAlerts.value =
    alerts.status === 'fulfilled'
      ? (alerts.value.content || []).map((a) => ({ ...a, level: normalizeRiskLevel(a) }))
      : [];
  pendingApplications.value = apps.status === 'fulfilled' ? apps.value.content || [] : [];

  loadingNotifications.value = false;
}

const toggleSidebar = () => emit('toggle-sidebar');
const toggleMobileSidebar = () => emit('toggle-mobile-sidebar');

const handleLogout = async () => {
  showUserMenu.value = false;
  await logout();
  router.push('/login');
};

const openNotification = (item) => {
  showNotifications.value = false;
  router.push(item.route);
};

const closeMenus = (event) => {
  if (!event.target.closest?.('[data-menu-root]')) {
    showUserMenu.value = false;
    showNotifications.value = false;
  }
};

onMounted(() => {
  // Le thème sombre n'est pas implémenté sur l'ensemble de l'application :
  // on purge une éventuelle préférence enregistrée par une version précédente.
  localStorage.removeItem('theme');
  document.documentElement.classList.remove('dark');

  loadNotifications();
  document.addEventListener('click', closeMenus);
});
</script>

<template>
  <header class="sticky top-0 z-30 bg-white border-b border-gray-200">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Gauche -->
      <div class="flex items-center space-x-4 min-w-0">
        <button
          @click="toggleMobileSidebar"
          class="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          @click="toggleSidebar"
          class="hidden lg:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <nav class="hidden md:flex items-center space-x-2 text-sm min-w-0">
          <router-link
            to="/dashboard"
            class="text-gray-500 hover:text-gray-700 transition-colors truncate max-w-[180px]"
          >
            {{ organizationName }}
          </router-link>
          <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="font-medium text-gray-900 truncate">{{ currentPageName }}</span>
        </nav>
      </div>

      <!-- Droite -->
      <div class="flex items-center space-x-2 md:space-x-3">
        <!-- Aide -->
        <router-link
          to="/support"
          class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Support"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </router-link>

        <!-- Notifications -->
        <div class="relative" data-menu-root>
          <button
            @click.stop="showNotifications = !showNotifications; showUserMenu = false"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span
              v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="transform opacity-0 translate-y-2"
            enter-to-class="transform opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="transform opacity-100 translate-y-0"
            leave-to-class="transform opacity-0 translate-y-2"
          >
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-custom-lg border border-gray-100 z-50"
              @click.stop
            >
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
                <div class="flex items-center gap-3">
                  <router-link
                    to="/invest"
                    @click="showNotifications = false"
                    class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Demandes
                  </router-link>
                  <router-link
                    to="/alertes"
                    @click="showNotifications = false"
                    class="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Alertes
                  </router-link>
                </div>
              </div>

              <div class="max-h-96 overflow-y-auto">
                <div v-if="loadingNotifications" class="px-4 py-8 text-center text-sm text-gray-500">
                  Chargement…
                </div>

                <div v-else-if="notifications.length === 0" class="px-4 py-10 text-center">
                  <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-3">
                    <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p class="text-sm font-medium text-gray-900">Rien à signaler</p>
                  <p class="text-xs text-gray-500 mt-0.5">Aucune demande en attente ni alerte en cours.</p>
                </div>

                <button
                  v-for="item in notifications"
                  :key="item.id"
                  @click="openNotification(item)"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-black">
                      <img
                        :src="item.kind === 'application' ? iconApplication : iconAlert"
                        :alt="item.kind === 'application' ? 'Demande' : 'Alerte'"
                        
                      />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
                        <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" :class="item.tagClass">
                          {{ item.tag }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-600 mt-0.5 truncate">{{ item.subtitle }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ formatDateLong(item.date) }}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- Profil -->
        <div class="relative" data-menu-root>
          <button
            @click.stop="showUserMenu = !showUserMenu; showNotifications = false"
            class="flex items-center space-x-2 md:space-x-3 p-1 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div
              class="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-primary-100"
            >
              {{ initials }}
            </div>
            <svg class="hidden md:block w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-custom-lg border border-gray-100 py-2 z-50"
              @click.stop
            >
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-medium text-gray-900 truncate">{{ fullName }}</p>
                <p class="text-xs text-gray-500 mt-1 truncate">{{ userEmail }}</p>
                <p v-if="session?.role" class="text-xs text-primary-600 mt-1">{{ session.role }}</p>
              </div>

              <div class="py-2">
                <router-link
                  to="/parametres"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Mon profil
                </router-link>
                <router-link
                  to="/parametres"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Paramètres
                </router-link>
                <router-link
                  to="/wallet"
                  @click="showUserMenu = false"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  Wallet
                </router-link>
              </div>

              <div class="pt-2 border-t border-gray-100">
                <button
                  @click="handleLogout"
                  class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>