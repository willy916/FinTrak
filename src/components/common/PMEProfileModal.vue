<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import {
  getLeadProfile,
  getLeadFinancials,
  getLeadPatrimony,
  getLeadTaxDeclarations,
  getLeadActivityTrend,
  getLeadFinancialStatements,
  getLeadPatrimonyProofUrl,
  getLeadAccounts,
  reviewApplication,
  disburseApplication,
  exportClientDossier,
} from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import StatusBadge from './StatusBadge.vue';
import { statusIcon, statusIconBg } from '@/utils/statusIcons';
import SkeletonLoader from './SkeletonLoader.vue';
import AmountCompact from './AmountCompact.vue';
import {
  formatCurrency,
  formatDate,
  formatPeriod,
  formatSector,
  formatKyc,
  statusLabel,
  statusBadgeClass,
  scoreColorClass,
} from '@/utils/format';



const props = defineProps({
  /** LoanApplicationResponse ou null quand la modale est fermée. */
  application: { type: Object, default: null },
});

const emit = defineEmits(['close', 'updated']);

const activeTab = ref('profil');
const tabs = [
  { key: 'profil', label: 'Profil & Score' },
  { key: 'finances', label: 'Finances' },
  { key: 'patrimoine', label: 'Patrimoine & Fiscalité' },
  { key: 'decision', label: 'Décision' },
];

/* ─────────────── Données du dossier ─────────────── */
const isLoading = ref(false);
const loadError = ref('');

const leadProfile = ref(null);
const financials = ref(null);
const statements = ref(null);
const patrimony = ref(null);
const taxDeclarations = ref([]);
const trend = ref(null);
const accounts = ref([]);
const accountsError = ref('');

/* ── Photos justificatives : chargées à la demande, pas toutes au montage ── */
const proofCache = new Map();
const loadingProofId = ref(null);
const lightbox = ref(null);

/** Construit la liste des preuves disponibles à partir du patrimoine. */
const proofRefs = computed(() => {
  const data = patrimony.value;
  if (!data) return [];
  const refs = [];

  data.stock?.history?.forEach((s) => {
    if (s.proofFileId) refs.push({ fileId: s.proofFileId, label: `Stock — ${formatDate(s.createdAt)}` });
  });
  data.assets?.items?.forEach((a) => {
    if (a.proofFileId) refs.push({ fileId: a.proofFileId, label: `Équipement — ${a.designation}` });
    if (a.lastPhotoAuditFileId)
      refs.push({ fileId: a.lastPhotoAuditFileId, label: `${a.designation} (ré-attestation)` });
  });
  data.equity?.movements?.forEach((m) => {
    if (m.proofFileId) refs.push({ fileId: m.proofFileId, label: `Capital — ${m.movementType}` });
  });

  return refs;
});

async function openProof(proof) {
  const cached = proofCache.get(proof.fileId);
  if (cached) {
    lightbox.value = { url: cached, label: proof.label };
    return;
  }

  loadingProofId.value = proof.fileId;
  try {
    const url = await getLeadPatrimonyProofUrl(orgId.value, proof.fileId);
    proofCache.set(proof.fileId, url);
    lightbox.value = { url, label: proof.label };
  } catch (error) {
    actionError.value = extractErrorMessage(error);
  } finally {
    loadingProofId.value = null;
  }
}

/** Libère les object-URL créés pour les preuves. */
function revokeProofs() {
  proofCache.forEach((url) => URL.revokeObjectURL(url));
  proofCache.clear();
}

onUnmounted(revokeProofs);

/* ─────────────── Actions ─────────────── */
const acting = ref(false);
const actionError = ref('');
const actionSuccess = ref('');
const reviewNote = ref('');
const confirmReject = ref(false);

const disburseForm = ref({
  disbursementAccountId: '',
  interestRate: '',
  applicationFee: '',
  monthlyInsuranceFee: '',
  taxRate: '',
  customMonthlyPayment: '',
  totalCost: '',
  startDate: new Date().toISOString().split('T')[0],
  type: 'BANK_LOAN',
  paymentFrequency: 'MONTHLY',
  autoRepayment: false,
  repaymentAccountId: '',
  loanNumber: '',
});

const current = computed(() => props.application);
const orgId = computed(() => current.value?.organizationId ?? null);

const isPending = computed(() => ['PENDING', 'UNDER_REVIEW'].includes(current.value?.status));
const isApproved = computed(() => current.value?.status === 'APPROVED');
const isClosed = computed(() => ['REJECTED', 'DISBURSED', 'CANCELLED'].includes(current.value?.status));

const scoreRatio = computed(() => {
  if (!leadProfile.value?.maxScore) return 0;
  return Math.min(100, Math.round((leadProfile.value.totalScore / leadProfile.value.maxScore) * 100));
});

/** Sous-scores exposés par le backend — masqués individuellement s'ils sont absents. */
const subScores = computed(() => {
  const p = leadProfile.value;
  if (!p) return [];
  return [
    { label: 'Régularité', value: p.scoreRegularite },
    { label: 'Volume', value: p.scoreVolume },
    { label: 'Conformité', value: p.scoreConformite },
    { label: 'Ancienneté', value: p.scoreAnciennete },
    { label: 'KYC', value: p.scoreKyc },
    { label: 'Ratio', value: p.scoreRatio },
  ].filter((s) => s.value !== undefined && s.value !== null);
});

const trendMax = computed(() => {
  if (!trend.value?.points?.length) return 1;
  return Math.max(1, ...trend.value.points.flatMap((p) => [p.revenue, p.expenses]));
});

/** Ratio d'endettement indicatif : mensualité estimée / CA mensuel. */
const debtRatio = computed(() => {
  const app = current.value;
  const monthlyRevenue = financials.value?.monthlyRevenue;
  if (!app?.requestedAmount || !app?.requestedDurationMonths || !monthlyRevenue) return null;
  const estimatedMonthly = app.requestedAmount / app.requestedDurationMonths;
  return Math.round((estimatedMonthly / monthlyRevenue) * 100);
});

const accountOptions = computed(() =>
  accounts.value.map((a) => ({
    id: a.id,
    label: [a.label, a.accountNumber, a.channel].filter(Boolean).join(' — '),
    balance: a.currentBalance,
  }))
);

/* ─────────────── Chargement ─────────────── */
async function loadDossier(id) {
  if (!id) return;

  isLoading.value = true;
  loadError.value = '';
  leadProfile.value = null;
  financials.value = null;
  statements.value = null;
  patrimony.value = null;
  taxDeclarations.value = [];
  trend.value = null;
  lightbox.value = null;
  revokeProofs();

  // Le profil est le socle du dossier : son échec est bloquant.
  try {
    leadProfile.value = await getLeadProfile(id);
  } catch (error) {
    loadError.value = extractErrorMessage(error);
  }

  // Le reste est complémentaire : chaque bloc dégrade indépendamment.
  const [fin, pat, tax, act, stm] = await Promise.allSettled([
    getLeadFinancials(id),
    getLeadPatrimony(id),
    getLeadTaxDeclarations(id),
    getLeadActivityTrend(id, 6),
    getLeadFinancialStatements(id),
  ]);

  if (fin.status === 'fulfilled') financials.value = fin.value;
  if (pat.status === 'fulfilled') patrimony.value = pat.value;
  if (tax.status === 'fulfilled') taxDeclarations.value = tax.value || [];
  if (act.status === 'fulfilled') trend.value = act.value;
  if (stm.status === 'fulfilled') statements.value = stm.value;

  isLoading.value = false;
}

async function loadAccounts(id) {
  accountsError.value = '';
  try {
    accounts.value = await getLeadAccounts(id);
    const preferred = accounts.value.find((a) => a.isDefault) ?? accounts.value[0];
    if (preferred) disburseForm.value.disbursementAccountId = preferred.id;
  } catch (error) {
    accountsError.value = extractErrorMessage(error);
  }
}

watch(
  () => props.application,
  (app) => {
    activeTab.value = 'profil';
    reviewNote.value = '';
    actionError.value = '';
    actionSuccess.value = '';
    confirmReject.value = false;
    accounts.value = [];

    if (app?.organizationId) {
      loadDossier(app.organizationId);
      if (app.status === 'APPROVED') loadAccounts(app.organizationId);
    }
  },
  { immediate: true }
);

/* ─────────────── Instruction ─────────────── */
async function handleReview(decision) {
  if (decision === 'REJECTED' && !confirmReject.value) {
    confirmReject.value = true;
    return;
  }

  acting.value = true;
  actionError.value = '';
  actionSuccess.value = '';

  try {
    const updated = await reviewApplication(current.value.id, {
      decision,
      note: reviewNote.value.trim() || undefined,
    });

    actionSuccess.value = `Demande ${statusLabel(updated.status).toLowerCase()}.`;
    confirmReject.value = false;
    emit('updated', updated);

    if (updated.status === 'APPROVED') {
      await loadAccounts(updated.organizationId);
    }
  } catch (error) {
    actionError.value = extractErrorMessage(error);
  } finally {
    acting.value = false;
  }
}

async function handleDisburse() {
  acting.value = true;
  actionError.value = '';
  actionSuccess.value = '';

  try {
    const f = disburseForm.value;
    const payload = {
      disbursementAccountId: f.disbursementAccountId,
      interestRate: Number(f.interestRate) || 0,
      applicationFee: f.applicationFee !== '' ? Number(f.applicationFee) : undefined,
      monthlyInsuranceFee: f.monthlyInsuranceFee !== '' ? Number(f.monthlyInsuranceFee) : undefined,
      taxRate: f.taxRate !== '' ? Number(f.taxRate) : undefined,
      customMonthlyPayment: f.customMonthlyPayment !== '' ? Number(f.customMonthlyPayment) : undefined,
      // Laissé vide, le serveur l'estime depuis l'échéancier.
      totalCost: f.totalCost !== '' ? Number(f.totalCost) : undefined,
      startDate: f.startDate || undefined,
      type: f.type,
      paymentFrequency: f.paymentFrequency,
      autoRepayment: f.autoRepayment,
      repaymentAccountId: f.autoRepayment ? f.repaymentAccountId || undefined : undefined,
      loanNumber: f.loanNumber || undefined,
    };

    const updated = await disburseApplication(current.value.id, payload);
    actionSuccess.value = 'Prêt décaissé. Il apparaît désormais dans votre portefeuille.';
    emit('updated', updated);
  } catch (error) {
    actionError.value = extractErrorMessage(error);
  } finally {
    acting.value = false;
  }
}

const exporting = ref(false);

async function handleExport() {
  if (!orgId.value) return;
  exporting.value = true;
  actionError.value = '';

  try {
    // Le service détermine lui-même le nom et l'extension à partir de la
    // réponse : le serveur renvoie une archive ZIP, pas un PDF.
    const { blob, filename } = await exportClientDossier(orgId.value, current.value.organizationName);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Laisse au navigateur le temps de démarrer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    actionError.value = extractErrorMessage(error);
  } finally {
    exporting.value = false;
  }
}

function barHeight(value) {
  return `${Math.max(value > 0 ? 3 : 0, (value / trendMax.value) * 100)}%`;
}
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="current"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        @click="$emit('close')"
      >
        <div class="bg-white rounded-xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl" @click.stop>
          <!-- En-tête -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div class="flex items-start justify-between mb-4 gap-4">
              <div class="flex items-center space-x-3 min-w-0">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="statusIconBg(current.status)"
                >
                  <img :src="statusIcon(current.status)" :alt="statusLabel(current.status)" />
                </div>
                <div class="min-w-0">
                  <h2 class="text-xl font-bold text-gray-900 truncate">{{ current.organizationName }}</h2>
                  <p class="text-sm text-gray-500 truncate">
                    {{ current.bankProductTitle }}
                    <span v-if="leadProfile?.sector"> · {{ formatSector(leadProfile.sector) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <StatusBadge :status="current.status" />
                <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Chiffres clés de la demande -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-0.5">Montant demandé</p>
                <p class="text-sm font-bold text-gray-900">{{ formatCurrency(current.requestedAmount) }}</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-0.5">Durée</p>
                <p class="text-sm font-bold text-gray-900">{{ current.requestedDurationMonths }} mois</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-0.5">Score crédit</p>
                <p v-if="leadProfile" class="text-sm font-bold" :class="scoreColorClass(leadProfile.totalScore, leadProfile.maxScore)">
                  {{ leadProfile.totalScore }} / {{ leadProfile.maxScore }}
                </p>
                <p v-else class="text-sm font-bold text-gray-400">—</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-0.5">Soumise le</p>
                <p class="text-sm font-bold text-gray-900">{{ formatDate(current.createdAt) }}</p>
              </div>
            </div>

            <!-- Onglets -->
            <div class="flex items-center gap-1 mt-4 overflow-x-auto">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                  activeTab === tab.key ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                ]"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Corps -->
          <div class="p-6">
            <div v-if="loadError" class="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
              Profil du marchand indisponible : {{ loadError }}
            </div>

            <!-- ── Onglet Profil ── -->
            <div v-show="activeTab === 'profil'">
              <div v-if="isLoading">
                <SkeletonLoader type="card" />
              </div>

              <template v-else>
                <!-- Recommandation IA -->
                <div v-if="current.aiRecommendation" class="mb-6 rounded-lg bg-primary-50 border border-primary-100 p-4">
                  <div class="flex items-start gap-3">

                    <div class="min-w-0">
                      <h3 class="text-sm font-semibold text-primary-900">Pré-évaluation automatique</h3>
                      <p class="mt-1.5 text-sm text-primary-800 whitespace-pre-wrap">{{ current.aiRecommendation }}</p>
                    </div>
                  </div>
                </div>

                <!-- Score -->
                <div v-if="leadProfile" class="mb-6">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold text-gray-900">Score de crédit</h3>
                    <span class="text-sm font-semibold" :class="scoreColorClass(leadProfile.totalScore, leadProfile.maxScore)">
                      {{ leadProfile.scoreLabelFr || leadProfile.scoreLabel }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
                      :style="{ width: scoreRatio + '%' }"
                    ></div>
                  </div>

                  <div v-if="subScores.length" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div v-for="s in subScores" :key="s.label" class="p-3 border border-gray-200 rounded-lg">
                      <p class="text-xs text-gray-500 mb-0.5">{{ s.label }}</p>
                      <p class="text-base font-bold text-gray-900">{{ s.value }}</p>
                    </div>
                  </div>
                </div>

                <!-- Identité -->
                <div v-if="leadProfile" class="mb-6">
                  <h3 class="text-lg font-bold text-gray-900 mb-3">Identité du marchand</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Code client</span>
                      <span class="text-sm font-medium text-gray-900 truncate">{{ leadProfile.clientCode || '—' }}</span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Secteur</span>
                      <span class="text-sm font-medium text-gray-900 truncate">{{ formatSector(leadProfile.sector) }}</span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Ville</span>
                      <span class="text-sm font-medium text-gray-900 truncate">
                        {{ leadProfile.city || '—' }}<span v-if="leadProfile.country">, {{ leadProfile.country }}</span>
                      </span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Niveau KYC</span>
                      <span class="text-sm font-medium" :class="leadProfile.kycVerified ? 'text-green-600' : 'text-gray-900'">
                        {{ formatKyc(leadProfile.kycLevel) }}
                        <span v-if="leadProfile.kycVerified"> ✓</span>
                      </span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Ancienneté</span>
                      <span class="text-sm font-medium text-gray-900">
                        {{ leadProfile.monthsSinceCreation != null ? `${leadProfile.monthsSinceCreation} mois` : '—' }}
                      </span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">Jours actifs (30 j)</span>
                      <span class="text-sm font-medium text-gray-900">{{ leadProfile.activeDaysLast30 ?? '—' }}</span>
                    </div>
                    <div v-if="leadProfile.whatsappNumber" class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">WhatsApp</span>
                      <span class="text-sm font-medium text-gray-900">{{ leadProfile.whatsappNumber }}</span>
                    </div>
                    <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                      <span class="text-sm text-gray-500">CA mensuel moyen</span>
                      <span class="text-sm font-medium text-gray-900">{{ formatCurrency(leadProfile.avgMonthlyRevenue) }}</span>
                    </div>
                  </div>
                  <p v-if="leadProfile.tagline" class="mt-3 text-sm text-gray-600 italic">« {{ leadProfile.tagline }} »</p>
                </div>

                <!-- Objet de la demande -->
                <div>
                  <h3 class="text-lg font-bold text-gray-900 mb-3">Objet du financement</h3>
                  <p class="text-gray-600 leading-relaxed">{{ current.purpose || 'Aucun objet précisé par le marchand.' }}</p>
                </div>

                <div v-if="current.reviewedByEmail" class="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Instruite par</p>
                  <p class="text-sm text-gray-900">
                    {{ current.reviewedByEmail }} le {{ formatDate(current.reviewedAt) }}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">{{ current.reviewNote || 'Sans commentaire' }}</p>
                </div>
              </template>
            </div>

            <!-- ── Onglet Finances ── -->
            <div v-show="activeTab === 'finances'">
              <div v-if="isLoading">
                <SkeletonLoader type="card" />
              </div>

              <template v-else>
                <div v-if="financials" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div class="p-4 border border-gray-200 rounded-lg">
                    <p class="text-xs text-gray-500 mb-1">CA mensuel</p>
                    <AmountCompact tag="p" class="text-base font-bold text-gray-900" :value="financials.monthlyRevenue" :currency="financials.currency" />
                  </div>
                  <div class="p-4 border border-gray-200 rounded-lg">
                    <p class="text-xs text-gray-500 mb-1">Dépenses mensuelles</p>
                    <AmountCompact tag="p" class="text-base font-bold text-gray-900" :value="financials.monthlyExpenses" :currency="financials.currency" />
                  </div>
                  <div class="p-4 border border-gray-200 rounded-lg">
                    <p class="text-xs text-gray-500 mb-1">Bénéfice brut</p>
                    <AmountCompact tag="p" class="text-base font-bold text-green-600" :value="financials.grossProfit" :currency="financials.currency" />
                  </div>
                  <div class="p-4 border border-gray-200 rounded-lg">
                    <p class="text-xs text-gray-500 mb-1">Bénéfice net</p>
                    <AmountCompact
                      tag="p"
                      class="text-base font-bold"
                      :class="financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'"
                      :value="financials.netProfit"
                      :currency="financials.currency"
                    />
                  </div>
                </div>

                <div v-else class="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 mb-6">
                  Données financières indisponibles pour ce marchand.
                </div>

                <!-- Capacité de remboursement -->
                <div v-if="debtRatio !== null" class="mb-6 p-4 rounded-lg border" :class="debtRatio > 40 ? 'bg-red-50 border-red-200' : debtRatio > 25 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="text-sm font-semibold" :class="debtRatio > 40 ? 'text-red-800' : debtRatio > 25 ? 'text-amber-800' : 'text-green-800'">
                        Charge de remboursement estimée : {{ debtRatio }} % du CA mensuel
                      </p>
                      <p class="text-xs mt-1" :class="debtRatio > 40 ? 'text-red-700' : debtRatio > 25 ? 'text-amber-700' : 'text-green-700'">
                        Estimation hors intérêts :
                        {{ formatCurrency(current.requestedAmount / current.requestedDurationMonths) }} / mois sur
                        {{ current.requestedDurationMonths }} mois.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- États financiers OHADA -->
                <div v-if="statements" class="mb-6">
                  <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
                    <h3 class="text-lg font-bold text-gray-900">États financiers</h3>
                    <span class="text-xs text-gray-500">Période : {{ statements.period }}</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Bilan -->
                    <div class="border border-gray-200 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-gray-900 mb-3">Bilan</h4>
                      <div class="space-y-1.5">
                        <div
                          v-for="row in [
                            { label: 'Immobilisations', value: statements.balanceSheet.immobilisations },
                            { label: 'Stocks', value: statements.balanceSheet.stocks },
                            { label: 'Créances', value: statements.balanceSheet.receivables },
                            { label: 'Trésorerie', value: statements.balanceSheet.cashAndBank }
                          ]"
                          :key="row.label"
                          class="flex justify-between text-xs gap-2"
                        >
                          <span class="text-gray-500">{{ row.label }}</span>
                          <AmountCompact tag="span" class="text-gray-900 font-medium" :value="row.value" />
                        </div>
                        <div class="flex justify-between text-xs gap-2 pt-1.5 border-t border-gray-200">
                          <span class="font-semibold text-gray-700">Total actif</span>
                          <AmountCompact tag="span" class="font-bold text-gray-900" :value="statements.balanceSheet.totalAssets" />
                        </div>

                        <div class="pt-3 space-y-1.5">
                          <div
                            v-for="row in [
                              { label: 'Capitaux propres', value: statements.balanceSheet.equity },
                              { label: 'Dettes financières', value: statements.balanceSheet.financialDebts },
                              { label: 'Fournisseurs', value: statements.balanceSheet.payables },
                              { label: 'Dettes fiscales', value: statements.balanceSheet.taxLiabilities }
                            ]"
                            :key="row.label"
                            class="flex justify-between text-xs gap-2"
                          >
                            <span class="text-gray-500">{{ row.label }}</span>
                            <AmountCompact tag="span" class="text-gray-900 font-medium" :value="row.value" />
                          </div>
                          <div class="flex justify-between text-xs gap-2 pt-1.5 border-t border-gray-200">
                            <span class="font-semibold text-gray-700">Total passif</span>
                            <AmountCompact tag="span" class="font-bold text-gray-900" :value="statements.balanceSheet.totalLiabilities" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Compte de résultat -->
                    <div class="border border-gray-200 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-gray-900 mb-3">Compte de résultat</h4>
                      <div class="space-y-1.5">
                        <div
                          v-for="row in [
                            { label: 'Ventes', value: statements.incomeStatement.salesRevenue },
                            { label: 'Prestations', value: statements.incomeStatement.servicesRevenue },
                            { label: 'Autres produits', value: statements.incomeStatement.otherRevenue }
                          ]"
                          :key="row.label"
                          class="flex justify-between text-xs gap-2"
                        >
                          <span class="text-gray-500">{{ row.label }}</span>
                          <AmountCompact tag="span" class="text-gray-900 font-medium" :value="row.value" />
                        </div>
                        <div class="flex justify-between text-xs gap-2 pt-1.5 border-t border-gray-200">
                          <span class="font-semibold text-gray-700">Produits</span>
                          <AmountCompact tag="span" class="font-bold text-gray-900" :value="statements.incomeStatement.totalRevenue" />
                        </div>

                        <div class="pt-3 space-y-1.5">
                          <div
                            v-for="row in [
                              { label: 'Achats consommés', value: statements.incomeStatement.costOfGoodsSold },
                              { label: 'Services extérieurs', value: statements.incomeStatement.externalServices },
                              { label: 'Charges de personnel', value: statements.incomeStatement.personnelExpenses },
                              { label: 'Impôts et taxes', value: statements.incomeStatement.taxesAndDuties },
                              { label: 'Charges financières', value: statements.incomeStatement.interestExpense }
                            ]"
                            :key="row.label"
                            class="flex justify-between text-xs gap-2"
                          >
                            <span class="text-gray-500">{{ row.label }}</span>
                            <AmountCompact tag="span" class="text-gray-900 font-medium" :value="row.value" />
                          </div>
                          <div class="flex justify-between text-xs gap-2 pt-1.5 border-t border-gray-200">
                            <span class="font-semibold text-gray-700">Charges</span>
                            <AmountCompact tag="span" class="font-bold text-gray-900" :value="statements.incomeStatement.totalExpense" />
                          </div>
                        </div>

                        <div class="pt-3 space-y-1.5">
                          <div class="flex justify-between text-xs gap-2">
                            <span class="text-gray-500">Marge brute</span>
                            <AmountCompact tag="span" class="text-gray-900 font-medium" :value="statements.incomeStatement.grossProfit" />
                          </div>
                          <div class="flex justify-between text-xs gap-2">
                            <span class="text-gray-500">Résultat d'exploitation</span>
                            <AmountCompact tag="span" class="text-gray-900 font-medium" :value="statements.incomeStatement.operatingIncome" />
                          </div>
                          <div class="flex justify-between text-sm gap-2 pt-1.5 border-t border-gray-200">
                            <span class="font-semibold text-gray-700">Résultat net</span>
                            <AmountCompact
                              tag="span"
                              class="font-bold"
                              :class="statements.incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'"
                              :value="statements.incomeStatement.netIncome"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tendance d'activité -->
                <div v-if="trend?.points?.length">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">Activité sur 6 mois</h3>
                  <div class="flex items-center gap-4 text-xs text-gray-600 mb-4">
                    <span class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Chiffre d'affaires
                    </span>
                    <span class="flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span> Dépenses
                    </span>
                  </div>

                  <div class="h-48 flex items-end justify-between gap-2">
                    <div v-for="point in trend.points" :key="point.period" class="flex-1 flex flex-col items-center group">
                      <div class="w-full relative">
                        <div
                          class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10"
                        >
                          <div class="font-medium">{{ formatPeriod(point.period) }}</div>
                          <div class="text-primary-300">CA : {{ formatCurrency(point.revenue, trend.currency) }}</div>
                          <div class="text-orange-300">Dép. : {{ formatCurrency(point.expenses, trend.currency) }}</div>
                        </div>

                        <div class="relative h-36 flex items-end gap-1">
                          <div class="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t" :style="{ height: barHeight(point.revenue) }"></div>
                          <div class="flex-1 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t" :style="{ height: barHeight(point.expenses) }"></div>
                        </div>
                      </div>
                      <p class="text-xs text-gray-500 mt-2">{{ formatPeriod(point.period) }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- ── Onglet Patrimoine & fiscalité ── -->
            <div v-show="activeTab === 'patrimoine'">
              <div v-if="isLoading">
                <SkeletonLoader type="card" />
              </div>

              <template v-else>
                <div v-if="patrimony" class="mb-6">
                  <h3 class="text-lg font-bold text-gray-900 mb-3">Patrimoine déclaré</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="p-4 border border-gray-200 rounded-lg">
                      <p class="text-xs text-gray-500 mb-1">Stock</p>
                      <AmountCompact tag="p" class="text-base font-bold text-gray-900" :value="patrimony.stock?.currentValue" />
                      <p v-if="patrimony.stock?.stale" class="text-xs text-amber-600 mt-1">
                        Déclaration ancienne ({{ patrimony.stock.daysSinceLastDeclaration }} j)
                      </p>
                    </div>
                    <div class="p-4 border border-gray-200 rounded-lg">
                      <p class="text-xs text-gray-500 mb-1">Équipements</p>
                      <AmountCompact tag="p" class="text-base font-bold text-gray-900" :value="patrimony.assets?.currentValue" />
                      <p class="text-xs text-gray-400 mt-1">{{ patrimony.assets?.activeCount ?? 0 }} actif(s)</p>
                    </div>
                    <div class="p-4 border border-gray-200 rounded-lg">
                      <p class="text-xs text-gray-500 mb-1">Capital cumulé</p>
                      <AmountCompact tag="p" class="text-base font-bold text-gray-900" :value="patrimony.equity?.cumulativeCapital" />
                    </div>
                  </div>

                  <div v-if="patrimony.assets?.items?.length" class="mt-4 space-y-2">
                    <div
                      v-for="item in patrimony.assets.items.slice(0, 6)"
                      :key="item.id"
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
                    >
                      <span class="text-sm text-gray-700 truncate">{{ item.designation }}</span>
                      <span class="text-sm font-medium text-gray-900 whitespace-nowrap">{{ formatCurrency(item.currentValue) }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 mb-6">
                  Aucune donnée de patrimoine déclarée.
                </div>

                <!-- Photos justificatives -->
                <div v-if="proofRefs.length" class="mb-6">
                  <h3 class="text-lg font-bold text-gray-900 mb-1">Pièces justificatives</h3>
                  <p class="text-sm text-gray-500 mb-3">
                    {{ proofRefs.length }} photo(s) déposée(s) par le marchand — cliquez pour agrandir.
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="proof in proofRefs"
                      :key="proof.fileId"
                      @click="openProof(proof)"
                      :disabled="loadingProofId === proof.fileId"
                      class="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-primary-300 transition-colors disabled:opacity-50"
                    >
                      <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span class="truncate max-w-[200px]">{{ proof.label }}</span>
                      <svg
                        v-if="loadingProofId === proof.fileId"
                        class="animate-spin h-3.5 w-3.5 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-bold text-gray-900 mb-3">Conformité fiscale</h3>
                  <div v-if="taxDeclarations.length" class="space-y-2">
                    <div
                      v-for="dec in taxDeclarations.slice(0, 8)"
                      :key="dec.id"
                      class="flex items-center justify-between p-3 border border-gray-200 rounded-lg gap-3"
                    >
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ dec.taxType }}</p>
                        <p class="text-xs text-gray-500">
                          {{ dec.period }} · échéance {{ formatDate(dec.dueDate) }}
                        </p>
                      </div>
                      <div class="flex items-center gap-3 flex-shrink-0">
                        <span class="text-sm text-gray-700">{{ formatCurrency(dec.declaredAmount) }}</span>
                        <span class="badge" :class="statusBadgeClass(dec.status)">{{ statusLabel(dec.status) }}</span>
                      </div>
                    </div>
                  </div>
                  <p v-else class="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
                    Aucune déclaration fiscale enregistrée.
                  </p>
                </div>
              </template>
            </div>

            <!-- ── Onglet Décision ── -->
            <div v-show="activeTab === 'decision'">
              <div v-if="actionError" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {{ actionError }}
              </div>
              <div v-if="actionSuccess" class="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {{ actionSuccess }}
              </div>

              <!-- Instruction -->
              <div v-if="isPending">
                <h3 class="text-lg font-bold text-gray-900 mb-1">Instruire la demande</h3>
                <p class="text-sm text-gray-500 mb-4">
                  Votre décision est enregistrée avec votre identifiant et transmise au marchand.
                </p>

                <label class="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
                <textarea
                  v-model="reviewNote"
                  rows="3"
                  placeholder="Motif de la décision, conditions particulières…"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
                ></textarea>

                <div
                  v-if="confirmReject"
                  class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p class="text-sm font-medium text-red-800 mb-3">
                    Confirmer le rejet de cette demande ? Cette action est définitive.
                  </p>
                  <div class="flex gap-2">
                    <button
                      @click="handleReview('REJECTED')"
                      :disabled="acting"
                      class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Oui, rejeter
                    </button>
                    <button
                      @click="confirmReject = false"
                      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button
                    v-if="current.status === 'PENDING'"
                    @click="handleReview('UNDER_REVIEW')"
                    :disabled="acting"
                    class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Mettre en instruction
                  </button>
                  <button
                    @click="handleReview('APPROVED')"
                    :disabled="acting"
                    class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    v-if="!confirmReject"
                    @click="handleReview('REJECTED')"
                    :disabled="acting"
                    class="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                </div>
              </div>

              <!-- Décaissement -->
              <div v-else-if="isApproved">
                <h3 class="text-lg font-bold text-gray-900 mb-1">Décaisser le prêt</h3>
                <p class="text-sm text-gray-500 mb-5">
                  Renseignez les conditions finales. Le prêt sera créé chez le marchand et versé sur le compte indiqué.
                </p>

                <form @submit.prevent="handleDisburse" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Compte de décaissement *</label>
                    <p v-if="accountsError" class="text-sm text-red-600">{{ accountsError }}</p>
                    <p v-else-if="accounts.length === 0" class="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                      Ce marchand n'a déclaré aucun compte de trésorerie.
                    </p>
                    <select
                      v-else
                      v-model="disburseForm.disbursementAccountId"
                      required
                      class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="" disabled>Sélectionner un compte…</option>
                      <option v-for="a in accountOptions" :key="a.id" :value="a.id">
                        {{ a.label }} — solde {{ formatCurrency(a.balance) }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Taux d'intérêt annuel (%) *</label>
                    <input v-model="disburseForm.interestRate" type="number" step="0.1" min="0" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Frais de dossier (F CFA)</label>
                    <input v-model="disburseForm.applicationFee" type="number" min="0" placeholder="50000" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Assurance mensuelle (F CFA)</label>
                    <input v-model="disburseForm.monthlyInsuranceFee" type="number" min="0" placeholder="5000" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">TVA sur intérêts (%)</label>
                    <input v-model="disburseForm.taxRate" type="number" step="0.1" min="0" placeholder="18" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mensualité sur-mesure (F CFA)</label>
                    <input v-model="disburseForm.customMonthlyPayment" type="number" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coût total du crédit (F CFA)</label>
                    <input
                      v-model="disburseForm.totalCost"
                      type="number"
                      min="0"
                      placeholder="Estimé automatiquement si vide"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p class="text-xs text-gray-500 mt-1">Intérêts, frais, assurance et taxes, hors capital.</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date de décaissement</label>
                    <input v-model="disburseForm.startDate" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Type de prêt</label>
                    <select v-model="disburseForm.type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="BANK_LOAN">Prêt bancaire</option>
                      <option value="LINE_OF_CREDIT">Ligne de crédit</option>
                      <option value="LEASING">Leasing</option>
                      <option value="SUPPLIER_CREDIT">Crédit fournisseur</option>
                      <option value="OVERDRAFT">Découvert</option>
                      <option value="BOND">Obligation</option>
                      <option value="SHAREHOLDER_LOAN">Compte courant associé</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Fréquence de remboursement</label>
                    <select v-model="disburseForm.paymentFrequency" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="MONTHLY">Mensuel</option>
                      <option value="BIMONTHLY">Bimensuel</option>
                      <option value="QUARTERLY">Trimestriel</option>
                      <option value="SEMI_ANNUAL">Semestriel</option>
                      <option value="ANNUAL">Annuel</option>
                    </select>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Numéro de prêt</label>
                    <input v-model="disburseForm.loanNumber" type="text" placeholder="Ex : PRE-2026-889" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                  <div class="md:col-span-2 flex items-center gap-2">
                    <input id="autoRepay" v-model="disburseForm.autoRepayment" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label for="autoRepay" class="text-sm text-gray-700">Prélever automatiquement les échéances</label>
                  </div>
                  <div v-if="disburseForm.autoRepayment" class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Compte de prélèvement</label>
                    <select v-model="disburseForm.repaymentAccountId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">Aucun (prélèvement manuel)</option>
                      <option v-for="a in accountOptions" :key="a.id" :value="a.id">{{ a.label }}</option>
                    </select>
                  </div>

                  <div class="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      :disabled="acting || accounts.length === 0"
                      class="w-full md:w-auto px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg v-if="acting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {{ acting ? 'Décaissement…' : 'Décaisser le prêt' }}
                    </button>
                  </div>
                </form>
              </div>

              <!-- Dossier clos -->
              <div v-else-if="isClosed" class="text-center py-10">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <svg class="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 class="text-base font-medium text-gray-900 mb-1">Dossier clos</h3>
                <p class="text-sm text-gray-500">
                  Cette demande est {{ statusLabel(current.status).toLowerCase() }} : aucune action supplémentaire n'est possible.
                </p>
              </div>
            </div>

            <!-- Pied de modale -->
            <div class="flex flex-wrap items-center gap-3 mt-8 pt-5 border-t border-gray-200">
              <button
                v-if="activeTab !== 'decision' && !isClosed"
                @click="activeTab = 'decision'"
                class="flex-1 min-w-[180px] px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                {{ isApproved ? 'Décaisser le prêt' : 'Instruire la demande' }}
              </button>
              <button
                @click="handleExport"
                :disabled="exporting"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                {{ exporting ? 'Export…' : 'Exporter le dossier' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Visionneuse des pièces justificatives -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="lightbox"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
        @click="lightbox = null"
      >
        <div class="max-w-3xl w-full" @click.stop>
          <div class="flex items-center justify-between mb-3 gap-4">
            <p class="text-sm font-medium text-white truncate">{{ lightbox.label }}</p>
            <button @click="lightbox = null" class="text-white/70 hover:text-white transition-colors flex-shrink-0">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <img :src="lightbox.url" :alt="lightbox.label" class="w-full max-h-[80vh] object-contain rounded-lg bg-white" />
        </div>
      </div>
    </transition>
  </Teleport>
</template>