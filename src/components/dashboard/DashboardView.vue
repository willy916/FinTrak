<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import SkeletonLoader from '../common/SkeletonLoader.vue';
import StatusBadge from '../common/StatusBadge.vue';
import AmountCompact from '../common/AmountCompact.vue';
import { fetchPortfolio, disbursementsByMonth, upcomingSchedule, computeStats } from '@/services/portfolio';
import { getProfile, getBankActivityTrend } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';

/* Icônes des cartes principales */
import imgfinanc from '../../assets/img/Coins.png';
import imgwallet from '../../assets/img/Wallet.png';
import Encours from '../../assets/img/Encours.png';

/**
 * Icônes des cartes « Mes PME ».
 * Toutes pointent sur Coins.png pour l'instant : il suffit de changer le chemin
 * de la ligne concernée pour remplacer une icône, sans toucher au reste du code.
 */
import iconFinanced from '../../assets/img/Home.png';
import iconPaidOff from '../../assets/img/Coins.png';
import iconActive from '../../assets/img/Encours.png';
import iconLate from '../../assets/img/encourrembourssement.png';

import { formatCurrency, formatDateLong, formatPeriod, formatSector, progressBarClass } from '@/utils/format';

const router = useRouter();

const isLoading = ref(true);
const isLoadingTable = ref(true);
const errorMessage = ref('');

const showPeriodMenu = ref(false);
const selectedPeriod = ref('Cette Année');
const periods = ['Ce Mois', '3 Derniers Mois', '6 Derniers Mois', 'Cette Année'];
const PERIOD_MONTHS = { 'Ce Mois': 1, '3 Derniers Mois': 3, '6 Derniers Mois': 6, 'Cette Année': 12 };

const paymentFilter = ref('all');
const activeActionMenu = ref(null);

/* ─────────────── Données API ─────────────── */
const profile = ref(null);
const loans = ref([]);

/**
 * Point de départ de la période sélectionnée, aligné sur le calendrier :
 * « Ce Mois » démarre le 1er du mois en cours, « Cette Année » le 1er janvier.
 * Les deux options intermédiaires sont des fenêtres glissantes de N mois,
 * mois en cours inclus.
 */
function periodStartDate(period) {
  const now = new Date();
  if (period === 'Ce Mois') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === 'Cette Année') return new Date(now.getFullYear(), 0, 1);
  const monthsBack = PERIOD_MONTHS[period] || 1;
  return new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
}

/** Nombre de mois à demander à l'API de tendance pour couvrir la même période. */
function periodMonthsCount(period) {
  const now = new Date();
  if (period === 'Ce Mois') return 1;
  if (period === 'Cette Année') return now.getMonth() + 1;
  return PERIOD_MONTHS[period] || 1;
}

/**
 * Prêts démarrés depuis le début de la période sélectionnée.
 * Source unique pour tout ce qui, sur cette page, doit réagir au sélecteur de
 * période : cartes principales, cartes « Mes PME » et échéancier.
 */
const periodFilteredLoans = computed(() => {
  const start = periodStartDate(selectedPeriod.value);
  return loans.value.filter((l) => {
    if (!l.startDate) return false;
    const d = new Date(l.startDate);
    return !Number.isNaN(d.getTime()) && d >= start;
  });
});

/** KPI recalculés sur le sous-ensemble de prêts de la période sélectionnée. */
const stats = computed(() => computeStats(periodFilteredLoans.value));

/* ─────────────── Cartes « Mes PME » ─────────────── */
const pmeCards = computed(() => [
  {
    key: 'financed',
    label: 'Financées',
    amount: stats.value.totalLoans,
    icon: iconFinanced,
    hintValue: stats.value.totalDisbursed,
    hintText: null,
    status: 'Actif',
  },
  {
    key: 'paidOff',
    label: 'Remboursées',
    amount: stats.value.paidOff,
    icon: iconPaidOff,
    hintValue: stats.value.totalRepaid,
    hintText: null,
    status: 'Actif',
  },
  {
    key: 'active',
    label: 'En cours de remboursement',
    amount: stats.value.active,
    icon: iconActive,
    hintValue: stats.value.totalRemaining,
    hintText: null,
    status: 'Actif',
  },
  {
    key: 'late',
    label: 'En retard',
    amount: stats.value.late,
    icon: iconLate,
    hintValue: null,
    hintText: `${stats.value.late} dossier(s)`,
    status: stats.value.late > 0 ? 'Retard' : 'Actif',
  },
]);

/* ─────────────── Graphique ─────────────── */
/** Le sélecteur de période en haut de page pilote directement la fenêtre du graphique. */
const chartMonths = computed(() => periodMonthsCount(selectedPeriod.value));

/** Tendance agrégée renvoyée par le serveur (null tant qu'elle n'est pas chargée). */
const trend = ref(null);
const isLoadingChart = ref(true);

/**
 * Points du graphique.
 * Source principale : l'agrégat serveur, qui inclut aussi les montants collectés.
 * Repli : calcul local des décaissements à partir des dates de début de prêt,
 * pour que le graphique reste alimenté si l'endpoint est indisponible.
 */
const chartData = computed(() => {
  const points = trend.value?.points;
  if (points?.length) {
    return points.map((p) => ({
      month: formatPeriod(p.period),
      disbursed: p.disbursedAmount || 0,
      collected: p.collectedAmount || 0,
      count: p.newLoansCount || 0,
    }));
  }
  return disbursementsByMonth(loans.value, chartMonths.value).map((b) => ({
    month: b.month,
    disbursed: b.disbursed,
    collected: null,
    count: b.count,
  }));
});

const chartCurrency = computed(() => trend.value?.currency || 'XOF');
const hasCollected = computed(() => chartData.value.some((d) => d.collected !== null));

const chartMax = computed(() =>
  Math.max(1, ...chartData.value.flatMap((d) => [d.disbursed, d.collected || 0]))
);
const chartTotal = computed(() => chartData.value.reduce((sum, d) => sum + d.disbursed, 0));
const collectedTotal = computed(() => chartData.value.reduce((sum, d) => sum + (d.collected || 0), 0));

function barHeight(value) {
  return `${Math.max(value > 0 ? 4 : 0, (value / chartMax.value) * 100)}%`;
}

async function loadTrend() {
  isLoadingChart.value = true;
  try {
    trend.value = await getBankActivityTrend(chartMonths.value);
  } catch (error) {
    // Repli sur le calcul local : le graphique reste utilisable.
    console.warn('Tendance établissement indisponible :', error);
    trend.value = null;
  } finally {
    isLoadingChart.value = false;
  }
}

watch(selectedPeriod, loadTrend);

/* ─────────────── Échéancier ─────────────── */
const schedule = computed(() => upcomingSchedule(periodFilteredLoans.value));

const filteredPayments = computed(() => {
  if (paymentFilter.value === 'late') return schedule.value.filter((l) => l.displayStatus === 'LATE');
  if (paymentFilter.value === 'ongoing') return schedule.value.filter((l) => l.displayStatus === 'ACTIVE');
  return schedule.value;
});

/** Le tableau du tableau de bord n'affiche que les 5 premières lignes. */
const visiblePayments = computed(() => filteredPayments.value.slice(0, 5));

/* ─────────────── Chargement ─────────────── */
async function loadData() {
  isLoading.value = true;
  isLoadingTable.value = true;
  errorMessage.value = '';

  try {
    const portfolio = await fetchPortfolio();
    loans.value = portfolio.loans;
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isLoading.value = false;
    isLoadingTable.value = false;
  }

  // Chargements secondaires : un échec ne doit pas vider le tableau de bord.
  loadTrend();

  try {
    profile.value = await getProfile();
  } catch (error) {
    console.warn('Profil indisponible :', error);
  }
}

const selectPeriod = (period) => {
  selectedPeriod.value = period;
  showPeriodMenu.value = false;
};

const changeFilter = (filter) => {
  paymentFilter.value = filter;
};

const toggleActionMenu = (loanId) => {
  activeActionMenu.value = activeActionMenu.value === loanId ? null : loanId;
};

const goToClient = (loan) => {
  activeActionMenu.value = null;
  router.push(`/detailpme/${loan.organizationId}`);
};

/** Formulation naturelle de la période, réutilisée dans les sous-titres de la page. */
const periodCaption = computed(() => {
  const labels = {
    'Ce Mois': 'ce mois-ci',
    '3 Derniers Mois': 'sur les 3 derniers mois',
    '6 Derniers Mois': 'sur les 6 derniers mois',
    'Cette Année': 'depuis le 1er janvier',
  };
  return labels[selectedPeriod.value] || '';
});

const closeMenus = () => {
  activeActionMenu.value = null;
  showPeriodMenu.value = false;
};

onMounted(() => {
  loadData();
  document.addEventListener('click', closeMenus);
});
</script>

<template>
  <div class="dashboard-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">
            Bonjour<span v-if="profile?.name">, {{ profile.name }}</span>
          </h1>
          <p class="text-gray-500 mt-1">
            Observez toutes les données de votre microfinance
            <span class="text-gray-400">({{ periodCaption }})</span>.
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <div class="relative">
            <button
              @click.stop="showPeriodMenu = !showPeriodMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span class="text-sm font-medium text-gray-700">{{ selectedPeriod }}</span>
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                v-if="showPeriodMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-10"
                @click.stop
              >
                <button
                  v-for="period in periods"
                  :key="period"
                  @click="selectPeriod(period)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600': selectedPeriod === period }"
                >
                  {{ period }}
                </button>
              </div>
            </transition>
          </div>

          <button
            @click="loadData"
            :disabled="isLoading"
            class="flex items-center space-x-2 px-4 py-2 text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-60"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span class="text-sm font-medium">Actualiser</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start">
      <svg class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p class="font-medium">Impossible de charger le portefeuille</p>
        <p class="mt-0.5">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Cartes principales -->
    <div v-if="isLoading">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SkeletonLoader type="stat" v-for="i in 3" :key="i" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Financement total -->
      <div class="card bg-gradient-to-br from-primary-500 to-primary-600 text-white card-hover animate-slide-in-up">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center backdrop-blur-sm">
              <img :src="imgwallet" alt="" />
            </div>
            <div>
              <p class="text-white/80 text-sm">Financement Total</p>
              <p class="text-xs text-white/60">Montant décaissé sur {{ stats.totalLoans }} prêt(s)</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact tag="h2" class="text-3xl xl:text-4xl font-bold break-words" :value="stats.totalDisbursed" />
            <span class="flex items-center space-x-1 text-white/90 bg-black px-2 py-1 rounded-full text-xs font-medium mb-1">
              <span>{{ stats.uniqueClients }} PME</span>
            </span>
          </div>
        </div>

        <router-link to="/detailpme" class="flex items-center space-x-2 text-white hover:underline">
          <span class="text-sm font-medium">Voir les détails</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>

      <!-- Montant remboursé -->
      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <img :src="imgfinanc" alt="" />
            </div>
            <div>
              <p class="text-gray-600 text-sm">Montant Remboursé</p>
              <p class="text-xs text-gray-400">Capital récupéré</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact tag="h2" class="text-2xl xl:text-3xl font-bold text-gray-900 break-words" :value="stats.totalRepaid" />
            <span class="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{{ stats.recoveryRate }}%</span>
            </span>
          </div>
        </div>

        <router-link to="/wallet" class="flex items-center space-x-2 text-primary-600 hover:underline">
          <span class="text-sm font-medium">Voir le résumé</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>

      <!-- Encours -->
      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <img :src="Encours" alt="" />
            </div>
            <div>
              <p class="text-gray-600 text-sm">Encours</p>
              <p class="text-xs text-gray-400">Restant dû — prêts {{ periodCaption }}</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact tag="h2" class="text-2xl xl:text-3xl font-bold text-gray-900 break-words" :value="stats.totalRemaining" />
            <span
              v-if="stats.late > 0"
              class="flex items-center space-x-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium mb-1"
            >
              <span>{{ stats.late }} en retard</span>
            </span>
          </div>
        </div>

        <router-link to="/gestionpme" class="flex items-center space-x-2 text-primary-600 hover:underline">
          <span class="text-sm font-medium">Analyser le portefeuille</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Mes PME + Graphique -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="card animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Mes PME</h3>
            <p class="text-sm text-gray-500">Prêts démarrés {{ periodCaption }}</p>
          </div>
          <router-link
            to="/gestionpme"
            class="flex items-center space-x-2 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm font-medium">Voir Plus</span>
          </router-link>
        </div>

        <div v-if="isLoading">
          <SkeletonLoader type="list" :rows="4" />
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="card in pmeCards"
            :key="card.key"
            class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-black flex-shrink-0">
                  <img :src="card.icon" :alt="card.label" />
                </div>
                <span class="font-medium text-gray-900 text-sm">{{ card.label }}</span>
              </div>
            </div>

            <div class="mb-2">
              <p class="text-2xl font-bold text-gray-900">{{ card.amount }}</p>
            </div>

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-gray-500 truncate">
                <AmountCompact v-if="card.hintValue !== null" :value="card.hintValue" />
                <template v-else>{{ card.hintText }}</template>
              </p>
              <span
                :class="[
                  'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap',
                  card.status === 'Actif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                ]"
              >
                {{ card.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphique décaissements -->
      <div class="card animate-slide-in-up animate-delay-400">
        <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Activité du portefeuille</h3>
            <p class="text-sm text-gray-500">Décaissements et encaissements {{ periodCaption }}</p>
          </div>
        </div>

        <div v-if="isLoading || isLoadingChart">
          <SkeletonLoader type="chart" />
        </div>

        <div v-else>
          <div class="mb-4 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p class="text-xs text-gray-500 mb-0.5">Décaissé sur la période</p>
              <AmountCompact
                tag="p"
                class="text-2xl xl:text-3xl font-bold text-gray-900 break-words"
                :value="chartTotal"
                :currency="chartCurrency"
              />
            </div>

            <div v-if="hasCollected" class="flex items-center gap-4 text-xs text-gray-600">
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Décaissé
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                Encaissé <AmountCompact :value="collectedTotal" :currency="chartCurrency" />
              </span>
            </div>
          </div>

          <div v-if="chartMax <= 1" class="h-64 flex flex-col items-center justify-center text-center">
            <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p class="text-sm text-gray-500">Aucune activité sur la période</p>
          </div>

          <div v-else class="h-64 flex items-end justify-between space-x-2">
            <div v-for="(data, index) in chartData" :key="index" class="flex-1 flex flex-col items-center group">
              <div class="w-full relative">
                <div
                  class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10"
                >
                  <div class="font-medium">{{ data.month }}</div>
                  <div class="text-primary-400">Décaissé : {{ formatCurrency(data.disbursed, chartCurrency) }}</div>
                  <div v-if="data.collected !== null" class="text-blue-300">
                    Encaissé : {{ formatCurrency(data.collected, chartCurrency) }}
                  </div>
                  <div class="text-gray-300">{{ data.count }} nouveau(x) prêt(s)</div>
                  <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div class="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                <div class="relative h-48 flex items-end gap-1">
                  <div
                    class="flex-1 rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-500"
                    :style="{ height: barHeight(data.disbursed) }"
                  ></div>
                  <div
                    v-if="data.collected !== null"
                    class="flex-1 rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                    :style="{ height: barHeight(data.collected) }"
                  ></div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ data.month }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Échéancier -->
    <div class="card animate-slide-in-up animate-delay-500">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Échéancier des Remboursements</h3>
            <p class="text-sm text-gray-500 mt-1">
              Prochains paiements attendus — prêts démarrés {{ periodCaption }}
            </p>
          </div>

          <div class="flex items-center space-x-2 flex-wrap gap-2">
            <button
              v-for="opt in [
                { key: 'all', label: 'Tous', active: 'bg-primary-600 text-white' },
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

            <router-link
              to="/gestionpme"
              class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
              <span class="text-sm font-medium">Voir Plus</span>
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="isLoadingTable">
        <SkeletonLoader type="table" :rows="5" />
      </div>

      <div v-else-if="visiblePayments.length === 0" class="text-center py-12">
        <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 class="text-base font-medium text-gray-900 mb-1">Aucune échéance à afficher</h3>
        <p class="text-sm text-gray-500">Les prêts décaissés apparaîtront ici avec leurs prochaines échéances.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">PME</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant Prêté</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Restant Dû</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Échéance</th>
              <th
                class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-help"
                title="Part du capital emprunté déjà remboursée (capital remboursé ÷ capital prêté)"
              >
                Progression <span class="normal-case font-normal text-gray-400">ⓘ</span>
              </th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jours Restants</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="loan in visiblePayments" :key="loan.loanId" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  >
                    {{ loan.organizationName.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ loan.organizationName }}</p>
                    <p class="text-xs text-gray-500">{{ formatSector(loan.sector) }}</p>
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
                  v-if="loan.daysRemaining !== null"
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
                      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      @click.stop
                    >
                      <button
                        @click="goToClient(loan)"
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
                    </div>
                  </transition>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-delay-100 {
  animation-delay: 100ms;
}
.animate-delay-200 {
  animation-delay: 200ms;
}
.animate-delay-300 {
  animation-delay: 300ms;
}
.animate-delay-400 {
  animation-delay: 400ms;
}
.animate-delay-500 {
  animation-delay: 500ms;
}
</style>