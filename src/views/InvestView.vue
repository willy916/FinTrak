<template>
  <div class="invest-container">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Opportunités d'Investissement</h1>
          <p class="text-gray-500 mt-1">Découvrez les PME à la recherche de financement</p>
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

          <!-- Filter Button -->
          <div class="relative">
            <button
              @click="showFilterMenu = !showFilterMenu"
              class="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span class="text-sm font-medium text-gray-700">Filtrer</span>
              <span v-if="activeFilter !== 'Tous'" class="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {{ activeFilter === 'Demandes ciblées' ? 'Ciblées' : 'Générales' }}
              </span>
            </button>

            <!-- Filter Dropdown -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="showFilterMenu" class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-custom-lg border border-gray-100 py-1 z-10">
                <button
                  v-for="option in filterOptions"
                  :key="option.value"
                  @click="filterBy(option.value)"
                  class="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                  :class="activeFilter === option.value ? 'bg-primary-50' : ''"
                >
                  <div>
                    <div class="font-medium" :class="activeFilter === option.value ? 'text-primary-700' : 'text-gray-700'">
                      {{ option.label }}
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">{{ option.description }}</div>
                  </div>
                  <svg v-if="activeFilter === option.value" class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Filter Display -->
    <div v-if="activeFilter !== 'Tous'" class="mb-6 flex items-center space-x-2">
      <div class="inline-flex items-center px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg">
        <svg class="w-4 h-4 text-primary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-medium text-primary-700">{{ activeFilter }}</span>
        <button
          @click="filterBy('Tous')"
          class="ml-2 text-primary-600 hover:text-primary-800"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Stats Cards with Skeleton -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <!-- Total Demandes -->
      <div class="card card-hover animate-slide-in-up">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm mb-1">Total Demandes</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ totalRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Demandes Ciblées -->
      <div class="card card-hover animate-slide-in-up animate-delay-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm mb-1">Demandes Ciblées</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ targetedRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Demandes Générales -->
      <div class="card card-hover animate-slide-in-up animate-delay-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm mb-1">Demandes Générales</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ generalRequests }}</h3>
          </div>
          <div class="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Montant Total -->
      <div class="card card-hover animate-slide-in-up animate-delay-300">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-600 text-sm mb-1">Montant Total</p>
            <h3 class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalAmount) }}</h3>
          </div>
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- PME Cards Grid with Skeleton -->
    <div v-if="isLoadingCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card-with-image" v-for="i in 6" :key="i" />
    </div>

    <div v-else-if="paginatedPMEs.length === 0" class="text-center py-16">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune PME trouvée</h3>
      <p class="text-gray-500">Essayez de modifier vos filtres ou votre recherche</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="pme in paginatedPMEs"
        :key="pme.id"
        class="card card-hover animate-slide-in-up group cursor-pointer"
        @click="viewPMEDetails(pme)"
      >
        <!-- PME Header with Image -->
        <div class="mb-4">
          <!-- PME Image -->
          <div class="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4 overflow-hidden">
            <img 
              :src="pme.image" 
              :alt="pme.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <!-- PME Info -->
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {{ pme.name.charAt(0) }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {{ pme.name }}
                </h3>
                <p class="text-xs text-gray-500">{{ pme.sector }}</p>
              </div>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                pme.requestType === 'targeted' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              ]"
            >
              {{ pme.requestType === 'targeted' ? 'Ciblée' : 'Générale' }}
            </span>
          </div>
        </div>

        <!-- PME Description -->
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">
          {{ pme.description }}
        </p>

        <!-- PME Stats -->
        <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p class="text-xs text-gray-500 mb-1">Montant demandé</p>
            <p class="text-sm font-bold text-gray-900">{{ formatCurrency(pme.requestedAmount) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">ROI Estimé</p>
            <p class="text-sm font-bold text-green-600">{{ pme.estimatedROI }}%</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Durée</p>
            <p class="text-sm font-semibold text-gray-900">{{ pme.duration }} mois</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Employés</p>
            <p class="text-sm font-semibold text-gray-900">{{ pme.employees }}</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-600">Financement collecté</span>
            <span class="text-xs font-medium text-gray-900">{{ pme.fundingProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
              :style="{ width: pme.fundingProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-2">
          <button
            @click.stop="viewPMEDetails(pme)"
            class="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Voir le profil
          </button>
          <button
            @click.stop="addToWatchlist(pme)"
            class="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            :class="pme.inWatchlist ? 'bg-primary-50 border-primary-200' : ''"
          >
            <svg class="w-5 h-5" :class="pme.inWatchlist ? 'text-primary-600' : 'text-gray-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="!isLoadingCards && filteredPMEs.length > 0" class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
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

    <!-- PME Details Modal Component -->
    <PMEDetailsModal
      :pme="selectedPME"
      @close="closePMEDetails"
      @invest="investInPME"
      @request-info="requestMoreInfo"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import PMEDetailsModal from '../components/common/PMEProfileModal.vue';

const isLoading = ref(true);
const isLoadingCards = ref(true);
const showFilterMenu = ref(false);
const selectedPME = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(6);
const activeFilter = ref('Tous');

// Filter options
const filterOptions = [
  { 
    value: 'Tous', 
    label: 'Tous', 
    description: 'Toutes les demandes' 
  },
  { 
    value: 'Demandes ciblées', 
    label: 'Demandes ciblées', 
    description: 'PME ciblant votre microfinance' 
  },
  { 
    value: 'Demandes générales', 
    label: 'Demandes générales', 
    description: 'Visibles par toutes les microfinances' 
  }
];

// Stats - Calculs dynamiques basés sur les données
const totalRequests = computed(() => pmes.value.length);
const targetedRequests = computed(() => pmes.value.filter(pme => pme.requestType === 'targeted').length);
const generalRequests = computed(() => pmes.value.filter(pme => pme.requestType === 'general').length);
const totalAmount = computed(() => pmes.value.reduce((sum, pme) => sum + pme.requestedAmount, 0));

// PME Data with requestType property
const pmes = ref([
  {
    id: 1,
    name: 'TechStart CI',
    sector: 'Technologie',
    requestType: 'targeted', // targeted ou general
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
    description: 'Startup innovante spécialisée dans le développement de solutions mobiles pour PME africaines.',
    fullDescription: 'TechStart CI est une entreprise technologique en pleine croissance qui développe des solutions mobiles innovantes pour les petites et moyennes entreprises africaines. Nous avons déjà conquis le marché ivoirien avec plus de 500 clients actifs et cherchons à nous étendre dans la sous-région.',
    businessModel: 'Modèle SaaS avec abonnement mensuel. Revenus récurrents avec un taux de rétention de 85%. Trois niveaux de tarification adaptés aux différentes tailles d\'entreprises.',
    requestedAmount: 50000,
    estimatedROI: 15,
    duration: 24,
    employees: 12,
    fundingProgress: 65,
    urgency: 'Medium',
    inWatchlist: false,
    projections: {
      year1: 120000,
      year2: 250000,
      year3: 450000
    },
    contact: {
      name: 'Kouassi Jean',
      email: 'j.kouassi@techstart.ci',
      phone: '+225 07 XX XX XX XX'
    }
  },
  {
    id: 2,
    name: 'AgroBusiness Plus',
    sector: 'Agriculture',
    requestType: 'general',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&h=600&fit=crop',
    description: 'Exploitation agricole moderne spécialisée dans la culture du cacao et production de dérivés.',
    fullDescription: 'AgroBusiness Plus transforme l\'agriculture ivoirienne en exploitant 50 hectares de cacaoyers avec des techniques modernes. Nous produisons également des dérivés du cacao (beurre, poudre) pour les marchés locaux et internationaux.',
    businessModel: 'Vente directe aux transformateurs et exportateurs. Contrats d\'approvisionnement à long terme avec des chocolatiers européens. Diversification dans les produits transformés à haute valeur ajoutée.',
    requestedAmount: 80000,
    estimatedROI: 18,
    duration: 36,
    employees: 45,
    fundingProgress: 42,
    urgency: 'High',
    inWatchlist: true,
    projections: {
      year1: 180000,
      year2: 320000,
      year3: 550000
    },
    contact: {
      name: 'Traoré Aminata',
      email: 'a.traore@agrobusiness.ci',
      phone: '+225 05 XX XX XX XX'
    }
  },
  {
    id: 3,
    name: 'EcoPackaging',
    sector: 'Environnement',
    requestType: 'targeted',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=600&fit=crop',
    description: 'Production d\'emballages biodégradables à partir de matériaux recyclés locaux.',
    fullDescription: 'EcoPackaging révolutionne l\'industrie de l\'emballage en Côte d\'Ivoire en produisant des alternatives écologiques aux plastiques. Nous utilisons des matériaux locaux comme les feuilles de bananier et les fibres de coco.',
    businessModel: 'B2B principalement, fourniture aux supermarchés, restaurants et entreprises agroalimentaires. Contracts annuels avec marge de 40% sur les produits finis.',
    requestedAmount: 60000,
    estimatedROI: 14,
    duration: 30,
    employees: 28,
    fundingProgress: 78,
    urgency: 'Low',
    inWatchlist: false,
    projections: {
      year1: 150000,
      year2: 280000,
      year3: 480000
    },
    contact: {
      name: 'Bamba Seydou',
      email: 's.bamba@ecopackaging.ci',
      phone: '+225 01 XX XX XX XX'
    }
  },
  {
    id: 4,
    name: 'Fashion Market CI',
    sector: 'Mode & Textile',
    requestType: 'general',
    image: 'https://images.unsplash.com/photo-1688561808434-886a6dd97b8c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170',
    description: 'Plateforme e-commerce pour créateurs de mode africains avec atelier de production.',
    fullDescription: 'Fashion Market CI connecte les créateurs de mode ivoiriens aux consommateurs via une plateforme e-commerce moderne. Nous gérons également un atelier de production qui aide les designers à passer du prototype à la production en série.',
    businessModel: 'Commission de 15% sur chaque vente + services de production. Abonnement premium pour les designers avec services additionnels. Revenus publicitaires des marques internationales.',
    requestedAmount: 45000,
    estimatedROI: 16,
    duration: 18,
    employees: 18,
    fundingProgress: 55,
    urgency: 'Medium',
    inWatchlist: false,
    projections: {
      year1: 100000,
      year2: 220000,
      year3: 400000
    },
    contact: {
      name: 'Koné Mariam',
      email: 'm.kone@fashionmarket.ci',
      phone: '+225 07 XX XX XX XX'
    }
  },
  {
    id: 5,
    name: 'EduTech Africa',
    sector: 'Éducation',
    requestType: 'targeted',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop',
    description: 'Plateforme d\'apprentissage en ligne proposant des cours certifiants adaptés au marché africain.',
    fullDescription: 'EduTech Africa démocratise l\'accès à l\'éducation de qualité en Afrique. Notre plateforme propose des cours en français dans des domaines demandés : informatique, marketing digital, comptabilité, langues. Plus de 5000 étudiants actifs.',
    businessModel: 'Abonnements mensuels et annuels. Partenariats avec entreprises pour la formation de leurs employés. Certification payante en fin de parcours. Taux de conversion de 8%.',
    requestedAmount: 70000,
    estimatedROI: 20,
    duration: 24,
    employees: 22,
    fundingProgress: 38,
    urgency: 'High',
    inWatchlist: true,
    projections: {
      year1: 160000,
      year2: 350000,
      year3: 620000
    },
    contact: {
      name: 'Diabaté Ibrahim',
      email: 'i.diabate@edutech.ci',
      phone: '+225 05 XX XX XX XX'
    }
  },
  {
    id: 6,
    name: 'HealthCare Plus',
    sector: 'Santé',
    requestType: 'general',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
    description: 'Réseau de pharmacies modernes avec service de téléconsultation médicale.',
    fullDescription: 'HealthCare Plus révolutionne l\'accès aux soins en Côte d\'Ivoire. Nous gérons 8 pharmacies modernes à Abidjan et proposons un service de téléconsultation avec des médecins qualifiés. Livraison de médicaments en moins de 2 heures.',
    businessModel: 'Vente de médicaments avec marge standard + abonnement téléconsultation. Partenariats avec assurances santé. Service premium pour entreprises avec pharmacie d\'entreprise.',
    requestedAmount: 95000,
    estimatedROI: 17,
    duration: 30,
    employees: 52,
    fundingProgress: 48,
    urgency: 'Medium',
    inWatchlist: false,
    projections: {
      year1: 220000,
      year2: 420000,
      year3: 720000
    },
    contact: {
      name: 'Dr. Yao Marie',
      email: 'm.yao@healthcareplus.ci',
      phone: '+225 01 XX XX XX XX'
    }
  },
  {
    id: 7,
    name: 'Green Energy CI',
    sector: 'Énergie Renouvelable',
    requestType: 'targeted',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop',
    description: 'Installation et maintenance de panneaux solaires pour entreprises et particuliers.',
    fullDescription: 'Green Energy CI propose des solutions d\'énergie solaire clé en main. Nous avons installé plus de 200 systèmes solaires en Côte d\'Ivoire avec un taux de satisfaction de 95%.',
    businessModel: 'Vente et installation de panneaux + contrats de maintenance annuels. Financement facilité pour les clients.',
    requestedAmount: 65000,
    estimatedROI: 16,
    duration: 28,
    employees: 18,
    fundingProgress: 52,
    urgency: 'Medium',
    inWatchlist: false,
    projections: {
      year1: 140000,
      year2: 270000,
      year3: 460000
    },
    contact: {
      name: 'N\'Guessan Paul',
      email: 'p.nguessan@greenenergy.ci',
      phone: '+225 07 XX XX XX XX'
    }
  },
  {
    id: 8,
    name: 'Food Delivery CI',
    sector: 'Restauration',
    requestType: 'general',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=600&fit=crop',
    description: 'Plateforme de livraison de repas connectant restaurants locaux et consommateurs.',
    fullDescription: 'Food Delivery CI digitalise la restauration en Côte d\'Ivoire. Plus de 150 restaurants partenaires et 10,000 utilisateurs actifs sur notre plateforme.',
    businessModel: 'Commission de 20% sur chaque commande + frais de livraison. Abonnement premium pour les restaurants.',
    requestedAmount: 55000,
    estimatedROI: 19,
    duration: 20,
    employees: 35,
    fundingProgress: 68,
    urgency: 'Low',
    inWatchlist: false,
    projections: {
      year1: 130000,
      year2: 280000,
      year3: 500000
    },
    contact: {
      name: 'Yao Koffi',
      email: 'k.yao@fooddelivery.ci',
      phone: '+225 05 XX XX XX XX'
    }
  },
  {
    id: 9,
    name: 'BioFarm CI',
    sector: 'Agriculture Biologique',
    requestType: 'targeted',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop',
    description: 'Production et distribution de légumes biologiques cultivés localement.',
    fullDescription: 'BioFarm CI promeut l\'agriculture biologique en Côte d\'Ivoire. 20 hectares de cultures certifiées bio, distribution dans 15 supermarchés premium.',
    businessModel: 'Vente directe B2B aux supermarchés et restaurants + paniers hebdomadaires pour particuliers.',
    requestedAmount: 72000,
    estimatedROI: 14,
    duration: 32,
    employees: 28,
    fundingProgress: 35,
    urgency: 'High',
    inWatchlist: true,
    projections: {
      year1: 155000,
      year2: 290000,
      year3: 485000
    },
    contact: {
      name: 'Diomandé Fatou',
      email: 'f.diomande@biofarm.ci',
      phone: '+225 01 XX XX XX XX'
    }
  }
]);

// Filtered PMEs based on search and active filter
const filteredPMEs = computed(() => {
  let filtered = pmes.value;

  // Apply filter type
  if (activeFilter.value === 'Demandes ciblées') {
    filtered = filtered.filter(pme => pme.requestType === 'targeted');
  } else if (activeFilter.value === 'Demandes générales') {
    filtered = filtered.filter(pme => pme.requestType === 'general');
  }
  // If 'Tous', no filtering by type

  // Apply search query
  if (searchQuery.value) {
    filtered = filtered.filter(pme =>
      pme.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      pme.sector.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      pme.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  return filtered;
});

// Pagination computed properties
const totalFilteredItems = computed(() => filteredPMEs.value.length);
const totalPages = computed(() => Math.ceil(totalFilteredItems.value / itemsPerPage.value));
const startItem = computed(() => {
  if (totalFilteredItems.value === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalFilteredItems.value));

const paginatedPMEs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredPMEs.value.slice(start, end);
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

const filterBy = (option) => {
  showFilterMenu.value = false;
  activeFilter.value = option;
  currentPage.value = 1; // Reset to first page when filter changes
  
  // Simulate loading
  isLoadingCards.value = true;
  setTimeout(() => {
    isLoadingCards.value = false;
  }, 400);
};

const viewPMEDetails = (pme) => {
  selectedPME.value = pme;
};

const closePMEDetails = () => {
  selectedPME.value = null;
};

const addToWatchlist = (pme) => {
  pme.inWatchlist = !pme.inWatchlist;
  console.log('Watchlist toggled for:', pme.name);
};

const investInPME = (pme) => {
  console.log('Investing in:', pme.name);
  alert(`Processus d'investissement démarré pour ${pme.name}`);
};

const requestMoreInfo = (pme) => {
  console.log('Requesting more info for:', pme.name);
  alert(`Demande d'informations envoyée à ${pme.name}`);
};

const previousPage = () => {
  if (currentPage.value > 1) {
    isLoadingCards.value = true;
    currentPage.value--;
    
    setTimeout(() => {
      isLoadingCards.value = false;
    }, 500);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    isLoadingCards.value = true;
    currentPage.value++;
    
    setTimeout(() => {
      isLoadingCards.value = false;
    }, 500);
  }
};

const goToPage = (page) => {
  isLoadingCards.value = true;
  currentPage.value = page;
  
  setTimeout(() => {
    isLoadingCards.value = false;
  }, 500);
};

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
    isLoadingCards.value = false;
  }, 1200);
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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