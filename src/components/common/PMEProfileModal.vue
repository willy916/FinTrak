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
        v-if="pme"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        @click="$emit('close')"
      >
        <div
          class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          @click.stop
        >
          <!-- Modal Header -->
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {{ pme.name.charAt(0) }}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">{{ pme.name }}</h2>
                  <p class="text-sm text-gray-500">{{ pme.sector }}</p>
                </div>
              </div>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <!-- Modal Image -->
            <div class="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg overflow-hidden">
              <img 
                :src="pme.image" 
                :alt="pme.name"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <!-- Modal Body -->
          <div class="p-6">
            <!-- Key Information -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="card">
                <p class="text-xs text-gray-500 mb-1">Montant demandé</p>
                <p class="text-lg font-bold text-gray-900">{{ formatCurrency(pme.requestedAmount) }}</p>
              </div>
              <div class="card">
                <p class="text-xs text-gray-500 mb-1">ROI Estimé</p>
                <p class="text-lg font-bold text-green-600">{{ pme.estimatedROI }}%</p>
              </div>
              <div class="card">
                <p class="text-xs text-gray-500 mb-1">Durée</p>
                <p class="text-lg font-bold text-gray-900">{{ pme.duration }} mois</p>
              </div>
              <div class="card">
                <p class="text-xs text-gray-500 mb-1">Employés</p>
                <p class="text-lg font-bold text-gray-900">{{ pme.employees }}</p>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-3">Description de l'entreprise</h3>
              <p class="text-gray-600 leading-relaxed">{{ pme.fullDescription }}</p>
            </div>

            <!-- Business Model -->
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-3">Modèle économique</h3>
              <p class="text-gray-600 leading-relaxed">{{ pme.businessModel }}</p>
            </div>

            <!-- Financial Projections -->
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-3">Projections financières</h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="card">
                  <p class="text-xs text-gray-500 mb-1">Année 1</p>
                  <p class="text-sm font-bold text-gray-900">{{ formatCurrency(pme.projections.year1) }}</p>
                </div>
                <div class="card">
                  <p class="text-xs text-gray-500 mb-1">Année 2</p>
                  <p class="text-sm font-bold text-gray-900">{{ formatCurrency(pme.projections.year2) }}</p>
                </div>
                <div class="card">
                  <p class="text-xs text-gray-500 mb-1">Année 3</p>
                  <p class="text-sm font-bold text-gray-900">{{ formatCurrency(pme.projections.year3) }}</p>
                </div>
              </div>
            </div>

            <!-- Contact Information -->
            <div class="mb-6">
              <h3 class="text-lg font-bold text-gray-900 mb-3">Informations de contact</h3>
              <div class="space-y-2">
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{{ pme.contact.name }}</span>
                </div>
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{{ pme.contact.email }}</span>
                </div>
                <div class="flex items-center space-x-2 text-sm text-gray-600">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{{ pme.contact.phone }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-3">
              <button
                @click="$emit('invest', pme)"
                class="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Contactez-nous
              </button>
              <button
                @click="$emit('request-info', pme)"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Plus d'infos
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  pme: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'invest', 'request-info']);

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};
</script>