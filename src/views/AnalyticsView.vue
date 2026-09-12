<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import AmountCompact from '../components/common/AmountCompact.vue';
import { getBankActivityTrend } from '@/services/bankPortal';
import { fetchPortfolio } from '@/services/portfolio';
import { extractErrorMessage } from '@/services/http';
import { formatCurrency, formatPeriod, formatNumber } from '@/utils/format';

/* Icônes des blocs indicateurs — mêmes visuels que le tableau de bord */
import imgwallet from '../assets/img/Wallet.png';
import imgfinanc from '../assets/img/Coins.png';
import Encours from '../assets/img/Encours.png';
import Percentage from '../assets/img/Percentage.png';

const isLoading = ref(true);
const errorMessage = ref('');

const trend = ref(null);
const stats = ref(null);
const months = ref(6);

const periodOptions = [
  { value: 3, label: '3 mois' },
  { value: 6, label: '6 mois' },
  { value: 12, label: '12 mois' },
  { value: 24, label: '24 mois' },
];

const points = computed(() => trend.value?.points || []);
const currency = computed(() => trend.value?.currency || 'XOF');

const totals = computed(() => {
  const disbursed = points.value.reduce((s, p) => s + (p.disbursedAmount || 0), 0);
  const collected = points.value.reduce((s, p) => s + (p.collectedAmount || 0), 0);
  const newLoans = points.value.reduce((s, p) => s + (p.newLoansCount || 0), 0);

  return {
    disbursed,
    collected,
    newLoans,
    /** Part du décaissé déjà réencaissée sur la période observée. */
    collectionRatio: disbursed > 0 ? Math.round((collected / disbursed) * 100) : 0,
    avgTicket: newLoans > 0 ? disbursed / newLoans : 0,
  };
});

const chartMax = computed(() =>
  Math.max(1, ...points.value.flatMap((p) => [p.disbursedAmount || 0, p.collectedAmount || 0]))
);

/**
 * Position de l'infobulle et de sa flèche pour chaque colonne.
 *
 * Le conteneur du graphique défile horizontalement, il rogne donc son contenu :
 * une infobulle centrée dépasserait sur les colonnes de bord et serait coupée.
 * On la cale sur le bord concerné pour les première et dernière colonnes.
 */
const tooltipPositions = computed(() => {
  const last = points.value.length - 1;
  return points.value.map((_, index) => {
    if (index === 0) return { box: 'left-0', arrow: 'left-4' };
    if (index === last) return { box: 'right-0', arrow: 'right-4' };
    return { box: 'left-1/2 -translate-x-1/2', arrow: 'left-1/2 -translate-x-1/2' };
  });
});

function barHeight(value) {
  return `${Math.max(value > 0 ? 3 : 0, ((value || 0) / chartMax.value) * 100)}%`;
}

/** Mois le plus actif en décaissement, utile pour repérer la saisonnalité. */
const peakMonth = computed(() => {
  if (!points.value.length) return null;
  return points.value.reduce((best, p) =>
    (p.disbursedAmount || 0) > (best.disbursedAmount || 0) ? p : best
  );
});

async function loadTrend() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    trend.value = await getBankActivityTrend(months.value);
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
    trend.value = null;
  } finally {
    isLoading.value = false;
  }
}

async function loadPortfolio() {
  try {
    const portfolio = await fetchPortfolio();
    stats.value = portfolio.stats;
  } catch (error) {
    console.warn('Portefeuille indisponible :', error);
  }
}

watch(months, loadTrend);

onMounted(() => {
  loadTrend();
  loadPortfolio();
});
</script>

<template>
  <div class="analytics-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
          <p class="text-gray-500 mt-1">Évolution de votre portefeuille dans le temps</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-2">
          <button
            v-for="opt in periodOptions"
            :key="opt.value"
            @click="months = opt.value"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              months === opt.value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      <p class="font-medium">Impossible de charger la tendance</p>
      <p class="mt-0.5">{{ errorMessage }}</p>
    </div>

    <!-- Indicateurs -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="imgwallet" alt="" />
          </div>
        </div>
        <p class="text-sm text-gray-500 mb-1">Décaissé sur la période</p>
        <AmountCompact tag="h3" class="text-2xl font-bold text-gray-900 break-words" :value="totals.disbursed" :currency="currency" />
        <p class="text-xs text-gray-400 mt-1">{{ formatNumber(totals.newLoans) }} nouveau(x) prêt(s)</p>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="imgfinanc" alt="" />
          </div>
        </div>
        <p class="text-sm text-gray-500 mb-1">Encaissé sur la période</p>
        <AmountCompact tag="h3" class="text-2xl font-bold text-gray-900 break-words" :value="totals.collected" :currency="currency" />
        <p class="text-xs text-gray-400 mt-1">{{ totals.collectionRatio }} % du décaissé</p>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="Encours" alt="" />
          </div>
        </div>
        <p class="text-sm text-gray-500 mb-1">Prêt moyen</p>
        <AmountCompact tag="h3" class="text-2xl font-bold text-gray-900 break-words" :value="totals.avgTicket" :currency="currency" />
        <p class="text-xs text-gray-400 mt-1">Ticket moyen décaissé</p>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <img :src="Percentage" alt="" />
          </div>
        </div>
        <p class="text-sm text-gray-500 mb-1">Taux de recouvrement</p>
        <h3 class="text-2xl font-bold text-gray-900">{{ stats ? stats.recoveryRate : '—' }}<span v-if="stats"> %</span></h3>
        <p class="text-xs text-gray-400 mt-1">Sur l'ensemble du portefeuille</p>
      </div>
    </div>

    <!-- Graphique -->
    <div class="card mb-8">
      <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Décaissements et encaissements</h3>
          <p class="text-sm text-gray-500 mt-0.5">Agrégé sur tout le portefeuille financé</p>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-600">
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Décaissé
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Encaissé
          </span>
        </div>
      </div>

      <div v-if="isLoading">
        <SkeletonLoader type="chart" />
      </div>

      <div v-else-if="points.length === 0" class="h-64 flex flex-col items-center justify-center text-center">
        <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p class="text-sm text-gray-500">Aucune donnée sur la période</p>
      </div>

      <div v-else class="flex items-end justify-between gap-2 overflow-x-auto pt-24 pb-1">
        <div v-for="(point, index) in points" :key="point.period" class="flex-1 min-w-[36px] flex flex-col items-center group">
          <div class="w-full relative">
            <div
              class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10"
              :class="tooltipPositions[index].box"
            >
              <div class="font-medium">{{ formatPeriod(point.period) }}</div>
              <div class="text-primary-300">Décaissé : {{ formatCurrency(point.disbursedAmount, currency) }}</div>
              <div class="text-blue-300">Encaissé : {{ formatCurrency(point.collectedAmount, currency) }}</div>
              <div class="text-gray-300">{{ point.newLoansCount }} nouveau(x) prêt(s)</div>
              <div class="absolute bottom-0 translate-y-full" :class="tooltipPositions[index].arrow">
                <div class="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            <div class="relative h-56 flex items-end gap-1">
              <div
                class="flex-1 rounded-t bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300"
                :style="{ height: barHeight(point.disbursedAmount) }"
              ></div>
              <div
                class="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                :style="{ height: barHeight(point.collectedAmount) }"
              ></div>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2 whitespace-nowrap">{{ formatPeriod(point.period) }}</p>
        </div>
      </div>

      <p class="mt-5 text-xs text-gray-500">
        Les montants encaissés ne comptent que les remboursements collectés en ligne.
        Les paiements enregistrés manuellement n'y figurent pas.
      </p>
    </div>

    <!-- Détail mensuel -->
    <div v-if="!isLoading && points.length > 0" class="card">
      <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h3 class="text-lg font-bold text-gray-900">Détail par mois</h3>
        <p v-if="peakMonth" class="text-sm text-gray-500">
          Mois le plus actif : <span class="font-medium text-gray-900">{{ formatPeriod(peakMonth.period) }}</span>
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Période</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Décaissé</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Encaissé</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nouveaux prêts</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="point in [...points].reverse()" :key="point.period" class="hover:bg-gray-50 transition-colors">
              <td class="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {{ formatPeriod(point.period) }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                {{ formatCurrency(point.disbursedAmount, currency) }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                {{ formatCurrency(point.collectedAmount, currency) }}
              </td>
              <td class="py-3 px-4 text-sm text-gray-900 text-center">{{ point.newLoansCount }}</td>
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
</style>