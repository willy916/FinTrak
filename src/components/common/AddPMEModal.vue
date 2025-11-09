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
              <h3 class="text-2xl font-bold text-gray-900">Ajouter une PME</h3>
              <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-2 hover:bg-gray-100">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="submitForm" class="space-y-5">
              <!-- Sélection PME existante -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">PME à la recherche de financement</label>
                <div class="relative">
                  <button
                    type="button"
                    @click="showPMEMenu = !showPMEMenu"
                    class="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  >
                    <div v-if="formData.selectedPME" class="flex items-center space-x-3">
                      <img :src="formData.selectedPME.image" :alt="formData.selectedPME.name" class="w-10 h-10 rounded-lg object-cover">
                      <div class="text-left">
                        <p class="text-sm font-medium text-gray-900">{{ formData.selectedPME.name }}</p>
                        <p class="text-xs text-gray-500">{{ formatCurrency(formData.selectedPME.requestedAmount) }}</p>
                      </div>
                    </div>
                    <span v-else class="text-gray-500">Aucun (nouvelle PME)</span>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div v-if="showPMEMenu" class="absolute z-[10001] w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-72 overflow-y-auto">
                    <button
                      type="button"
                      @click="selectPME(null)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <span class="text-sm font-medium text-gray-700">Aucun (nouvelle PME)</span>
                    </button>
                    <button
                      v-for="pme in availablePMEs"
                      :key="pme.id"
                      type="button"
                      @click="selectPME(pme)"
                      class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div class="flex items-center space-x-3">
                        <img :src="pme.image" :alt="pme.name" class="w-10 h-10 rounded-lg object-cover">
                        <div>
                          <p class="text-sm font-medium text-gray-900">{{ pme.name }}</p>
                          <p class="text-xs text-gray-500">{{ formatCurrency(pme.requestedAmount) }}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Formulaire -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nom de la PME *</label>
                  <input v-model="formData.nom" type="text" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: TechStart Africa">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Activité *</label>
                  <input v-model="formData.activite" type="text" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Technologie">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Localité *</label>
                  <input v-model="formData.localite" type="text" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ex: Abidjan">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input v-model="formData.telephone" type="tel" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+225 XX XX XX XX XX">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Montant financement (XOF) *</label>
                  <input v-model.number="formData.montantFinancement" type="number" required min="0"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="50000000">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Taux d'intérêt (%)</label>
                  <input v-model.number="formData.tauxInteret" type="number" step="0.1" min="0" max="100"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="12.5">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Date reçu *</label>
                  <input v-model="formData.dateRecu" type="date" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Date d'échéance *</label>
                  <input v-model="formData.dateEcheance" type="date" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                </div>
              </div>

              <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" @click="$emit('close')"
                  class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                  Créer la PME
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal Success -->
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
          <h3 class="text-xl font-bold text-gray-900 mb-2">Compte créé avec succès!</h3>
          <p class="text-gray-600 mb-6">La PME <span class="font-semibold">{{ createdPME.nom }}</span> a été ajoutée.</p>
          <button @click="closeSuccess"
            class="w-full px-5 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  availablePMEs: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'pme-created']);

const showPMEMenu = ref(false);
const showSuccess = ref(false);

const formData = ref({
  selectedPME: null,
  nom: '',
  activite: '',
  localite: '',
  telephone: '',
  montantFinancement: '',
  tauxInteret: '',
  dateRecu: '',
  dateEcheance: ''
});

const createdPME = ref({});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};

const selectPME = (pme) => {
  formData.value.selectedPME = pme;
  if (pme) {
    formData.value.nom = pme.name;
    formData.value.activite = pme.sector;
    formData.value.montantFinancement = pme.requestedAmount;
  }
  showPMEMenu.value = false;
};

const submitForm = () => {
  createdPME.value = { ...formData.value };
  emit('pme-created', createdPME.value);
  showSuccess.value = true;
  resetForm();
};

const closeSuccess = () => {
  showSuccess.value = false;
  emit('close');
};

const resetForm = () => {
  formData.value = {
    selectedPME: null,
    nom: '',
    activite: '',
    localite: '',
    telephone: '',
    montantFinancement: '',
    tauxInteret: '',
    dateRecu: '',
    dateEcheance: ''
  };
};

watch(() => props.show, (val) => {
  if (!val) {
    showPMEMenu.value = false;
  }
});
</script>