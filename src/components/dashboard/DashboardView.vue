<script setup>
import { ref, onMounted, computed } from 'vue';
import SkeletonLoader from '../common/SkeletonLoader.vue';
import { useRoute } from 'vue-router';

const isLoading = ref(true);
const isLoadingTable = ref(true);
const showPeriodMenu = ref(false);
const selectedPeriod = ref('Ce Mois');
const cashFlowPeriod = ref('Mois');
const periods = ['Aujourd\'hui', 'Cette Semaine', 'Ce Mois', 'Cette Année'];
const paymentFilter = ref('all');
const activeActionMenu = ref(null);

const cashFlowTotal = ref(342323.44);

const PME = ref([
  {
    currency: 'Financées',
    amount: 100,
    limit: '10k',
    status: 'Actif',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    currency: 'Remboursées',
    amount: 50,
    limit: '8k',
    status: 'Actif',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    currency: 'En cours de remboursement',
    amount: 20,
    limit: '10k',
    status: 'Actif',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  },
  {
    currency: 'En retard',
    amount: 30,
    limit: '7.5k',
    status: 'Retard',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600'
  }
]);

const cashFlowData = ref([
  { month: 'Jan', cashflow: 25000, inflow: 18000 },
  { month: 'Fév', cashflow: 30000, inflow: 22000 },
  { month: 'Mar', cashflow: 45000, inflow: 28000 },
  { month: 'Avr', cashflow: 35000, inflow: 25000 },
  { month: 'Mai', cashflow: 50000, inflow: 30000 },
  { month: 'Juin', cashflow: 38000, inflow: 27000 },
  { month: 'Juil', cashflow: 60000, inflow: 35000 }
]);

// Échéancier des Remboursements - Affichage de 5 premiers éléments seulement
const upcomingPayments = ref([
  {
    id: 1,
    pmeName: 'Fashion Market CI',
    sector: 'Mode & Textile',
    amount: 7500,
    dueDate: '05 Nov, 2025',
    paymentStatus: 'En retard',
    daysRemaining: -5,
    progress: 33
  },
  {
    id: 2,
    pmeName: 'BioFood CI',
    sector: 'Alimentation',
    amount: 6000,
    dueDate: '12 Déc, 2025',
    paymentStatus: 'En cours',
    daysRemaining: 42,
    progress: 40
  },
  {
    id: 3,
    pmeName: 'TechStart CI',
    sector: 'Technologie',
    amount: 7500,
    dueDate: '15 Déc, 2025',
    paymentStatus: 'En cours',
    daysRemaining: 45,
    progress: 85
  },
  {
    id: 4,
    pmeName: 'EduTech Africa',
    sector: 'Éducation',
    amount: 17500,
    dueDate: '28 Déc, 2025',
    paymentStatus: 'En cours',
    daysRemaining: 58,
    progress: 50
  },
  {
    id: 5,
    pmeName: 'Logistics Express',
    sector: 'Transport',
    amount: 13750,
    dueDate: '08 Jan, 2026',
    paymentStatus: 'En cours',
    daysRemaining: 69,
    progress: 75
  }
]);

const filteredPayments = computed(() => {
  let filtered = upcomingPayments.value;

  if (paymentFilter.value !== 'all') {
    if (paymentFilter.value === 'completed') {
      filtered = filtered.filter(p => p.paymentStatus === 'Terminé');
    } else if (paymentFilter.value === 'ongoing') {
      filtered = filtered.filter(p => p.paymentStatus === 'En cours' || p.paymentStatus === 'À venir');
    } else if (paymentFilter.value === 'late') {
      filtered = filtered.filter(p => p.paymentStatus === 'En retard');
    }
  }

  return filtered;
});

const selectPeriod = (period) => {
  selectedPeriod.value = period;
  showPeriodMenu.value = false;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};

const changeFilter = (filter) => {
  paymentFilter.value = filter;
  isLoadingTable.value = true;
  
  setTimeout(() => {
    isLoadingTable.value = false;
  }, 800);
};

const toggleActionMenu = (paymentId) => {
  if (activeActionMenu.value === paymentId) {
    activeActionMenu.value = null;
  } else {
    activeActionMenu.value = paymentId;
  }
};

const viewDetails = (payment) => {
  alert(`Détails de ${payment.pmeName}\nMontant: ${formatCurrency(payment.amount)}\nProgression: ${payment.progress}%`);
  activeActionMenu.value = null;
};

const sendReminder = (payment) => {
  alert(`Relance envoyée à ${payment.pmeName}`);
  activeActionMenu.value = null;
};

const deletePayment = (payment) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le paiement de ${payment.pmeName} ?`)) {
    const index = upcomingPayments.value.findIndex(p => p.id === payment.id);
    if (index > -1) {
      upcomingPayments.value.splice(index, 1);
      alert(`Paiement supprimé avec succès`);
    }
  }
  activeActionMenu.value = null;
};

const resetData = () => {
  isLoading.value = true;
  isLoadingTable.value = true;
  
  setTimeout(() => {
    isLoading.value = false;
    isLoadingTable.value = false;
  }, 800);
};

const viewAllPayments = () => {
  // Redirection vers la page complète des remboursements
  alert('Redirection vers la page complète des remboursements');
};

// Fonction pour obtenir l'icône selon le type
const getIconPath = (currency) => {
  switch(currency) {
    case 'Financées':
      return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
    case 'Remboursées':
      return 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75';
    case 'En cours de remboursement':
      return 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'En retard':
      return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
    default:
      return '';
  }
};

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 1500);

  setTimeout(() => {
    isLoadingTable.value = false;
  }, 1500);

  document.addEventListener('click', () => {
    activeActionMenu.value = null;
  });
});
</script>

<template>
  <div class="dashboard-container">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord</h1>
          <p class="text-gray-500 mt-1">Observez toutes les données de votre microfinance.</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <!-- Time Period Selector -->
          <div class="relative">
            <button
              @click="showPeriodMenu = !showPeriodMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span class="text-sm font-medium text-gray-700">{{ selectedPeriod }}</span>
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Period Dropdown -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="showPeriodMenu" class="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-10">
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

          <!-- Reset Button -->
          <button 
            @click="resetData"
            class="flex items-center space-x-2 px-4 py-2 text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="text-sm font-medium">Actualiser</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Stats Cards -->
    <div v-if="isLoading">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SkeletonLoader type="stat" v-for="i in 3" :key="i" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <!-- Balance Card -->
      <div class="card bg-gradient-to-br from-primary-500 to-primary-600 text-white card-hover animate-slide-in-up">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-white/80 text-sm">Financement Total</p>
              <p class="text-xs text-white/60">Vue d'ensemble des fonds</p>
            </div>
          </div>
          <button class="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <div class="flex items-end space-x-2">
            <h2 class="text-4xl font-bold">20 520 320 F</h2>
            <span class="flex items-center space-x-1 text-white/90 bg-white/20 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>+1.5%</span>
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

      <!-- Chiffre d'Affaires -->
      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-600 text-sm">Chiffre d'Affaires</p>
              <p class="text-xs text-gray-400">Financements + Intérêts</p>
            </div>
          </div>
          <button class="text-gray-400 hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <div class="flex items-end space-x-2">
            <h2 class="text-3xl font-bold text-gray-900">15 800 450 F</h2>
            <span class="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>+3.2%</span>
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

      <!-- Bénéfices -->
      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-gray-600 text-sm">Bénéfices</p>
              <p class="text-xs text-gray-400">Taux d'intérêt total</p>
            </div>
          </div>
          <button class="text-gray-400 hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        
        <div class="mb-4">
          <div class="flex items-end space-x-2">
            <h2 class="text-3xl font-bold text-gray-900">50 120 780 F</h2>
            <span class="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>+4.7%</span>
            </span>
          </div>
        </div>

        <router-link to="/wallet" class="flex items-center space-x-2 text-primary-600 hover:underline">
          <span class="text-sm font-medium">Analyser les performances</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Wallet and Cash Flow Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- My Wallet -->
      <div class="card animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Mes PME</h3>
            <p class="text-sm text-gray-500">Statistiques des PME</p>
          </div>
          <router-link to="/gestionpme" class="flex items-center space-x-2 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors">
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
          <!-- Currency Cards -->
          <div v-for="wallet in PME" :key="wallet.currency" 
               class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all group">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', wallet.bgColor]">
                  <svg :class="['w-6 h-6', wallet.iconColor]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="getIconPath(wallet.currency)" />
                  </svg>
                </div>
                <span class="font-medium text-gray-900 text-sm">{{ wallet.currency }}</span>
              </div>
              <button class="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            
            <div class="mb-2">
              <p class="text-2xl font-bold text-gray-900">{{ wallet.amount }}</p>
            </div>
            
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-500">Total des PME</p>
              <span :class="[
                'text-xs font-medium px-2 py-1 rounded-full',
                wallet.status === 'Actif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              ]">
                {{ wallet.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cash Flow Chart -->
      <div class="card animate-slide-in-up animate-delay-400">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Statistiques</h3>
          <div class="flex items-center space-x-2">
            <button
              v-for="period in ['Mois', 'Année']"
              :key="period"
              @click="cashFlowPeriod = period"
              :class="[
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                cashFlowPeriod === period
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              {{ period }}
            </button>
          </div>
        </div>

        <div v-if="isLoading">
          <SkeletonLoader type="chart" />
        </div>

        <div v-else>
          <div class="mb-4">
            <p class="text-3xl font-bold text-gray-900">{{ cashFlowTotal.toLocaleString() }} F</p>
          </div>
          
          <!-- Simple Bar Chart -->
          <div class="h-64 flex items-end justify-between space-x-2">
            <div v-for="(data, index) in cashFlowData" :key="index" class="flex-1 flex flex-col items-center group">
              <div class="w-full relative">
                <!-- Tooltip on hover -->
                <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                  <div class="font-medium">{{ data.month }}</div>
                  <div class="text-green-400">Entrées: {{ data.cashflow.toLocaleString() }} F</div>
                  <div class="text-red-400">Sorties: {{ data.inflow.toLocaleString() }} F</div>
                  <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div class="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                <!-- Bar -->
                <div class="relative h-48">
                  <div class="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-500"
                       :style="`height: ${(data.cashflow / Math.max(...cashFlowData.map(d => d.cashflow))) * 100}%`">
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ data.month }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Échéancier des Remboursements -->
    <div class="card animate-slide-in-up animate-delay-500">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Échéancier des Remboursements</h3>
            <p class="text-sm text-gray-500 mt-1">Prochains paiements attendus</p>
          </div>
          
          <!-- Voir Plus Button -->
          <router-link to="/gestionpme"
            
            class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span class="text-sm font-medium">Voir Plus</span>
          </router-link>
        </div>
      </div>

      <div v-if="isLoadingTable">
        <SkeletonLoader type="table" :rows="5" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">PME</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant Échéance</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Échéance</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Progression</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Jours Restants</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="payment in filteredPayments" :key="payment.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {{ payment.pmeName.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ payment.pmeName }}</p>
                    <p class="text-xs text-gray-500">{{ payment.sector }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(payment.amount) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600">{{ payment.dueDate }}</span>
              </td>
              <td class="py-4 px-4">
                <div class="w-32">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-gray-600">{{ payment.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full transition-all duration-500',
                        payment.progress >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                        payment.progress >= 50 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        payment.progress >= 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                        'bg-gradient-to-r from-red-500 to-red-600'
                      ]"
                      :style="{ width: payment.progress + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="py-4 px-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    payment.paymentStatus === 'Terminé' ? 'bg-green-100 text-green-700' :
                    payment.paymentStatus === 'À venir' || payment.paymentStatus === 'En cours' ? 'bg-blue-100 text-blue-700' :
                    payment.paymentStatus === 'En retard' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 mr-1.5 rounded-full',
                      payment.paymentStatus === 'Terminé' ? 'bg-green-600' :
                      payment.paymentStatus === 'À venir' || payment.paymentStatus === 'En cours' ? 'bg-blue-600' :
                      payment.paymentStatus === 'En retard' ? 'bg-red-600' :
                      'bg-gray-600'
                    ]"
                  ></span>
                  {{ payment.paymentStatus }}
                </span>
              </td>
              <td class="py-4 px-4 text-center">
                <span
                  :class="[
                    'text-sm font-medium',
                    payment.daysRemaining < 0 ? 'text-red-600' :
                    payment.daysRemaining <= 7 ? 'text-orange-600' :
                    'text-gray-900'
                  ]"
                >
                  {{ payment.daysRemaining < 0 ? 'Retard de ' + Math.abs(payment.daysRemaining) : payment.daysRemaining }} jours
                </span>
              </td>
              <td class="py-4 px-4 text-center">
                <div class="relative inline-block">
                  <button
                    v-if="payment.paymentStatus !== 'Terminé'"
                    @click.stop="toggleActionMenu(payment.id)"
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  <!-- Dropdown Menu -->
                  <transition
                    enter-active-class="transition ease-out duration-100"
                    enter-from-class="transform opacity-0 scale-95"
                    enter-to-class="transform opacity-100 scale-100"
                    leave-active-class="transition ease-in duration-75"
                    leave-from-class="transform opacity-100 scale-100"
                    leave-to-class="transform opacity-0 scale-95"
                  >
                    <div
                      v-if="activeActionMenu === payment.id"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                      @click.stop
                    >
                      <router-link to="/detailpme"
                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Voir plus</span>
                      </router-link>
                      <button
                        @click="sendReminder(payment)"
                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Relancer</span>
                      </button>
                      <div class="border-t border-gray-100 my-1"></div>
                      <button
                        @click="deletePayment(payment)"
                        class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </transition>
                </div>
                <span v-if="payment.paymentStatus === 'Terminé'" class="text-xs text-gray-400">-</span>
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