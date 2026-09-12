<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import AmountCompact from '../components/common/AmountCompact.vue';
import { getWalletSummary, requestPayout, reconcileWalletTransactions, listPayouts } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import { formatCurrency, formatDateLong, formatDate, statusLabel } from '@/utils/format';
import StatusBadge from '../components/common/StatusBadge.vue';

/* Icônes des cartes principales */
import imgfinanc from '../assets/img/Wallet.png';
import imgvalide from '../assets/img/valide.png';
import Encours from '../assets/img/Encours.png';
import imgfinanc2 from '../assets/img/Coins.png';


const isLoading = ref(true);
const errorMessage = ref('');
const infoMessage = ref('');

const summary = ref(null);
const acting = ref(false);
const showPayoutConfirm = ref(false);
const lastPayout = ref(null);

const currency = computed(() => summary.value?.currency || 'XOF');
const availableForPayout = computed(() => summary.value?.availableForPayout || 0);

const contributions = computed(() => summary.value?.contributions || []);
const inProgress = computed(() => summary.value?.inProgressContributions || []);

const totalAvailable = computed(() => contributions.value.reduce((s, c) => s + (c.amountAvailable || 0), 0));
const totalCollecting = computed(() => inProgress.value.reduce((s, c) => s + (c.amountContributed || 0), 0));
const totalRemaining = computed(() => inProgress.value.reduce((s, c) => s + (c.amountRemaining || 0), 0));

/** Part déjà collectée sur les échéances en cours. */
const collectionRate = computed(() => {
  const target = totalCollecting.value + totalRemaining.value;
  return target > 0 ? Math.round((totalCollecting.value / target) * 100) : 0;
});

/* ─────────────── Historique des versements ─────────────── */
const payouts = ref([]);
const payoutsPage = ref(0);
const payoutsTotalPages = ref(1);
const payoutsTotal = ref(0);
const isLoadingPayouts = ref(true);
const PAYOUTS_PER_PAGE = 10;

async function loadPayouts(page = 0) {
  isLoadingPayouts.value = true;
  try {
    const result = await listPayouts({ page, size: PAYOUTS_PER_PAGE });
    payouts.value = result.content || [];
    payoutsPage.value = result.number ?? page;
    payoutsTotalPages.value = Math.max(1, result.totalPages ?? 1);
    payoutsTotal.value = result.totalElements ?? payouts.value.length;
  } catch (error) {
    console.warn('Historique des versements indisponible :', error);
    payouts.value = [];
  } finally {
    isLoadingPayouts.value = false;
  }
}

const payoutPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, payoutsPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(payoutsTotalPages.value - 1, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(0, end - maxVisible + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
});

async function load() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    summary.value = await getWalletSummary();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

async function handleRequestPayout() {
  acting.value = true;
  errorMessage.value = '';
  infoMessage.value = '';

  try {
    lastPayout.value = await requestPayout();
    showPayoutConfirm.value = false;
    infoMessage.value = `Demande de versement de ${formatCurrency(lastPayout.value.amount, currency.value)} enregistrée.`;
    await Promise.all([load(), loadPayouts(0)]);
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
    showPayoutConfirm.value = false;
  } finally {
    acting.value = false;
  }
}

async function handleReconcile() {
  acting.value = true;
  errorMessage.value = '';
  infoMessage.value = '';

  try {
    await reconcileWalletTransactions(3);
    infoMessage.value = 'Rapprochement des transactions lancé.';
    await Promise.all([load(), loadPayouts(payoutsPage.value)]);
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    acting.value = false;
  }
}

onMounted(() => {
  load();
  loadPayouts(0);
});
</script>

<template>
  <div class="wallet-container">


    <!-- Messages -->
    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {{ errorMessage }}
    </div>
    <div v-if="infoMessage" class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
      {{ infoMessage }}
    </div>

    <!-- Bandeau principal -->
    <div v-if="isLoading">
      <SkeletonLoader type="card" />
    </div>
    <div
      v-else
      class="bg-black from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6 relative overflow-hidden animate-slide-in-up"
    >


      <div class="relative z-10">
        <div class="flex items-center space-x-2 mb-2">
          <div class="w-20 h-20  from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
             <img :src="imgfinanc" alt="">
          </div>
          <div>
            <h3 class="text-white/60 text-xs font-medium mb-0.5">Montant Net à Verser</h3>
            <p class="text-white/40 text-xs">Disponible pour retrait immédiat</p>
          </div>
        </div>

        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight break-words">
          {{ formatCurrency(availableForPayout, currency) }}
        </h2>

        <div class="flex items-center gap-3 flex-wrap">
          <button
            @click="showPayoutConfirm = true"
            :disabled="availableForPayout <= 0 || acting"
            class="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold hover:scale-105 transform shadow-lg text-sm disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Effectuer un retrait</span>
          </button>

          <button
            @click="handleReconcile"
            :disabled="acting"
            class="flex items-center space-x-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium text-sm border border-white/20 disabled:opacity-50"
            title="Rapprocher les transactions Paystack en attente"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Rapprocher</span>
          </button>
        </div>

        <p v-if="lastPayout" class="mt-4 text-xs text-white/50">
          Dernier versement : {{ formatCurrency(lastPayout.amount, currency) }} —
          {{ lastPayout.status }} le {{ formatDate(lastPayout.requestedAt) }}
        </p>

        <p class="mt-2 text-xs text-white/40">
          Le compte de versement se configure dans
          <router-link to="/parametres" class="text-white/70 hover:text-white underline">Paramètres</router-link>.
        </p>
      </div>
    </div>

    <!-- Statistiques -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
      <SkeletonLoader type="stat" v-for="i in 3" :key="i" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Échéances complètes -->
      <div class="card bg-gradient-to-br from-primary-500 to-primary-600 text-white card-hover animate-slide-in-up">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center backdrop-blur-sm">
                <img :src="imgvalide" alt="">
            </div>
            <div>
              <p class="text-white/80 text-sm">Échéances complètes</p>
              <p class="text-xs text-white/60">Prêtes à être versées</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact tag="h2" class="text-3xl xl:text-4xl font-bold break-words" :value="totalAvailable" :currency="currency" />
            <span class="flex items-center space-x-1 text-white/90 bg-white/20 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <span>{{ contributions.length }} prêt(s)</span>
            </span>
          </div>
        </div>

        <router-link to="/gestionpme" class="flex items-center space-x-2 text-white hover:underline">
          <span class="text-sm font-medium">Voir le portefeuille</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>

      <!-- En cours de collecte -->
      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <img :src="imgfinanc2" alt="">
            </div>
            <div>
              <p class="text-gray-600 text-sm">En cours de collecte</p>
              <p class="text-xs text-gray-400">Versements partiels reçus</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact
              tag="h2"
              class="text-2xl xl:text-3xl font-bold text-gray-900 break-words"
              :value="totalCollecting"
              :currency="currency"
            />
            <span class="flex items-center space-x-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <span>{{ collectionRate }}%</span>
            </span>
          </div>
        </div>

        <router-link to="/dashboard" class="flex items-center space-x-2 text-primary-600 hover:underline">
          <span class="text-sm font-medium">Voir l'échéancier</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>

      <!-- Reste à collecter -->
      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <img :src="Encours" alt="">
            </div>
            <div>
              <p class="text-gray-600 text-sm">Reste à collecter</p>
              <p class="text-xs text-gray-400">Sur les échéances en cours</p>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end space-x-2 flex-wrap">
            <AmountCompact
              tag="h2"
              class="text-2xl xl:text-3xl font-bold text-gray-900 break-words"
              :value="totalRemaining"
              :currency="currency"
            />
            <span
              v-if="inProgress.length > 0"
              class="flex items-center space-x-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs font-medium mb-1"
            >
              <span>{{ inProgress.length }} prêt(s)</span>
            </span>
          </div>
        </div>

        <router-link to="/alertes" class="flex items-center space-x-2 text-primary-600 hover:underline">
          <span class="text-sm font-medium">Voir les alertes</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Historique des retraits -->
    <div class="card mt-8">
      <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Historique des Retraits</h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ payoutsTotal }} versement(s) enregistré(s)
          </p>
        </div>
      </div>

      <div v-if="isLoadingPayouts">
        <SkeletonLoader type="table" :rows="5" />
      </div>

      <div v-else-if="payouts.length === 0" class="text-center py-12">
        <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 class="text-base font-medium text-gray-900 mb-1">Aucun retrait effectué</h3>
        <p class="text-sm text-gray-500">Vos versements apparaîtront ici dès le premier retrait.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Demandé le</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Terminé le</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="payout in payouts" :key="payout.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4">
                <span class="text-sm font-medium text-gray-900 font-mono">{{ payout.id?.slice(0, 8) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {{ formatCurrency(payout.amount, payout.currency) }}
                </span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatDateLong(payout.requestedAt) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600 whitespace-nowrap">
                  {{ payout.completedAt ? formatDateLong(payout.completedAt) : '—' }}
                </span>
              </td>
              <td class="py-4 px-4">
                <StatusBadge :status="payout.status" />
                <p v-if="payout.failureReason" class="text-xs text-red-600 mt-1 max-w-xs">
                  {{ payout.failureReason }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="payoutsTotalPages > 1"
          class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200"
        >
          <div class="text-sm text-gray-500">
            Page <span class="font-medium text-gray-900">{{ payoutsPage + 1 }}</span> sur
            <span class="font-medium text-gray-900">{{ payoutsTotalPages }}</span>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="loadPayouts(payoutsPage - 1)"
              :disabled="payoutsPage === 0"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                payoutsPage === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              v-for="page in payoutPages"
              :key="page"
              @click="loadPayouts(page)"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                payoutsPage === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ page + 1 }}
            </button>

            <button
              @click="loadPayouts(payoutsPage + 1)"
              :disabled="payoutsPage >= payoutsTotalPages - 1"
              :class="[
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                payoutsPage >= payoutsTotalPages - 1
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

    <!-- Confirmation de retrait -->
    <Teleport to="body">
      <div v-if="showPayoutConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" @click="showPayoutConfirm = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[10000] text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 mb-4">
            <svg class="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Confirmer le retrait</h3>
          <p class="text-gray-600 mb-6 text-sm">
            {{ formatCurrency(availableForPayout, currency) }} seront versés sur le compte enregistré dans vos paramètres.
          </p>

          <div class="flex gap-3">
            <button
              @click="showPayoutConfirm = false"
              class="flex-1 px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              @click="handleRequestPayout"
              :disabled="acting"
              class="flex-1 px-5 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ acting ? 'Traitement…' : 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-delay-100 {
  animation-delay: 100ms;
}
.animate-delay-200 {
  animation-delay: 200ms;
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
  animation: shimmer 3s infinite;
}
</style>
