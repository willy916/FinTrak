<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import AddPMEModal from '@/components/common/AddPMEModal.vue';
import { fetchPortfolio, upcomingSchedule } from '@/services/portfolio';
import { getBankLinkRequests } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import AmountCompact from '@/components/common/AmountCompact.vue';

import iconFinanced from '../assets/img/Home.png';
import imgCoins from '../assets/img/Coins.png';
import Encours from '../assets/img/Encours.png';
import iconLate from '../assets/img/encourrembourssement.png';



import {
  formatCurrency,
  formatDateLong,
  formatDate,
  formatSector,
  progressBarClass,
} from '@/utils/format';

const router = useRouter();

const isLoading = ref(true);
const isLoadingTable = ref(true);
const errorMessage = ref('');

const searchQuery = ref('');
const paymentFilter = ref('all');
const activeActionMenu = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(8);
const showAddPMEModal = ref(false);
const activeTab = ref('portfolio');

const loans = ref([]);
const leads = ref([]);
const linkRequests = ref([]);
const stats = ref({
  totalLoans: 0,
  uniqueClients: 0,
  totalDisbursed: 0,
  totalRepaid: 0,
  totalRemaining: 0,
  recoveryRate: 0,
  paidOff: 0,
  active: 0,
  late: 0,
});

/** Marchands sélectionnables pour l'import d'un prêt : clients financés + leads qualifiés. */
const availablePMEs = computed(() => {
  const seen = new Map();
  loans.value.forEach((l) => {
    if (!seen.has(l.organizationId)) {
      seen.set(l.organizationId, {
        organizationId: l.organizationId,
        organizationName: l.organizationName,
        clientCode: l.clientCode,
      });
    }
  });
  leads.value.forEach((l) => {
    if (!seen.has(l.organizationId)) {
      seen.set(l.organizationId, {
        organizationId: l.organizationId,
        organizationName: l.organizationName,
        clientCode: l.clientCode,
      });
    }
  });
  return Array.from(seen.values());
});

/* ─────────────── Filtrage ─────────────── */
const filteredLoans = computed(() => {
  let filtered = upcomingSchedule(loans.value);

  // « Tous » inclut aussi les prêts soldés, que upcomingSchedule exclut.
  if (paymentFilter.value === 'all') {
    filtered = [...loans.value].sort((a, b) => {
      if (a.daysLate !== b.daysLate) return b.daysLate - a.daysLate;
      const da = a.nextPaymentDate ? new Date(a.nextPaymentDate).getTime() : Infinity;
      const db = b.nextPaymentDate ? new Date(b.nextPaymentDate).getTime() : Infinity;
      return da - db;
    });
  } else if (paymentFilter.value === 'completed') {
    filtered = loans.value.filter((l) => l.displayStatus === 'PAID_OFF');
  } else if (paymentFilter.value === 'ongoing') {
    filtered = loans.value.filter((l) => l.displayStatus === 'ACTIVE');
  } else if (paymentFilter.value === 'late') {
    filtered = loans.value.filter((l) => l.displayStatus === 'LATE');
  }

  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(
      (l) =>
        l.organizationName?.toLowerCase().includes(q) ||
        l.clientCode?.toLowerCase().includes(q) ||
        formatSector(l.sector).toLowerCase().includes(q)
    );
  }

  return filtered;
});

/* ─────────────── Pagination ─────────────── */
const totalFilteredItems = computed(() => filteredLoans.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalFilteredItems.value / itemsPerPage.value)));
const startItem = computed(() => (totalFilteredItems.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1));
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalFilteredItems.value));

const paginatedLoans = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredLoans.value.slice(start, start + itemsPerPage.value);
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
async function loadData() {
  isLoading.value = true;
  isLoadingTable.value = true;
  errorMessage.value = '';

  try {
    const portfolio = await fetchPortfolio();
    loans.value = portfolio.loans;
    leads.value = portfolio.leads;
    stats.value = portfolio.stats;
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isLoading.value = false;
    isLoadingTable.value = false;
  }

  try {
    linkRequests.value = await getBankLinkRequests();
  } catch (error) {
    console.warn('Demandes de liaison indisponibles :', error);
    linkRequests.value = [];
  }
}

const changeFilter = (filter) => {
  paymentFilter.value = filter;
  currentPage.value = 1;
};

const toggleActionMenu = (loanId) => {
  activeActionMenu.value = activeActionMenu.value === loanId ? null : loanId;
};

const openDossier = (loan) => {
  activeActionMenu.value = null;
  router.push(`/detailpme/${loan.organizationId}`);
};

const handlePMECreated = () => {
  loadData();
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

const linkStatusMeta = (status) => {
  if (status === 'APPROVED') return { label: 'Lié / Approuvé', cls: 'bg-green-100 text-green-700', dot: 'bg-green-600' };
  if (status === 'REJECTED') return { label: 'Refusé', cls: 'bg-red-100 text-red-700', dot: 'bg-red-600' };
  return { label: 'En attente', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-600' };
};

const closeMenus = () => {
  activeActionMenu.value = null;
};

onMounted(() => {
  loadData();
  document.addEventListener('click', closeMenus);
});
</script>

<template>
  <div class="pme-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Gestion des PME</h1>
          <p class="text-gray-500 mt-1">Suivez les PME financées et leur niveau de remboursement</p>
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
          <button
            @click="showAddPMEModal = true"
            class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-sm font-medium"><span class="disp">Nouvelle</span> PME</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      <p class="font-medium">Impossible de charger le portefeuille</p>
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
            <p class="text-sm text-gray-500 mb-1">Total PME Financées</p>
            <h3 class="text-3xl font-bold text-gray-900">{{ stats.uniqueClients }}</h3>
            <p class="text-xs text-gray-400 mt-1"><AmountCompact :value="stats.totalDisbursed" /> décaissés</p>
          </div>
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
             <img :src="iconFinanced" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-sm text-gray-500 mb-1">Remboursées</p>
            <h3 class="text-3xl font-bold text-gray-900">{{ stats.paidOff }}</h3>
            <p class="text-xs text-gray-400 mt-1">{{ stats.recoveryRate }} % de recouvrement</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-black flex-shrink-0">
            <img :src="imgCoins" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-sm text-gray-500 mb-1">Remboursement en cours</p>
            <h3 class="text-3xl font-bold text-gray-900">{{ stats.active }}</h3>
            <p class="text-xs text-gray-400 mt-1"><AmountCompact :value="stats.totalRemaining" /> d'encours</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-black flex-shrink-0">
            <img :src="Encours" alt="">
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-sm text-gray-500 mb-1">En retard</p>
            <h3 class="text-3xl font-bold" :class="stats.late > 0 ? 'text-red-600' : 'text-gray-900'">{{ stats.late }}</h3>
            <p class="text-xs text-gray-400 mt-1">Échéances dépassées</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-black flex-shrink-0">
            <img :src="iconLate" alt="">
          </div>
        </div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="border-b border-gray-200 flex items-center gap-6 text-sm font-medium mb-6">
      <button
        @click="activeTab = 'portfolio'"
        class="pb-3 border-b-2 transition-colors flex items-center gap-2"
        :class="activeTab === 'portfolio' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        <span>Portefeuille</span>
        <span
          class="px-2 py-0.5 text-xs rounded-full"
          :class="activeTab === 'portfolio' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'"
        >
          {{ stats.totalLoans }}
        </span>
      </button>
      <button
        @click="activeTab = 'linkages'"
        class="pb-3 border-b-2 transition-colors flex items-center gap-2"
        :class="activeTab === 'linkages' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        <span>Demandes d'association</span>
        <span
          class="px-2 py-0.5 text-xs rounded-full"
          :class="activeTab === 'linkages' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'"
        >
          {{ linkRequests.length }}
        </span>
      </button>
    </div>

    <!-- Onglet portefeuille -->
    <div v-if="activeTab === 'portfolio'" class="card">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Échéancier des Remboursements</h3>
            <p class="text-sm text-gray-500 mt-1">Prochains paiements attendus</p>
          </div>

          <div class="flex items-center space-x-2 flex-wrap gap-2">
            <span class="text-sm text-gray-600 mr-1">Statut :</span>
            <button
              v-for="opt in [
                { key: 'all', label: 'Tous', active: 'bg-primary-600 text-white' },
                { key: 'completed', label: 'Soldé', active: 'bg-green-600 text-white' },
                { key: 'ongoing', label: 'En cours', active: 'bg-blue-600 text-white' },
                { key: 'late', label: 'En retard', active: 'bg-red-600 text-white' }
              ]"
              :key="opt.key"
              @click="changeFilter(opt.key)"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                paymentFilter === opt.key ? opt.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="isLoadingTable">
        <SkeletonLoader type="table" :rows="6" />
      </div>

      <div v-else-if="paginatedLoans.length === 0" class="text-center py-14">
        <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 class="text-base font-medium text-gray-900 mb-1">Aucune PME dans ce filtre</h3>
        <p class="text-sm text-gray-500">
          Les prêts décaissés depuis la page Demandes apparaîtront automatiquement ici.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">PME</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant Prêté</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Restant Dû</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Échéance</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Progression</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jours Restants</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="loan in paginatedLoans" :key="loan.loanId" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  >
                    {{ loan.organizationName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ loan.organizationName }}</p>
                    <p class="text-xs text-gray-500">
                      {{ formatSector(loan.sector) }}
                      <span v-if="loan.clientCode" class="text-primary-600 font-mono"> · {{ loan.clientCode }}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm font-semibold text-gray-900 whitespace-nowrap">{{ formatCurrency(loan.principalAmount) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-700 whitespace-nowrap">{{ formatCurrency(loan.remainingAmount) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(loan.nextPaymentDate) }}</span>
              </td>
              <td class="py-4 px-4">
                <div class="w-32">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-gray-600">{{ loan.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-500"
                      :class="progressBarClass(loan.progress)"
                      :style="{ width: loan.progress + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <StatusBadge :status="loan.displayStatus" />
              </td>
              <td class="py-4 px-4 text-center">
                <span
                  v-if="loan.displayStatus === 'PAID_OFF'"
                  class="text-sm text-gray-400"
                >—</span>
                <span
                  v-else-if="loan.daysRemaining !== null"
                  :class="[
                    'text-sm font-medium whitespace-nowrap',
                    loan.daysRemaining < 0 ? 'text-red-600' : loan.daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-900'
                  ]"
                >
                  {{ loan.daysRemaining < 0 ? `Retard de ${Math.abs(loan.daysRemaining)}` : loan.daysRemaining }} jours
                </span>
                <span v-else class="text-sm text-gray-400">—</span>
              </td>
              <td class="py-4 px-4 text-center">
                <div class="relative inline-block">
                  <button
                    @click.stop="toggleActionMenu(loan.loanId)"
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
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
                      v-if="activeActionMenu === loan.loanId"
                      class="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      @click.stop
                    >
                      <button
                        @click="openDossier(loan)"
                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>Voir le dossier</span>
                      </button>
                      <button
                        @click="openDossier(loan)"
                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>Enregistrer un paiement</span>
                      </button>
                    </div>
                  </transition>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
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
      </div>
    </div>

    <!-- Onglet associations -->
    <div v-else class="card">
      <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Demandes d'association</h3>
          <p class="text-sm text-gray-500 mt-1">
            Suivi des liaisons envoyées par code client, téléphone ou NINEA/RCCM
          </p>
        </div>
        <button
          @click="showAddPMEModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Lier un marchand
        </button>
      </div>

      <div v-if="linkRequests.length === 0" class="text-center py-14">
        <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <h3 class="text-base font-medium text-gray-900 mb-1">Aucune demande d'association</h3>
        <p class="text-sm text-gray-500 mb-5">
          Liez un marchand Djeli pour consulter son profil et lui proposer un financement.
        </p>
        <button
          @click="showAddPMEModal = true"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Lier un marchand
        </button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Marchand</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Demandé le</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="req in linkRequests" :key="req.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4 text-sm font-medium text-gray-900">{{ req.partnerName || '—' }}</td>
              <td class="py-4 px-4 text-xs uppercase font-medium text-gray-500">{{ req.partnerType || '—' }}</td>
              <td class="py-4 px-4">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="linkStatusMeta(req.status).cls"
                >
                  <span class="w-1.5 h-1.5 mr-1.5 rounded-full" :class="linkStatusMeta(req.status).dot"></span>
                  {{ linkStatusMeta(req.status).label }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">{{ formatDate(req.requestedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modale -->
    <AddPMEModal
      :show="showAddPMEModal"
      :available-p-m-es="availablePMEs"
      @close="showAddPMEModal = false"
      @pme-created="handlePMECreated"
    />
  </div>
</template>

<style scoped>
@media only screen and (max-width: 930px) {
  .disp {
    display: none;
  }
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
