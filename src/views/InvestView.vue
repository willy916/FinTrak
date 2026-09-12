<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import ApplicationReviewModal from '../components/common/PMEProfileModal.vue';
import { listApplications, getLeads } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import AmountCompact from '@/components/common/AmountCompact.vue';
import {
  formatCurrency,
  formatDate,
  formatSector,
  scoreColorClass,
  statusLabel,
} from '@/utils/format';

import { statusIcon, statusIconBg } from '@/utils/statusIcons';

/* Icônes du bloc Statistiques */
import Doc from '../assets/img/Doc.png';
import Docs from '../assets/img/Docs.png';
import imgvalide from '../assets/img/valide.png';
import imgfinanc from '../assets/img/Coins.png';




const isLoading = ref(true);
const isLoadingCards = ref(true);
const errorMessage = ref('');

const applications = ref([]);
const leadsByOrg = ref(new Map());

const searchQuery = ref('');
const activeFilter = ref('Tous');
const showFilterMenu = ref(false);
const selectedApplication = ref(null);

const currentPage = ref(1);
const itemsPerPage = ref(6);

/**
 * Le template filtrait par « Ciblée / Générale ». Cette notion n'existe pas
 * dans l'API : toute demande reçue par ce portail est adressée à cette
 * microfinance. Le filtre porte donc sur le statut d'instruction.
 */
const filterOptions = [
  { value: 'Tous', label: 'Toutes les demandes', description: 'Tous statuts confondus' },
  { value: 'PENDING', label: 'En attente', description: 'Nouvelles demandes à traiter' },
  { value: 'UNDER_REVIEW', label: 'En instruction', description: 'Dossiers en cours d\'analyse' },
  { value: 'APPROVED', label: 'Approuvées', description: 'À décaisser' },
  { value: 'REJECTED', label: 'Rejetées', description: 'Dossiers refusés' },
  { value: 'DISBURSED', label: 'Décaissées', description: 'Prêts déjà versés' },
];

const filterLabels = Object.fromEntries(filterOptions.map((o) => [o.value, o.label]));

/* ─────────────── Statistiques ─────────────── */
const totalRequests = computed(() => applications.value.length);
const pendingRequests = computed(
  () => applications.value.filter((a) => ['PENDING', 'UNDER_REVIEW'].includes(a.status)).length
);
const approvedRequests = computed(
  () => applications.value.filter((a) => ['APPROVED', 'DISBURSED'].includes(a.status)).length
);
const totalAmount = computed(() =>
  applications.value
    .filter((a) => ['PENDING', 'UNDER_REVIEW'].includes(a.status))
    .reduce((sum, a) => sum + (a.requestedAmount || 0), 0)
);

/* ─────────────── Filtrage ─────────────── */
const enrichedApplications = computed(() =>
  applications.value.map((app) => {
    const lead = leadsByOrg.value.get(app.organizationId) || null;
    return {
      ...app,
      sector: lead?.sector ?? null,
      totalScore: lead?.totalScore ?? null,
      maxScore: lead?.maxScore ?? null,
      scoreLabelFr: lead?.scoreLabelFr ?? null,
      city: lead?.city ?? null,
      kycVerified: lead?.kycVerified ?? null,
      avgMonthlyRevenue: lead?.avgMonthlyRevenue ?? null,
    };
  })
);

const filteredApplications = computed(() => {
  let filtered = enrichedApplications.value;

  if (activeFilter.value !== 'Tous') {
    filtered = filtered.filter((app) => app.status === activeFilter.value);
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (app) =>
        app.organizationName?.toLowerCase().includes(q) ||
        app.bankProductTitle?.toLowerCase().includes(q) ||
        app.purpose?.toLowerCase().includes(q) ||
        formatSector(app.sector).toLowerCase().includes(q)
    );
  }

  // Les dossiers à traiter en premier, puis les plus récents.
  const priority = { PENDING: 0, UNDER_REVIEW: 1, APPROVED: 2, DISBURSED: 3, REJECTED: 4, CANCELLED: 5 };
  return [...filtered].sort((a, b) => {
    const pa = priority[a.status] ?? 9;
    const pb = priority[b.status] ?? 9;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

/* ─────────────── Pagination ─────────────── */
const totalFilteredItems = computed(() => filteredApplications.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalFilteredItems.value / itemsPerPage.value)));
const startItem = computed(() => (totalFilteredItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1));
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalFilteredItems.value));

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredApplications.value.slice(start, start + itemsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

/* ─────────────── Chargement ─────────────── */
async function loadApplications() {
  isLoading.value = true;
  isLoadingCards.value = true;
  errorMessage.value = '';

  try {
    const page = await listApplications({ size: 100 });
    applications.value = page.content || [];
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
    applications.value = [];
  } finally {
    isLoading.value = false;
    isLoadingCards.value = false;
  }

  // Enrichissement optionnel avec le profil des marchands.
  try {
    const leadsPage = await getLeads({ size: 200 });
    leadsByOrg.value = new Map((leadsPage.content || []).map((l) => [l.organizationId, l]));
  } catch (error) {
    console.warn('Profils marchands indisponibles :', error);
  }
}

const filterBy = (option) => {
  activeFilter.value = option;
  showFilterMenu.value = false;
  currentPage.value = 1;
};

const openApplication = (app) => {
  selectedApplication.value = app;
};

const closeApplication = () => {
  selectedApplication.value = null;
};

/** Remplace la demande mise à jour dans la liste sans recharger toute la page. */
const handleApplicationUpdated = (updated) => {
  const index = applications.value.findIndex((a) => a.id === updated.id);
  if (index > -1) applications.value.splice(index, 1, updated);
  if (selectedApplication.value?.id === updated.id) {
    selectedApplication.value = { ...selectedApplication.value, ...updated };
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1;
};

/** Barre d'urgence : plus la demande attend, plus elle remonte visuellement. */
function waitingDays(createdAt) {
  if (!createdAt) return 0;
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

onMounted(loadApplications);
</script>

<template>
  <div class="invest-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Demandes de Financement</h1>
          <p class="text-gray-500 mt-1">Instruisez les demandes en fonction du profil de chaque PME</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <div class="relative">
            <input
              type="text"
              placeholder="Rechercher une PME..."
              v-model="searchQuery"
              class="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full md:w-64"
            />
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div class="relative">
            <button
              @click.stop="showFilterMenu = !showFilterMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span class="text-sm font-medium text-gray-700">Filtrer</span>
              <span
                v-if="activeFilter !== 'Tous'"
                class="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
              >
                {{ filterLabels[activeFilter] }}
              </span>
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
                v-if="showFilterMenu"
                class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-20"
                @click.stop
              >
                <button
                  v-for="option in filterOptions"
                  :key="option.value"
                  @click="filterBy(option.value)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                  :class="activeFilter === option.value ? 'bg-primary-50' : ''"
                >
                  <div class="min-w-0">
                    <div class="font-medium" :class="activeFilter === option.value ? 'text-primary-700' : 'text-gray-700'">
                      {{ option.label }}
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ option.description }}</div>
                  </div>
                  <svg
                    v-if="activeFilter === option.value"
                    class="w-5 h-5 text-primary-600 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtre actif -->
    <div v-if="activeFilter !== 'Tous'" class="mb-6 flex items-center space-x-2">
      <div class="inline-flex items-center px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg">
        <svg class="w-4 h-4 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-sm font-medium text-primary-700">{{ filterLabels[activeFilter] }}</span>
        <button @click="filterBy('Tous')" class="ml-2 text-primary-600 hover:text-primary-800">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      <p class="font-medium">Impossible de charger les demandes</p>
      <p class="mt-0.5">{{ errorMessage }}</p>
    </div>

    <!-- Statistiques -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-gray-600 text-sm mb-1">Total Demandes</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ totalRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
             <img :src="Doc" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-gray-600 text-sm mb-1">À instruire</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ pendingRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="Docs" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-gray-600 text-sm mb-1">Approuvées</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ approvedRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
             <img :src="imgvalide" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-gray-600 text-sm mb-1">Montant sollicité</p>
            <AmountCompact tag="h3" class="text-xl font-bold text-gray-900 break-words" :value="totalAmount" />
          </div>
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="imgfinanc" alt="">
          </div>
        </div>
      </div>
    </div>

    <!-- Cartes de demandes -->
    <div v-if="isLoadingCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" v-for="i in 6" :key="i" />
    </div>

    <div v-else-if="paginatedApplications.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
      <p class="text-gray-500">
        {{ searchQuery || activeFilter !== 'Tous'
          ? 'Essayez de modifier vos filtres ou votre recherche.'
          : 'Les demandes de financement adressées à votre microfinance apparaîtront ici.' }}
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="app in paginatedApplications"
        :key="app.id"
        class="card card-hover animate-slide-in-up group cursor-pointer flex flex-col"
        @click="openApplication(app)"
      >
        <!-- En-tête -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="flex items-center space-x-3 min-w-0">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="statusIconBg(app.status)"
            >
              <img :src="statusIcon(app.status)" :alt="statusLabel(app.status)" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                {{ app.organizationName }}
              </h3>
              <p class="text-xs text-gray-500 truncate">{{ formatSector(app.sector) }}</p>
            </div>
          </div>
          <StatusBadge :status="app.status" />
        </div>

        <!-- Produit et objet -->
        <div class="mb-4">
          <p class="text-xs text-gray-500 mb-1">Produit sollicité</p>
          <p class="text-sm font-medium text-gray-900 truncate">{{ app.bankProductTitle }}</p>
        </div>

        <p class="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
          {{ app.purpose || 'Aucun objet précisé.' }}
        </p>

        <!-- Chiffres -->
        <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p class="text-xs text-gray-500 mb-1">Montant demandé</p>
            <p class="text-sm font-bold text-gray-900">{{ formatCurrency(app.requestedAmount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Durée</p>
            <p class="text-sm font-semibold text-gray-900">{{ app.requestedDurationMonths }} mois</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">CA mensuel</p>
            <p class="text-sm font-semibold text-gray-900">
              <AmountCompact :value="app.avgMonthlyRevenue" />
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Reçue le</p>
            <p class="text-sm font-semibold text-gray-900">{{ formatDate(app.createdAt) }}</p>
          </div>
        </div>

        <!-- Score -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-600">Score de crédit</span>
            <span v-if="app.totalScore != null" class="text-xs font-medium" :class="scoreColorClass(app.totalScore, app.maxScore)">
              {{ app.totalScore }} / {{ app.maxScore }}
              <span v-if="app.scoreLabelFr" class="text-gray-400 font-normal"> · {{ app.scoreLabelFr }}</span>
            </span>
            <span v-else class="text-xs text-gray-400">Non disponible</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
              :style="{ width: app.totalScore && app.maxScore ? Math.min(100, (app.totalScore / app.maxScore) * 100) + '%' : '0%' }"
            ></div>
          </div>
        </div>

        <!-- Indicateurs -->
        <div class="flex items-center gap-2 mb-4 flex-wrap">
          <span
            v-if="app.kycVerified"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
          >
            KYC vérifié
          </span>
          <span
            v-if="app.aiRecommendation"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
          >
            Pré-évaluation IA
          </span>
          <span
            v-if="['PENDING', 'UNDER_REVIEW'].includes(app.status) && waitingDays(app.createdAt) > 7"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700"
          >
            En attente depuis {{ waitingDays(app.createdAt) }} j
          </span>
        </div>

        <!-- Actions -->
        <button
          @click.stop="openApplication(app)"
          class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          {{ ['PENDING', 'UNDER_REVIEW'].includes(app.status)
            ? 'Instruire la demande'
            : app.status === 'APPROVED'
              ? 'Décaisser le prêt'
              : 'Consulter le dossier' }}
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="!isLoadingCards && totalFilteredItems > 0"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200"
    >
      <div class="text-sm text-gray-500">
        Affichage <span class="font-medium text-gray-900">{{ startItem }}</span> à
        <span class="font-medium text-gray-900">{{ endItem }}</span> sur
        <span class="font-medium text-gray-900">{{ totalFilteredItems }}</span> résultats
      </div>

      <div class="flex items-center space-x-2">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === page
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          {{ page }}
        </button>

        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Modale d'instruction -->
    <ApplicationReviewModal
      :application="selectedApplication"
      @close="closeApplication"
      @updated="handleApplicationUpdated"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-delay-100 {
  animation-delay: 100ms;
}
.animate-delay-200 {
  animation-delay: 200ms;
}
.animate-delay-300 {
  animation-delay: 300ms;
}
</style>