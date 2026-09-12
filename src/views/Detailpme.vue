<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import SkeletonLoader from '@/components/common/SkeletonLoader.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import AddPMEModal from '@/components/common/AddPMEModal.vue';
import { fetchPortfolio } from '@/services/portfolio';
import {
  getClientOverview,
  getLeadActivityTrend,
  getClientWalletHistory,
  getLeadProfile,
  registerManualRepayment,
  getEarlyPayoffQuote,
  executeEarlyPayoff,
} from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import {
  formatCurrency,
  formatDate,
  formatDateLong,
  formatPeriod,
  formatSector,
  scoreColorClass,
} from '@/utils/format';
import { generateTransactionReceipt } from '@/utils/receipt';
import logofacture from '../assets/img/logo-waretrack.png';
import AmountCompact from '@/components/common/AmountCompact.vue';

import iconWallet from '../assets/img/Wallet.png';
import imgfinanc from '../assets/img/Coins.png';
import imgvalide from '../assets/img/valide.png';
import Encours from '../assets/img/Encours.png';
import Profile from '../assets/img/Profile.png';





const props = defineProps({
  orgId: { type: String, default: '' },
});

const router = useRouter();

/* ─────────────── État ─────────────── */
const isLoadingStats = ref(true);
const isLoadingChart = ref(true);
const isLoadingCard = ref(true);
const isLoadingTransactions = ref(true);
const errorMessage = ref('');

const showPMEMenu = ref(false);
const showAddPMEModal = ref(false);
const chartView = ref('monthly');
const transactionFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(5);

const loans = ref([]);
const leads = ref([]);
const globalStats = ref({ totalLoans: 0, uniqueClients: 0, totalDisbursed: 0, totalRepaid: 0, totalRemaining: 0 });

const selectedOrgId = ref(props.orgId || null);
const overview = ref(null);
const leadProfile = ref(null);
const trend = ref(null);
const transactions = ref([]);

/* ─────────────── Sélecteur PME ─────────────── */
const pmeList = computed(() => {
  const seen = new Map();
  loans.value.forEach((l) => {
    if (!seen.has(l.organizationId)) {
      seen.set(l.organizationId, {
        organizationId: l.organizationId,
        name: l.organizationName,
        clientCode: l.clientCode,
      });
    }
  });
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const availablePMEs = computed(() => {
  const seen = new Map();
  loans.value.forEach((l) =>
    seen.set(l.organizationId, {
      organizationId: l.organizationId,
      organizationName: l.organizationName,
      clientCode: l.clientCode,
    })
  );
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

const selectedPMEName = computed(() => {
  if (!selectedOrgId.value) return 'Tous';
  return pmeList.value.find((p) => p.organizationId === selectedOrgId.value)?.name || 'PME';
});

/** Prêts de la PME sélectionnée, ou tout le portefeuille si « Tous ». */
const scopedLoans = computed(() =>
  selectedOrgId.value ? loans.value.filter((l) => l.organizationId === selectedOrgId.value) : loans.value
);

/** Prêt principal affiché (le plus récent non soldé, sinon le plus récent). */
const primaryLoan = computed(() => {
  const list = scopedLoans.value;
  if (!list.length) return null;
  const activeLoans = list.filter((l) => l.displayStatus !== 'PAID_OFF');
  const pool = activeLoans.length ? activeLoans : list;
  return [...pool].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
});

const stats = computed(() => {
  const list = scopedLoans.value;
  const disbursed = list.reduce((s, l) => s + (l.principalAmount || 0), 0);
  const remaining = list.reduce((s, l) => s + (l.remainingAmount || 0), 0);
  return {
    count: list.length,
    disbursed,
    repaid: disbursed - remaining,
    remaining,
    progress: disbursed > 0 ? Math.round(((disbursed - remaining) / disbursed) * 100) : 0,
  };
});

/* ─────────────── Graphique ─────────────── */
const chartPoints = computed(() => trend.value?.points || []);
const chartMax = computed(() => {
  if (!chartPoints.value.length) return 1;
  return Math.max(1, ...chartPoints.value.flatMap((p) => [p.revenue, p.expenses]));
});
const chartTotal = computed(() => chartPoints.value.reduce((s, p) => s + (p.revenue || 0), 0));

function barHeight(value) {
  return `${Math.max(value > 0 ? 3 : 0, (value / chartMax.value) * 100)}%`;
}

/* ─────────────── Transactions ─────────────── */
const filteredTransactions = computed(() => {
  if (transactionFilter.value === 'all') return transactions.value;
  const target = transactionFilter.value === 'success' ? 'SUCCESS' : 'FAILED';
  return transactions.value.filter((t) => (t.status || '').toUpperCase() === target);
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / itemsPerPage.value)));

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredTransactions.value.slice(start, start + itemsPerPage.value);
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
async function loadPortfolio() {
  isLoadingStats.value = true;
  errorMessage.value = '';

  try {
    const portfolio = await fetchPortfolio();
    loans.value = portfolio.loans;
    leads.value = portfolio.leads;
    globalStats.value = portfolio.stats;

    // Si aucune PME n'est sélectionnée mais qu'une seule existe, on l'ouvre directement.
    if (!selectedOrgId.value && pmeList.value.length === 1) {
      selectedOrgId.value = pmeList.value[0].organizationId;
    }
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isLoadingStats.value = false;
  }
}

async function loadClientDetail(orgId) {
  isLoadingChart.value = true;
  isLoadingCard.value = true;
  isLoadingTransactions.value = true;

  overview.value = null;
  leadProfile.value = null;
  trend.value = null;
  transactions.value = [];
  currentPage.value = 1;

  if (!orgId) {
    isLoadingChart.value = false;
    isLoadingCard.value = false;
    isLoadingTransactions.value = false;
    return;
  }

  const [ov, prof, act, hist] = await Promise.allSettled([
    getClientOverview(orgId),
    getLeadProfile(orgId),
    getLeadActivityTrend(orgId, chartView.value === 'monthly' ? 6 : 12),
    getClientWalletHistory(orgId),
  ]);

  if (ov.status === 'fulfilled') overview.value = ov.value;
  if (prof.status === 'fulfilled') leadProfile.value = prof.value;
  if (act.status === 'fulfilled') trend.value = act.value;
  if (hist.status === 'fulfilled') transactions.value = hist.value || [];

  isLoadingChart.value = false;
  isLoadingCard.value = false;
  isLoadingTransactions.value = false;
}

const selectPME = (orgId) => {
  selectedOrgId.value = orgId;
  showPMEMenu.value = false;
  router.replace(orgId ? `/detailpme/${orgId}` : '/detailpme');
};

// Source unique de chargement du detail : evite un double appel au montage.
watch(selectedOrgId, (id) => loadClientDetail(id), { immediate: true });

watch(chartView, async () => {
  if (!selectedOrgId.value) return;
  isLoadingChart.value = true;
  try {
    trend.value = await getLeadActivityTrend(selectedOrgId.value, chartView.value === 'monthly' ? 6 : 12);
  } catch {
    trend.value = null;
  } finally {
    isLoadingChart.value = false;
  }
});

const changeFilter = (filter) => {
  transactionFilter.value = filter;
  currentPage.value = 1;
};

/* ─────────────── Paiement manuel ─────────────── */
const showRepaymentModal = ref(false);
const repaymentForm = ref({ amount: '', paymentDate: new Date().toISOString().split('T')[0], reference: '' });
const submittingRepayment = ref(false);
const repaymentError = ref('');

async function submitRepayment() {
  if (!primaryLoan.value) return;
  submittingRepayment.value = true;
  repaymentError.value = '';

  try {
    await registerManualRepayment(selectedOrgId.value, primaryLoan.value.loanId, {
      amount: Number(repaymentForm.value.amount),
      paymentDate: repaymentForm.value.paymentDate,
      reference: repaymentForm.value.reference || undefined,
    });
    showRepaymentModal.value = false;
    repaymentForm.value = { amount: '', paymentDate: new Date().toISOString().split('T')[0], reference: '' };
    await loadPortfolio();
    await loadClientDetail(selectedOrgId.value);
  } catch (error) {
    repaymentError.value = extractErrorMessage(error);
  } finally {
    submittingRepayment.value = false;
  }
}

/* ─────────────── Solde anticipé ─────────────── */
const showPayoffModal = ref(false);
const payoffQuote = ref(null);
const customPenalty = ref(0);
const payoffReference = ref('');
const loadingQuote = ref(false);
const submittingPayoff = ref(false);
const payoffError = ref('');

async function openPayoffModal() {
  if (!primaryLoan.value) return;
  showPayoffModal.value = true;
  payoffError.value = '';
  loadingQuote.value = true;

  try {
    payoffQuote.value = await getEarlyPayoffQuote(primaryLoan.value.loanId, Number(customPenalty.value) || 0);
  } catch (error) {
    payoffError.value = extractErrorMessage(error);
  } finally {
    loadingQuote.value = false;
  }
}

async function refreshQuote() {
  if (!showPayoffModal.value || !primaryLoan.value) return;
  loadingQuote.value = true;
  try {
    payoffQuote.value = await getEarlyPayoffQuote(primaryLoan.value.loanId, Number(customPenalty.value) || 0);
  } catch {
    // On garde le devis précédent en cas d'échec.
  } finally {
    loadingQuote.value = false;
  }
}

async function submitPayoff() {
  if (!primaryLoan.value) return;
  submittingPayoff.value = true;
  payoffError.value = '';

  try {
    await executeEarlyPayoff(primaryLoan.value.loanId, {
      penaltyAmount: Number(customPenalty.value) || 0,
      paymentReference: payoffReference.value || undefined,
    });
    showPayoffModal.value = false;
    await loadPortfolio();
    await loadClientDetail(selectedOrgId.value);
  } catch (error) {
    payoffError.value = extractErrorMessage(error);
  } finally {
    submittingPayoff.value = false;
  }
}

/* ─────────────── Reçu PDF ─────────────── */
async function generateTransactionPDF(item) {
  const ok = await generateTransactionReceipt(item, {
    logoUrl: logofacture,
    organizationName: overview.value?.organizationName || selectedPMEName.value,
    clientCode: leadProfile.value?.clientCode || null,
    phone: primaryLoan.value?.organizationPhone || null,
  });

  if (!ok) {
    alert('Erreur lors de la génération du PDF');
  }
}

const closeMenus = () => {
  showPMEMenu.value = false;
};

onMounted(() => {
  loadPortfolio();
  document.addEventListener('click', closeMenus);
});
</script>

<template>
  <div class="transactions-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Détails de chaque PME</h1>
          <p class="text-gray-500 mt-1">Suivez vos PME financées et leurs remboursements</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <div class="relative">
            <button
              @click.stop="showPMEMenu = !showPMEMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span class="text-sm font-medium text-gray-700 max-w-[160px] truncate">{{ selectedPMEName }}</span>
              <svg class="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                v-if="showPMEMenu"
                class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-20 max-h-96 overflow-y-auto"
                @click.stop
              >
                <button
                  @click="selectPME(null)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600 font-medium': !selectedOrgId }"
                >
                  <span class="font-semibold">Tous</span>
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <p v-if="pmeList.length === 0" class="px-4 py-6 text-sm text-gray-500 text-center">
                  Aucune PME financée.
                </p>
                <button
                  v-for="pme in pmeList"
                  :key="pme.organizationId"
                  @click="selectPME(pme.organizationId)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors truncate"
                  :class="{ 'bg-primary-50 text-primary-600 font-medium': selectedOrgId === pme.organizationId }"
                >
                  {{ pme.name }}
                </button>
              </div>
            </transition>
          </div>

          <button
            @click="showAddPMEModal = true"
            class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm font-medium">Nouvelle PME</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Erreur -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      <p class="font-medium">Impossible de charger les données</p>
      <p class="mt-0.5">{{ errorMessage }}</p>
    </div>

    <!-- Statistiques -->
    <div v-if="isLoadingStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <img :src="iconWallet" alt="">
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Total prêts</p>
          <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ stats.count }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ selectedOrgId ? 'Pour cette PME' : 'Toutes PME' }}</p>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
             <img :src="imgfinanc" alt="">
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Montant Total Prêté</p>
          <AmountCompact tag="h3" class="text-xl md:text-2xl font-bold text-gray-900 break-words" :value="stats.disbursed" />
          <p class="text-xs text-gray-400 mt-1">Fonds déboursés</p>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
             <img :src="imgvalide" alt="">
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Montant Remboursé</p>
          <AmountCompact tag="h3" class="text-xl md:text-2xl font-bold text-gray-900 break-words" :value="stats.repaid" />
          <p class="text-xs text-gray-400 mt-1">{{ stats.progress }} % du capital</p>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <img :src="Encours" alt="">
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Reste à Rembourser</p>
          <AmountCompact tag="h3" class="text-xl md:text-2xl font-bold text-gray-900 break-words" :value="stats.remaining" />
          <p class="text-xs text-gray-400 mt-1">Montant en attente</p>
        </div>
      </div>
    </div>

    <!-- Invitation à sélectionner une PME -->
    <div v-if="!selectedOrgId && !isLoadingStats" class="card text-center py-14 mb-8">
      <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
      <h3 class="text-base font-medium text-gray-900 mb-1">Sélectionnez une PME</h3>
      <p class="text-sm text-gray-500">
        Choisissez une PME dans la liste pour consulter son activité, ses transactions et son dirigeant.
      </p>
    </div>

    <!-- Contenu détaillé -->
    <template v-if="selectedOrgId">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Graphique d'activité -->
        <div class="lg:col-span-2 card">
          <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h3 class="text-lg font-bold text-gray-900">Chiffre d'affaires</h3>
              <p class="text-sm text-gray-500 mt-0.5">Activité déclarée par la PME</p>
            </div>
            <div class="flex items-center space-x-2">
              <button
                @click="chartView = 'monthly'"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  chartView === 'monthly' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                ]"
              >
                6 mois
              </button>
              <button
                @click="chartView = 'yearly'"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  chartView === 'yearly' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                ]"
              >
                12 mois
              </button>
            </div>
          </div>

          <div v-if="isLoadingChart">
            <SkeletonLoader type="chart" />
          </div>

          <div v-else-if="chartPoints.length === 0" class="h-64 flex flex-col items-center justify-center text-center">
            <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p class="text-sm text-gray-500">Aucune donnée d'activité disponible</p>
          </div>

          <div v-else>
            <div class="mb-4">
              <div class="flex items-baseline space-x-3 flex-wrap">
                <AmountCompact tag="h2" class="text-2xl md:text-3xl font-bold text-gray-900 break-words" :value="chartTotal" :currency="trend?.currency || 'XOF'" />
                <div class="flex items-center gap-4 text-xs text-gray-600">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span> CA
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Dépenses
                  </span>
                </div>
              </div>
            </div>

            <div class="h-64 flex items-end justify-between gap-2">
              <div v-for="point in chartPoints" :key="point.period" class="flex-1 flex flex-col items-center group">
                <div class="w-full relative">
                  <div
                    class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10"
                  >
                    <div class="font-medium">{{ formatPeriod(point.period) }}</div>
                    <div class="text-primary-300">CA : {{ formatCurrency(point.revenue, trend?.currency) }}</div>
                    <div class="text-orange-300">Dép. : {{ formatCurrency(point.expenses, trend?.currency) }}</div>
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                      <div class="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>

                  <div class="relative h-48 flex items-end gap-1">
                    <div
                      class="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t transition-all duration-300"
                      :style="{ height: barHeight(point.revenue) }"
                    ></div>
                    <div
                      class="flex-1 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t transition-all duration-300"
                      :style="{ height: barHeight(point.expenses) }"
                    ></div>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">{{ formatPeriod(point.period) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fiche PME -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Fiche PME</h3>
          </div>

          <div v-if="isLoadingCard">
            <SkeletonLoader type="card" />
          </div>

          <div v-else>
            <div class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
              <div class="flex flex-col items-center text-center">
                <div
                  class="w-20 h-20 rounded-full bg-black from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4"
                >
                  
                  <img :src="Profile" alt="">
                </div>

                <h4 class="text-lg font-bold text-gray-900 mb-1 break-words">
                  {{ overview?.organizationName || selectedPMEName }}
                </h4>

                <div v-if="leadProfile?.sector" class="flex items-center space-x-2 mb-2">
                  <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span class="text-sm font-semibold text-primary-700">{{ formatSector(leadProfile.sector) }}</span>
                </div>

                <span
                  v-if="leadProfile?.clientCode"
                  class="text-xs font-mono text-primary-700 bg-white/70 border border-primary-200 rounded px-2 py-0.5"
                >
                  {{ leadProfile.clientCode }}
                </span>
              </div>
            </div>

            <div class="space-y-3 mb-4">
              <div v-if="primaryLoan?.organizationPhone" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg class="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-500 mb-1">Téléphone</p>
                  <p class="text-sm font-medium text-gray-900">{{ primaryLoan.organizationPhone }}</p>
                </div>
              </div>

              <div v-if="leadProfile" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg class="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-500 mb-1">Score de crédit</p>
                  <p class="text-sm font-medium" :class="scoreColorClass(leadProfile.totalScore, leadProfile.maxScore)">
                    {{ leadProfile.totalScore }} / {{ leadProfile.maxScore }}
                    <span class="text-gray-400 font-normal"> · {{ leadProfile.scoreLabelFr }}</span>
                  </p>
                </div>
              </div>

              <div v-if="overview" class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg class="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-500 mb-1">CA mensuel déclaré</p>
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatCurrency(overview.monthlyRevenue, overview.currency) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Progression -->
            <div class="pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-700">Progression du remboursement</span>
                <span class="text-sm font-bold text-primary-600">{{ stats.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all shadow-sm relative overflow-hidden"
                  :style="{ width: stats.progress + '%' }"
                >
                </div>
              </div>
              <div class="flex items-center justify-between mt-2 gap-2">
                <span class="text-xs text-gray-500"><AmountCompact :value="stats.repaid" /> remboursé</span>
                <span class="text-xs text-gray-500"><AmountCompact :value="stats.disbursed" /> total</span>
              </div>
            </div>

            <!-- Actions -->
            <div v-if="primaryLoan && primaryLoan.displayStatus !== 'PAID_OFF'" class="mt-5 space-y-2">
              <button
                @click="showRepaymentModal = true"
                class="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Enregistrer un paiement
              </button>
              <button
                @click="openPayoffModal"
                class="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Solder par anticipation
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Prêts en cours -->
      <div v-if="scopedLoans.length > 0" class="card mb-8">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Prêts de cette PME</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Restant dû</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Début</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Fin</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Prochaine échéance</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="loan in scopedLoans" :key="loan.loanId" class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {{ formatCurrency(loan.principalAmount) }}
                </td>
                <td class="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{{ formatCurrency(loan.remainingAmount) }}</td>
                <td class="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(loan.startDate) }}</td>
                <td class="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(loan.endDate) }}</td>
                <td class="py-4 px-4 text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(loan.nextPaymentDate) }}</td>
                <td class="py-4 px-4"><StatusBadge :status="loan.displayStatus" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transactions -->
      <div class="card">
        <div class="mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="mb-4 md:mb-0">
              <h3 class="text-lg font-bold text-gray-900">Transactions Récentes</h3>
              <p class="text-sm text-gray-500 mt-1">Remboursements encaissés via le wallet</p>
            </div>

            <div class="flex items-center space-x-2 flex-wrap gap-2">
              <span class="text-sm text-gray-600 mr-1">Statut :</span>
              <button
                v-for="opt in [
                  { key: 'all', label: 'Tous', active: 'bg-primary-600 text-white' },
                  { key: 'success', label: 'Confirmé', active: 'bg-green-600 text-white' },
                  { key: 'failed', label: 'Échoué', active: 'bg-red-600 text-white' }
                ]"
                :key="opt.key"
                @click="changeFilter(opt.key)"
                :class="[
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  transactionFilter === opt.key ? opt.active : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="isLoadingTransactions">
          <SkeletonLoader type="table" :rows="5" />
        </div>

        <div v-else-if="paginatedTransactions.length === 0" class="text-center py-14">
          <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
          <h3 class="text-base font-medium text-gray-900 mb-1">Aucune transaction</h3>
          <p class="text-sm text-gray-500">Les remboursements encaissés apparaîtront ici.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Affectation</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="tx in paginatedTransactions" :key="tx.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-4">
                  <span class="text-sm font-medium text-gray-900 font-mono">
                    {{ tx.paystackReference || tx.id?.slice(0, 12) }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(tx.createdAt) }}</span>
                </td>
                <td class="py-4 px-4">
                  <span class="text-sm font-semibold text-gray-900 whitespace-nowrap">{{ formatCurrency(tx.amount) }}</span>
                </td>
                <td class="py-4 px-4">
                  <span class="text-xs" :class="tx.appliedToLoan ? 'text-green-600' : 'text-gray-500'">
                    {{ tx.appliedToLoan ? 'Imputé au prêt' : 'En attente d\'imputation' }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <StatusBadge :status="(tx.status || '').toUpperCase()" />
                </td>
                <td class="py-4 px-4 text-center">
                  <button
                    class="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    @click="generateTransactionPDF(tx)"
                  >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Reçu
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
            <div class="text-sm text-gray-500">
              Page <span class="font-medium text-gray-900">{{ currentPage }}</span> sur
              <span class="font-medium text-gray-900">{{ totalPages }}</span>
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="currentPage > 1 && (currentPage -= 1)"
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
                @click="currentPage = page"
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
                @click="currentPage < totalPages && (currentPage += 1)"
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
    </template>

    <!-- Modale paiement manuel -->
    <Teleport to="body">
      <div v-if="showRepaymentModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" @click="showRepaymentModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[10000]">
          <h3 class="text-xl font-bold text-gray-900 mb-1">Enregistrer un paiement</h3>
          <p class="text-sm text-gray-500 mb-5">Paiement reçu hors plateforme (espèces, virement…).</p>

          <div v-if="repaymentError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {{ repaymentError }}
          </div>

          <form @submit.prevent="submitRepayment" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Montant (F CFA) *</label>
              <input
                v-model="repaymentForm.amount"
                type="number"
                required
                min="1"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date du paiement *</label>
              <input
                v-model="repaymentForm.paymentDate"
                type="date"
                required
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Référence</label>
              <input
                v-model="repaymentForm.reference"
                type="text"
                placeholder="Ex : REC-2026-014"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="showRepaymentModal = false"
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="submittingRepayment"
                class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {{ submittingRepayment ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modale solde anticipé -->
    <Teleport to="body">
      <div v-if="showPayoffModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" @click="showPayoffModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[10000]">
          <h3 class="text-xl font-bold text-gray-900 mb-1">Solde par anticipation</h3>
          <p class="text-sm text-gray-500 mb-5">Calcul du montant nécessaire pour clôturer le prêt aujourd'hui.</p>

          <div v-if="payoffError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {{ payoffError }}
          </div>

          <div v-if="loadingQuote" class="py-6">
            <SkeletonLoader type="card" />
          </div>

          <div v-else-if="payoffQuote" class="space-y-2 mb-5">
            <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-600">Capital restant</span>
              <span class="text-sm font-medium text-gray-900">{{ formatCurrency(payoffQuote.remainingPrincipal) }}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-600">Intérêts courus</span>
              <span class="text-sm font-medium text-gray-900">{{ formatCurrency(payoffQuote.accruedInterest) }}</span>
            </div>
            <div class="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-600">Pénalité</span>
              <span class="text-sm font-medium text-gray-900">{{ formatCurrency(payoffQuote.penaltyAmount) }}</span>
            </div>
            <div class="flex justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <span class="text-sm font-semibold text-primary-800">Total à payer</span>
              <span class="text-sm font-bold text-primary-800">{{ formatCurrency(payoffQuote.totalPayoffAmount) }}</span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pénalité personnalisée (F CFA)</label>
              <input
                v-model="customPenalty"
                @change="refreshQuote"
                type="number"
                min="0"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Référence de paiement</label>
              <input
                v-model="payoffReference"
                type="text"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-5">
            <button
              type="button"
              @click="showPayoffModal = false"
              class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              @click="submitPayoff"
              :disabled="submittingPayoff || !payoffQuote"
              class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ submittingPayoff ? 'Traitement…' : 'Confirmer le solde' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <AddPMEModal
      :show="showAddPMEModal"
      :available-p-m-es="availablePMEs"
      @close="showAddPMEModal = false"
      @pme-created="loadPortfolio"
    />
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

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
</style>
