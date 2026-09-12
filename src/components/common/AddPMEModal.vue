<script setup>
import { ref, watch, computed } from 'vue';
import { requestClientLink, importExternalLoan } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import { formatCurrency } from '@/utils/format';

const props = defineProps({
  show: Boolean,
  /** Marchands sélectionnables pour l'import d'un prêt existant (leads + clients). */
  availablePMEs: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'pme-created']);

/**
 * Deux parcours réels côté API :
 *  - « link »   → POST /clients/link-request  (associer un marchand Djeli existant)
 *  - « import » → POST /clients/{orgId}/external-loans (déclarer un prêt contracté hors Djeli)
 * Il n'existe pas d'endpoint de création de PME depuis le portail microfinance.
 */
const mode = ref('link');

const showPMEMenu = ref(false);
const showSuccess = ref(false);
const successMessage = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

/* ── Liaison marchand ── */
// La liaison se fait uniquement par code client : c'est l'identifiant que le
// marchand communique et le seul qui soit non ambigu.
const linkValue = ref('');

/* ── Import de prêt existant ── */
const importForm = ref({
  selectedPME: null,
  principalAmount: '',
  remainingAmount: '',
  interestRate: '',
  durationMonths: '',
  startDate: new Date().toISOString().split('T')[0],
  monthlyPayment: '',
  totalCost: '',
  loanNumber: '',
  autoRepayment: false,
});

const canSubmitLink = computed(() => linkValue.value.trim().length > 0 && !isSubmitting.value);

const canSubmitImport = computed(
  () =>
    importForm.value.selectedPME &&
    Number(importForm.value.principalAmount) > 0 &&
    Number(importForm.value.remainingAmount) >= 0 &&
    Number(importForm.value.durationMonths) > 0 &&
    importForm.value.startDate &&
    !isSubmitting.value
);

const selectPME = (pme) => {
  importForm.value.selectedPME = pme;
  showPMEMenu.value = false;
};

const switchMode = (next) => {
  mode.value = next;
  errorMessage.value = '';
};

async function submitLink() {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const value = linkValue.value.trim();
    const payload = { clientCode: value };

    await requestClientLink(payload);

    successMessage.value = `Demande de liaison envoyée pour « ${value} ». Elle apparaîtra dans vos associations une fois validée.`;
    showSuccess.value = true;
    emit('pme-created', { type: 'link', ...payload });
    resetForms();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}

async function submitImport() {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const form = importForm.value;
    await importExternalLoan(form.selectedPME.organizationId, {
      principalAmount: Number(form.principalAmount),
      remainingAmount: Number(form.remainingAmount),
      interestRate: Number(form.interestRate) || 0,
      durationMonths: Number(form.durationMonths),
      startDate: form.startDate,
      monthlyPayment: form.monthlyPayment ? Number(form.monthlyPayment) : undefined,
      // Laissé vide, le serveur l'estime depuis l'échéancier.
      totalCost: form.totalCost ? Number(form.totalCost) : undefined,
      loanNumber: form.loanNumber || undefined,
      autoRepayment: form.autoRepayment,
    });

    successMessage.value = `Le prêt de ${form.selectedPME.organizationName} a été importé dans votre portefeuille.`;
    showSuccess.value = true;
    emit('pme-created', { type: 'import', organizationId: form.selectedPME.organizationId });
    resetForms();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isSubmitting.value = false;
  }
}

const submitForm = () => (mode.value === 'link' ? submitLink() : submitImport());

const closeSuccess = () => {
  showSuccess.value = false;
  emit('close');
};

function resetForms() {
  linkValue.value = '';
  importForm.value = {
    selectedPME: null,
    principalAmount: '',
    remainingAmount: '',
    interestRate: '',
    durationMonths: '',
    startDate: new Date().toISOString().split('T')[0],
    monthlyPayment: '',
    loanNumber: '',
    autoRepayment: false,
  };
}

watch(
  () => props.show,
  (val) => {
    if (!val) {
      showPMEMenu.value = false;
      errorMessage.value = '';
    }
  }
);
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
      <div v-if="show" class="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full z-[10000] max-h-[90vh] overflow-y-auto">
          <div class="px-6 pt-6 pb-4">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-2xl font-bold text-gray-900">Ajouter une PME</h3>
                <p class="text-sm text-gray-500 mt-1">Associez un marchand Djeli ou déclarez un prêt existant.</p>
              </div>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-2 hover:bg-gray-100"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Sélecteur de parcours -->
            <div class="flex items-center gap-2 p-1 bg-gray-100 rounded-xl mb-6">
              <button
                type="button"
                @click="switchMode('link')"
                :class="[
                  'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
                  mode === 'link' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                Lier un marchand
              </button>
              <button
                type="button"
                @click="switchMode('import')"
                :class="[
                  'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
                  mode === 'import' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                Importer un prêt existant
              </button>
            </div>

            <div
              v-if="errorMessage"
              class="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start"
            >
              <svg class="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ errorMessage }}
            </div>

            <form @submit.prevent="submitForm" class="space-y-5">
              <!-- Parcours 1 : liaison -->
              <template v-if="mode === 'link'">
                <div class="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p class="text-xs text-blue-800">
                    La demande est transmise au marchand. Une fois acceptée, vous accédez à son profil complet et pouvez
                    lui proposer un financement.
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Code Client *</label>
                  <input
                    v-model="linkValue"
                    type="text"
                    required
                    placeholder="Ex : CLI-892415"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p class="text-xs text-gray-500 mt-2">Code communiqué par le marchand depuis son espace Djeli.</p>
                </div>
              </template>

              <!-- Parcours 2 : import de prêt -->
              <template v-else>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Marchand concerné *</label>
                  <div class="relative">
                    <button
                      type="button"
                      @click="showPMEMenu = !showPMEMenu"
                      class="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    >
                      <div v-if="importForm.selectedPME" class="flex items-center space-x-3 min-w-0">
                        <div
                          class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0"
                        >
                          {{ importForm.selectedPME.organizationName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="text-left min-w-0">
                          <p class="text-sm font-medium text-gray-900 truncate">
                            {{ importForm.selectedPME.organizationName }}
                          </p>
                          <p class="text-xs text-gray-500">{{ importForm.selectedPME.clientCode || '—' }}</p>
                        </div>
                      </div>
                      <span v-else class="text-gray-500">Sélectionner un marchand…</span>
                      <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <div
                      v-if="showPMEMenu"
                      class="absolute z-[10001] w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-72 overflow-y-auto"
                    >
                      <p v-if="availablePMEs.length === 0" class="px-4 py-6 text-sm text-gray-500 text-center">
                        Aucun marchand disponible. Liez d'abord un marchand.
                      </p>
                      <button
                        v-for="pme in availablePMEs"
                        :key="pme.organizationId"
                        type="button"
                        @click="selectPME(pme)"
                        class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div class="flex items-center space-x-3">
                          <div
                            class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0"
                          >
                            {{ pme.organizationName.charAt(0).toUpperCase() }}
                          </div>
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">{{ pme.organizationName }}</p>
                            <p class="text-xs text-gray-500">{{ pme.clientCode || pme.organizationId.slice(0, 8) }}</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Montant initial (F CFA) *</label>
                    <input
                      v-model="importForm.principalAmount"
                      type="number"
                      required
                      min="1"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="5000000"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Restant dû actuel (F CFA) *</label>
                    <input
                      v-model="importForm.remainingAmount"
                      type="number"
                      required
                      min="0"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="3200000"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Taux d'intérêt annuel (%)</label>
                    <input
                      v-model="importForm.interestRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Durée (mois) *</label>
                    <input
                      v-model="importForm.durationMonths"
                      type="number"
                      required
                      min="1"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date de décaissement *</label>
                    <input
                      v-model="importForm.startDate"
                      type="date"
                      required
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mensualité (F CFA)</label>
                    <input
                      v-model="importForm.monthlyPayment"
                      type="number"
                      min="0"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="250000"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Coût total du crédit (F CFA)</label>
                    <input
                      v-model="importForm.totalCost"
                      type="number"
                      min="0"
                      placeholder="Estimé si vide"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Référence du prêt</label>
                    <input
                      v-model="importForm.loanNumber"
                      type="text"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex : PRE-2026-889"
                    />
                  </div>
                  <div class="md:col-span-2 flex items-center gap-2">
                    <input
                      id="autoRepaymentImport"
                      v-model="importForm.autoRepayment"
                      type="checkbox"
                      class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label for="autoRepaymentImport" class="text-sm text-gray-700">
                      Prélever automatiquement les échéances
                    </label>
                  </div>
                </div>

                <p
                  v-if="importForm.principalAmount && importForm.remainingAmount"
                  class="text-xs text-gray-500"
                >
                  Déjà remboursé :
                  <span class="font-semibold text-gray-700">
                    {{ formatCurrency(Math.max(0, Number(importForm.principalAmount) - Number(importForm.remainingAmount))) }}
                  </span>
                </p>
              </template>

              <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  :disabled="mode === 'link' ? !canSubmitLink : !canSubmitImport"
                  class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="isSubmitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {{ mode === 'link' ? 'Envoyer la demande' : 'Importer le prêt' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>

    <!-- Confirmation -->
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showSuccess" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75" @click="closeSuccess"></div>

        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center z-[10002]">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Opération réussie</h3>
          <p class="text-gray-600 mb-6 text-sm">{{ successMessage }}</p>
          <button
            @click="closeSuccess"
            class="w-full px-5 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
