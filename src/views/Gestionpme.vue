<template>
  <div class="pme-container">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Gestion des PME</h1>
          <p class="text-gray-500 mt-1">Suivez les PME financées et leur niveau de remboursement</p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-3">
          <!-- Search Bar -->
          <div class="relative">
            <input
              type="text"
              placeholder="Rechercher une PME..."
              v-model="searchQuery"
              class="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            >
            <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button @click="showAddPMEModal = true" class="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span class="text-sm font-medium"><span class="disp">Nouvelle</span> PME</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Overview with Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">Total PME Financées</p>
            <h3 class="text-3xl font-bold text-gray-900">100</h3>
          </div>
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">Remboursées</p>
            <h3 class="text-3xl font-bold text-gray-900">50</h3>
          </div>

            <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path data-v-eb77f49c="" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"></path></svg></div>

        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">Remboursement en cours</p>
            <h3 class="text-3xl font-bold text-gray-900">20</h3>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-50"><svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path data-v-eb77f49c="" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
        </div>
      </div>

      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">En retard</p>
            <h3 class="text-3xl font-bold text-gray-900">20</h3>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path data-v-eb77f49c="" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg></div>
        </div>
      </div>
    </div>

    <!-- Repayment Schedule Table -->
    <div class="card mt-8">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Échéancier des Remboursements</h3>
            <p class="text-sm text-gray-500 mt-1">Prochains paiements attendus</p>
          </div>
          
          <!-- Status Filters -->
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-600 mr-2">Statut:</span>
            <button
              @click="changeFilter('all')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                paymentFilter === 'all' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              Tous
            </button>
            <button
              @click="changeFilter('completed')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                paymentFilter === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              Terminé
            </button>
            <button
              @click="changeFilter('ongoing')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                paymentFilter === 'ongoing' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              En cours
            </button>
            <button
              @click="changeFilter('late')"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                paymentFilter === 'late' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              En retard
            </button>
          </div>
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
            <tr v-for="payment in paginatedPayments" :key="payment.id" class="hover:bg-gray-50 transition-colors">
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

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div class="text-sm text-gray-500">
            Affichage <span class="font-medium text-gray-900">{{ startItem }}</span> à 
            <span class="font-medium text-gray-900">{{ endItem }}</span> sur 
            <span class="font-medium text-gray-900">{{ totalFilteredItems }}</span> résultats
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
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import AddPMEModal from '@/components/common/AddPMEModal.vue';

const searchQuery = ref('');
const isLoading = ref(true);
const isLoadingTable = ref(true);
const paymentFilter = ref('all');
const activeActionMenu = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(5);
const showAddPMEModal = ref(false);

// Stats
const totalPMEs = ref(12);
const totalLent = ref(485000);
const totalRepaid = ref(328500);
const recoveryRate = computed(() => ((totalRepaid.value / totalLent.value) * 100).toFixed(1));

// PME Data
const pmes = ref([
  {
    id: 1,
    name: 'TechStart CI',
    sector: 'Technologie',
    loanAmount: 50000,
    repaidAmount: 42500,
    repaymentProgress: 85,
    status: 'En cours',
    dueDate: '15 Déc, 2025',
    contact: 'Kouassi Jean',
    phone: '+225 07 XX XX XX XX'
  },
  {
    id: 2,
    name: 'AgroBusiness Plus',
    sector: 'Agriculture',
    loanAmount: 80000,
    repaidAmount: 80000,
    repaymentProgress: 100,
    status: 'Soldé',
    dueDate: '10 Nov, 2025',
    contact: 'Traoré Aminata',
    phone: '+225 05 XX XX XX XX'
  },
  {
    id: 3,
    name: 'EcoPackaging',
    sector: 'Environnement',
    loanAmount: 60000,
    repaidAmount: 45000,
    repaymentProgress: 75,
    status: 'En cours',
    dueDate: '20 Jan, 2026',
    contact: 'Bamba Seydou',
    phone: '+225 01 XX XX XX XX'
  },
  {
    id: 4,
    name: 'Fashion Market CI',
    sector: 'Mode & Textile',
    loanAmount: 45000,
    repaidAmount: 15000,
    repaymentProgress: 33,
    status: 'Retard',
    dueDate: '05 Nov, 2025',
    contact: 'Koné Mariam',
    phone: '+225 07 XX XX XX XX'
  },
  {
    id: 5,
    name: 'EduTech Africa',
    sector: 'Éducation',
    loanAmount: 70000,
    repaidAmount: 35000,
    repaymentProgress: 50,
    status: 'En cours',
    dueDate: '28 Déc, 2025',
    contact: 'Diabaté Ibrahim',
    phone: '+225 05 XX XX XX XX'
  },
  {
    id: 6,
    name: 'HealthCare Plus',
    sector: 'Santé',
    loanAmount: 95000,
    repaidAmount: 57000,
    repaymentProgress: 60,
    status: 'En cours',
    dueDate: '15 Fév, 2026',
    contact: 'Dr. Yao Marie',
    phone: '+225 01 XX XX XX XX'
  },
  {
    id: 7,
    name: 'Logistics Express',
    sector: 'Transport',
    loanAmount: 55000,
    repaidAmount: 41250,
    repaymentProgress: 75,
    status: 'En cours',
    dueDate: '08 Jan, 2026',
    contact: 'Konaté Oumar',
    phone: '+225 07 XX XX XX XX'
  },
  {
    id: 8,
    name: 'BioFood CI',
    sector: 'Alimentation',
    loanAmount: 30000,
    repaidAmount: 12000,
    repaymentProgress: 40,
    status: 'Attention',
    dueDate: '12 Déc, 2025',
    contact: 'Coulibaly Fatou',
    phone: '+225 05 XX XX XX XX'
  }
]);

// Upcoming Payments avec progression
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
  },
  {
    id: 6,
    pmeName: 'AgroBusiness Plus',
    sector: 'Agriculture',
    amount: 20000,
    dueDate: '10 Nov, 2025',
    paymentStatus: 'Terminé',
    daysRemaining: 0,
    progress: 100
  },
  {
    id: 7,
    pmeName: 'HealthCare Plus',
    sector: 'Santé',
    amount: 19000,
    dueDate: '15 Fév, 2026',
    paymentStatus: 'À venir',
    daysRemaining: 107,
    progress: 60
  },
  {
    id: 8,
    pmeName: 'EcoPackaging',
    sector: 'Environnement',
    amount: 15000,
    dueDate: '20 Jan, 2026',
    paymentStatus: 'En cours',
    daysRemaining: 81,
    progress: 75
  },
  {
    id: 9,
    pmeName: 'Fashion Market CI',
    sector: 'Mode & Textile',
    amount: 11250,
    dueDate: '28 Jan, 2026',
    paymentStatus: 'À venir',
    daysRemaining: 89,
    progress: 33
  },
  {
    id: 10,
    pmeName: 'TechStart CI',
    sector: 'Technologie',
    amount: 7500,
    dueDate: '05 Fév, 2026',
    paymentStatus: 'À venir',
    daysRemaining: 97,
    progress: 85
  }
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

const filteredPMEs = computed(() => {
  if (!searchQuery.value) return pmes.value;
  return pmes.value.filter(pme =>
    pme.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    pme.sector.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredPayments = computed(() => {
  let filtered = upcomingPayments.value;

  // Filter by status
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

// Pagination computed properties
const totalFilteredItems = computed(() => filteredPayments.value.length);
const totalPages = computed(() => Math.ceil(totalFilteredItems.value / itemsPerPage.value));
const startItem = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalFilteredItems.value));

const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPayments.value.slice(start, end);
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

const changeFilter = (filter) => {
  paymentFilter.value = filter;
  currentPage.value = 1; // Reset to first page
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
  console.log('Viewing details for:', payment.pmeName);
  alert(`Détails de ${payment.pmeName}\nMontant: ${formatCurrency(payment.amount)}\nProgression: ${payment.progress}%`);
  activeActionMenu.value = null;
};

const sendReminder = (payment) => {
  console.log('Sending reminder for:', payment.pmeName);
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

const previousPage = () => {
  if (currentPage.value > 1) {
    isLoadingTable.value = true;
    currentPage.value--;
    
    setTimeout(() => {
      isLoadingTable.value = false;
    }, 500);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    isLoadingTable.value = true;
    currentPage.value++;
    
    setTimeout(() => {
      isLoadingTable.value = false;
    }, 500);
  }
};

const goToPage = (page) => {
  isLoadingTable.value = true;
  currentPage.value = page;
  
  setTimeout(() => {
    isLoadingTable.value = false;
  }, 500);
};

// Close dropdown when clicking outside
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 1200);

  // ⚠️ AJOUTÉ: Désactiver le loading du tableau après 1.2s
  setTimeout(() => {
    isLoadingTable.value = false;
  }, 1200);

  document.addEventListener('click', () => {
    activeActionMenu.value = null;
  });
});
</script>

<style scoped>

@media only screen and (max-width :930px){
  .disp{
    display: none;
  }
}
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