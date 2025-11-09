<template>
  <div class="transactions-container">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Détails de chaque PME</h1>
          <p class="text-gray-500 mt-1">Suivez vos PME financées et leurs remboursements</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <!-- Liste des PME Dropdown -->
          <div class="relative">
            <button
              @click="showPMEMenu = !showPMEMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span class="text-sm font-medium text-gray-700">{{ selectedPME || 'Tous' }}</span>
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
              <div v-if="showPMEMenu" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-10 max-h-96 overflow-y-auto">
                <button
                  @click="selectPME(null)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600 font-medium': !selectedPME }"
                >
                  <span class="font-semibold">Tous</span>
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <button
                  v-for="pme in pmeList"
                  :key="pme.id"
                  @click="selectPME(pme.name)"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  :class="{ 'bg-primary-50 text-primary-600 font-medium': selectedPME === pme.name }"
                >
                  {{ pme.name }}
                </button>
              </div>
            </transition>
          </div>

          <!-- Bouton Ajouter une PME -->
          <button 
            @click="showAddPMEModal = true"
            class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-sm font-medium">Nouvelle PME</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="isLoadingStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total PME Financées -->
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Total prêts</p>
          <h3 class="text-2xl md:text-3xl font-bold text-gray-900 break-words">{{ stats.totalPMEFinancees }}</h3>
          <p class="text-xs text-gray-400 mt-1">PME bénéficiaires</p>
        </div>
      </div>

      <!-- Montant Total Prêté -->
      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Montant Total Prêté</p>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900 break-words">{{ formatCurrency(stats.montantTotalPrete) }}</h3>
          <p class="text-xs text-gray-400 mt-1">Fonds déboursés</p>
        </div>
      </div>

      <!-- Montant Remboursé -->
      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Montant Remboursé</p>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900 break-words">{{ formatCurrency(stats.montantRembourse) }}</h3>
          <p class="text-xs text-gray-400 mt-1">Fonds récupérés</p>
        </div>
      </div>

      <!-- Reste à Rembourser -->
      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-start justify-between mb-4">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
        <div>
          <p class="text-sm text-gray-500 mb-1">Reste à Rembourser</p>
          <h3 class="text-xl md:text-2xl font-bold text-gray-900 break-words">{{ formatCurrency(stats.resteARembourser) }}</h3>
          <p class="text-xs text-gray-400 mt-1">Montant en attente</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Cash Flow Chart -->
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Chiffre d’affaires</h3>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="chartView = 'monthly'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                chartView === 'monthly' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
              ]"
            >
              Mensuel
            </button>
            <button
              @click="chartView = 'yearly'"
              :class="[
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                chartView === 'yearly' ? 'bg-primary-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
              ]"
            >
              Annuel
            </button>
          </div>
        </div>

        <div v-if="isLoadingChart">
          <SkeletonLoader type="chart" />
        </div>

        <div v-else>
          <div class="mb-6">
            <div class="flex items-baseline space-x-2">
              <h2 class="text-3xl font-bold text-gray-900 break-words">{{ formatCurrency(chartTotal) }}</h2>
              <span class="flex items-center text-green-600 text-sm font-medium">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                4.8%
              </span>
            </div>
          </div>

          <!-- Cash Flow Bar Chart -->
          <div class="h-64 flex items-end justify-between space-x-2">
            <div v-for="(data, index) in cashFlowData" :key="index" class="flex-1 flex flex-col items-center group">
              <div class="w-full relative">
                <!-- Tooltip on hover -->
                <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                  <div class="font-medium">{{ data.month }}</div>
                  <div class="text-primary-400">Prêts: {{ formatCurrency(data.prets) }}</div>
                  <div class="text-green-400">Remboursements: {{ formatCurrency(data.remboursements) }}</div>
                  <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div class="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                <!-- Bar -->
                <div class="relative h-48">
                  <div class="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 group-hover:from-primary-600 group-hover:to-primary-500"
                       :style="`height: ${(data.prets / Math.max(...cashFlowData.map(d => d.prets))) * 100}%`">
                  </div>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ data.month }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations Entrepreneur -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Dirigeant PME</h3>
          <button class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        <div v-if="isLoadingCard">
          <SkeletonLoader type="card" />
        </div>

        <div v-else>
          <!-- Photo et Infos principales -->
          <div class="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-primary-50 to-primary-100 mb-4">
            <div class="flex flex-col items-center text-center">
              <!-- Photo de profil -->
              <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                <img 
                  :src="entrepreneur.photo" 
                  :alt="entrepreneur.fullName"
                  class="w-full h-full object-cover"
                >
              </div>
              
              <!-- Nom et Prénom -->
              <h4 class="text-xl font-bold text-gray-900 mb-1">{{ entrepreneur.fullName }}</h4>
              
              <!-- Nom de l'entreprise -->
              <div class="flex items-center space-x-2 mb-3">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="text-sm font-semibold text-primary-700">{{ entrepreneur.companyName }}</span>
              </div>
            </div>
          </div>

          <!-- Informations de contact -->
          <div class="space-y-3 mb-4">

            <!-- Téléphone -->
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div class="flex-shrink-0">
                <svg class="w-5 h-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-500 mb-1">Téléphone</p>
                <p class="text-sm font-medium text-gray-900">{{ entrepreneur.phone }}</p>
              </div>
            </div>

          </div>

          <!-- Progression du remboursement -->
          <div class="pt-4 border-t border-gray-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Progression du remboursement</span>
              <span class="text-sm font-bold text-primary-600">{{ entrepreneur.repaymentProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all shadow-sm relative overflow-hidden"
                :style="{ width: entrepreneur.repaymentProgress + '%' }"
              >
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-500">{{ formatCurrency(entrepreneur.amountRepaid) }} remboursé</span>
              <span class="text-xs text-gray-500">{{ formatCurrency(entrepreneur.totalLoan) }} total</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Récentes -->
    <div class="card mt-8">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Transactions Récentes</h3>
            <p class="text-sm text-gray-500 mt-1">Liste de toutes les transactions effectuées</p>
          </div>
          
          <!-- Status Filters -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 mr-2">Statut:</span>
            <button
              @click="changeFilter('all')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                withdrawalFilter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              Tous
            </button>
            <button
              @click="changeFilter('success')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                withdrawalFilter === 'success' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              Réussi
            </button>
            <button
              @click="changeFilter('failed')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                withdrawalFilter === 'failed' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              Échoué
            </button>
          </div>
        </div>
      </div>

      <div v-if="isLoadingTransactions">
        <SkeletonLoader type="table" :rows="5" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Référence</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Méthode</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="withdrawal in paginatedWithdrawals" :key="withdrawal.id" class="hover:bg-gray-50 transition-colors">
              <td class="py-4 px-4">
                <span class="text-sm font-medium text-gray-900">{{ withdrawal.reference }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600">{{ withdrawal.date }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(withdrawal.amount) }}</span>
              </td>
              <td class="py-4 px-4">
                <span class="text-sm text-gray-600">{{ withdrawal.method }}</span>
              </td>
              <td class="py-4 px-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    withdrawal.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 mr-1.5 rounded-full',
                      withdrawal.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                    ]"
                  ></span>
                  {{ withdrawal.status === 'success' ? 'Réussi' : 'Échoué' }}
                </span>
              </td>
              <td class="py-4 px-4 text-center">
                <button
                  class="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  @click="generateWithdrawalPDF(withdrawal)"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Télécharger
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div class="text-sm text-gray-500">
            Page <span class="font-medium text-gray-900">{{ currentPage }}</span> sur 
            <span class="font-medium text-gray-900">{{ totalPages }}</span>
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

    <!-- Modal Ajouter une PME -->
    <AddPMEModal 
      :show="showAddPMEModal"
      :available-p-m-es="availablePMEs"
      @close="showAddPMEModal = false"
      @pme-created="handlePMECreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '@/components/common/SkeletonLoader.vue';
import AddPMEModal from '@/components/common/AddPMEModal.vue';

const showPMEMenu = ref(false);
const showCategoryMenu = ref(false);
const selectedPME = ref(null);
const selectedCategory = ref('Toutes Catégories');
const chartView = ref('yearly');
const searchQuery = ref('');
const showAddPMEModal = ref(false);
const withdrawalFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Loading states
const isLoadingStats = ref(true);
const isLoadingChart = ref(true);
const isLoadingCard = ref(true);
const isLoadingTransactions = ref(true);

// Liste des PME pour le filtre
const pmeList = ref([
  { id: 1, name: 'TechStart Africa' },
  { id: 2, name: 'AgroBusiness Plus' },
  { id: 3, name: 'EcoPackaging' },
  { id: 4, name: 'Fashion Market CI' },
  { id: 5, name: 'EduTech Africa' },
  { id: 6, name: 'HealthCare Plus' }
]);

// PME disponibles
const availablePMEs = ref([
  {
    id: 1,
    name: 'TechStart Africa',
    sector: 'Technologie',
    requestedAmount: 120000,
    image: 'https://ui-avatars.com/api/?name=TechStart+Africa&background=6366f1&color=fff&size=128'
  },
  {
    id: 2,
    name: 'AgroBusiness Plus',
    sector: 'Agriculture',
    requestedAmount: 80000,
    image: 'https://ui-avatars.com/api/?name=AgroBusiness+Plus&background=10b981&color=fff&size=128'
  },
  {
    id: 3,
    name: 'EcoPackaging',
    sector: 'Environnement',
    requestedAmount: 60000,
    image: 'https://ui-avatars.com/api/?name=EcoPackaging&background=14b8a6&color=fff&size=128'
  },
  {
    id: 4,
    name: 'Fashion Market CI',
    sector: 'Mode & Textile',
    requestedAmount: 45000,
    image: 'https://ui-avatars.com/api/?name=Fashion+Market&background=ec4899&color=fff&size=128'
  },
  {
    id: 5,
    name: 'EduTech Africa',
    sector: 'Éducation',
    requestedAmount: 70000,
    image: 'https://ui-avatars.com/api/?name=EduTech+Africa&background=f59e0b&color=fff&size=128'
  },
  {
    id: 6,
    name: 'HealthCare Plus',
    sector: 'Santé',
    requestedAmount: 95000,
    image: 'https://ui-avatars.com/api/?name=HealthCare+Plus&background=ef4444&color=fff&size=128'
  }
]);

const stats = ref({
  totalPMEFinancees: 42,
  montantTotalPrete: 850000000,
  montantRembourse: 620000000,
  resteARembourser: 230000000
});

// Informations de l'entrepreneur
const entrepreneur = ref({
  fullName: 'Kouassi Jean-Marc',
  companyName: 'TechStart Africa',
  location: 'Abidjan, Cocody - Angré 7ème Tranche',
  phone: '+225 07 85 42 31 65',
  email: 'jeanmarc.kouassi@techstart.ci',
  photo: 'https://img.freepik.com/photos-gratuite/beau-male-adulte-posant_23-2148729713.jpg?t=st=1762262743~exp=1762266343~hmac=83d6031bf0416c57f7e96c1f135be3e904d89fa1ff474671c144b7dc100802b9&w=1480',
  totalLoan: 120000000,
  amountRepaid: 87600000,
  repaymentProgress: 73
});

const chartTotal = ref(850000000);

// Cash Flow Data
const cashFlowData = ref([
  { month: 'Jan', prets: 45000000, remboursements: 38000000 },
  { month: 'Fév', prets: 52000000, remboursements: 41000000 },
  { month: 'Mar', prets: 48000000, remboursements: 45000000 },
  { month: 'Avr', prets: 61000000, remboursements: 52000000 },
  { month: 'Mai', prets: 58000000, remboursements: 48000000 },
  { month: 'Jun', prets: 67000000, remboursements: 55000000 },
  { month: 'Jul', prets: 72000000, remboursements: 61000000 },
  { month: 'Aoû', prets: 69000000, remboursements: 58000000 },
  { month: 'Sep', prets: 75000000, remboursements: 64000000 },
  { month: 'Oct', prets: 81000000, remboursements: 70000000 },
  { month: 'Nov', prets: 78000000, remboursements: 67000000 },
  { month: 'Déc', prets: 85000000, remboursements: 72000000 }
]);

// Withdrawals Data
const withdrawals = ref([
  { 
    id: 1, 
    reference: 'WTD-2025-001', 
    date: '15 Nov 2025', 
    amount: 5000000, 
    method: 'Mobile Money',
    status: 'success',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 2, 
    reference: 'WTD-2025-002', 
    date: '12 Nov 2025', 
    amount: 3500000, 
    method: 'Virement bancaire',
    status: 'failed',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 3, 
    reference: 'WTD-2025-003', 
    date: '10 Nov 2025', 
    amount: 7500000, 
    method: 'Mobile Money',
    status: 'success',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 4, 
    reference: 'WTD-2025-004', 
    date: '08 Nov 2025', 
    amount: 2000000, 
    method: 'Virement bancaire',
    status: 'success',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 5, 
    reference: 'WTD-2025-005', 
    date: '05 Nov 2025', 
    amount: 4500000, 
    method: 'Mobile Money',
    status: 'failed',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 6, 
    reference: 'WTD-2025-006', 
    date: '03 Nov 2025', 
    amount: 6000000, 
    method: 'Mobile Money',
    status: 'success',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  },
  { 
    id: 7, 
    reference: 'WTD-2025-007', 
    date: '01 Nov 2025', 
    amount: 8500000, 
    method: 'Virement bancaire',
    status: 'success',
    userEmail: 'client@example.com',
    userPhone: '+225 07 75 13 25 86',
    userAddress: 'Abidjan, Cocody'
  }
]);

const filteredWithdrawals = computed(() => {
  let filtered = withdrawals.value;

  if (withdrawalFilter.value !== 'all') {
    filtered = filtered.filter(w => w.status === withdrawalFilter.value);
  }

  return filtered;
});

const totalFilteredItems = computed(() => filteredWithdrawals.value.length);
const totalPages = computed(() => Math.ceil(totalFilteredItems.value / itemsPerPage.value));

const paginatedWithdrawals = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredWithdrawals.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};

const selectPME = (pmeName) => {
  selectedPME.value = pmeName;
  showPMEMenu.value = false;
  console.log('PME sélectionnée:', pmeName || 'Tous');
};

const handlePMECreated = (pmeData) => {
  pmeList.value.push({
    id: pmeList.value.length + 1,
    name: pmeData.nom
  });
  
  console.log('PME créée:', pmeData);
};

const changeFilter = (filter) => {
  withdrawalFilter.value = filter;
  currentPage.value = 1;
  isLoadingTransactions.value = true;
  
  setTimeout(() => {
    isLoadingTransactions.value = false;
  }, 800);
};

const generateWithdrawalPDF = (item) => {
  console.log('Générer PDF pour:', item);
  // Ajoutez ici la logique pour générer le PDF
};

const previousPage = () => {
  if (currentPage.value > 1) {
    isLoadingTransactions.value = true;
    currentPage.value--;
    
    setTimeout(() => {
      isLoadingTransactions.value = false;
    }, 500);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    isLoadingTransactions.value = true;
    currentPage.value++;
    
    setTimeout(() => {
      isLoadingTransactions.value = false;
    }, 500);
  }
};

const goToPage = (page) => {
  isLoadingTransactions.value = true;
  currentPage.value = page;
  
  setTimeout(() => {
    isLoadingTransactions.value = false;
  }, 500);
};

onMounted(() => {
  setTimeout(() => {
    isLoadingStats.value = false;
  }, 800);
  
  setTimeout(() => {
    isLoadingChart.value = false;
  }, 1000);
  
  setTimeout(() => {
    isLoadingCard.value = false;
  }, 1200);
  
  setTimeout(() => {
    isLoadingTransactions.value = false;
  }, 1400);
});
</script>

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