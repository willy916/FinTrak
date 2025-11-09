<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import jsPDF from 'jspdf';
import logofacture from '../assets/img/logo-waretrack.png';

const isLoading = ref(true);
const isLoadingTable = ref(true);
const withdrawalFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(5);

// Data
const netAmount = ref(18248.44);
const revenue = ref(45230.00);
const withdrawnAmount = ref(28560.00); // Montant retiré
const remainingAmount = ref(15340.00); // Montant restant

// Withdrawals Data
const withdrawals = ref([
  { 
    id: 1, 
    reference: 'WTD-2025-001', 
    date: '15 Nov 2025', 
    amount: 5000.00, 
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
    amount: 3500.00, 
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
    amount: 7500.00, 
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
    amount: 2000.00, 
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
    amount: 4500.00, 
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
    amount: 6000.00, 
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
    amount: 8500.00, 
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

// Methods
const formatNumber = (num) => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

const changeFilter = (filter) => {
  withdrawalFilter.value = filter;
  currentPage.value = 1;
  isLoadingTable.value = true;
  
  setTimeout(() => {
    isLoadingTable.value = false;
  }, 800);
};

const generateWithdrawalPDF = async (item) => {
  try {
    const doc = new jsPDF();

    // ✅ Logo Waretrack
    const logoUrl = logofacture;
    try {
      const img = new Image();
      img.src = logoUrl;
      img.crossOrigin = 'Anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load logo image'));
      });
      doc.addImage(img, 'PNG', 20, 10, 70, 20);
    } catch (error) {
      console.error('Error loading logo:', error);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text('Logo not available', 20, 15);
    }

    // ✅ Société Waretrack
    let yLeft = 38;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('Waretrack', 20, yLeft);
    doc.setFont('helvetica', 'normal');
    yLeft += 5;
    doc.text('Abidjan Cocody, Angré', 20, yLeft);
    yLeft += 5;
    doc.text('contact@eso-dev.com', 20, yLeft);
    yLeft += 5;
    doc.text('(+225) 07 75 13 25 86', 20, yLeft);

    // ✅ Titre FACTURE RETRAIT à droite
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 115, 23);
    doc.setFont('helvetica', 'normal');

    // ✅ Infos facture à droite
    const invoiceNumber = item.reference;
    const invoiceDate = formatDate(item.date);
    const rightX = 115;
    let yRight = 30;
    doc.setFontSize(10);
    doc.text(`Numéro facture : ${invoiceNumber}`, rightX, yRight);
    yRight += 5;
    doc.text(`Date: ${invoiceDate}`, rightX, yRight);
    yRight += 5;
    doc.text(`Montant : ${item.amount.toFixed(2)} F CFA`, rightX, yRight);

    // ✅ Badge statut (PAYÉ ou ÉCHOUÉ)
    yRight += 10;
    if (item.status === 'success') {
      doc.setFillColor(34, 197, 94);
      doc.setTextColor(255);
      doc.rect(rightX, 43, 20, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYÉ', rightX + 3, 42 + 6);
    } else {
      doc.setFillColor(220, 53, 69);
      doc.setTextColor(255);
      doc.rect(rightX, 43, 25, 8, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ÉCHOUÉ', rightX + 3, 42 + 6);
    }

    // ✅ Trait sous infos facture
    yRight += 5;
    doc.setDrawColor(200);
    doc.line(rightX, yRight, rightX + 60, yRight);

    // ✅ RETRAIT à droite
    yRight += 7;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RETRAIT', rightX, yRight);
    yRight += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Méthode : ${item.method}`, rightX, yRight);
    yRight += 5;
    doc.text(`Référence : ${item.reference}`, rightX, yRight);
    yRight += 5;
    doc.text(`Statut : ${item.status === 'success' ? 'Réussi' : 'Échoué'}`, rightX, yRight);

    // ✅ FACTURÉ À à gauche
    let yBill = yLeft + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À', 20, yBill);
    doc.setFont('helvetica', 'normal');
    yBill += 5;
    doc.text('Client Waretrack', 20, yBill);
    yBill += 5;
    doc.text(item.userAddress, 20, yBill);
    yBill += 5;
    doc.text(item.userPhone, 20, yBill);
    yBill += 5;
    doc.text(item.userEmail, 20, yBill);

    // ✅ Tableau produit
    yBill += 15;
    doc.setDrawColor(200);
    doc.line(20, yBill, 190, yBill);
    yBill += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPTION', 20, yBill);
    doc.text('UNITÉS', 120, yBill);
    doc.text('MONTANT (F CFA)', 150, yBill);

    // ✅ Ligne en dessous des en-têtes
    yBill += 2;
    doc.line(20, yBill, 190, yBill);

    // ✅ Contenu produit
    yBill += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RETRAIT ${item.reference}`, 20, yBill);
    doc.text('1', 120, yBill);
    doc.text(`${item.amount.toFixed(2)}`, 150, yBill);

    // ✅ Total
    yBill += 10;
    doc.line(20, yBill, 190, yBill);
    yBill += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total', 130, yBill);
    doc.text(`${item.amount.toFixed(2)}`, 150, yBill);

    // ✅ Paiements
    yBill += 7;
    doc.setFont('helvetica', 'normal');
    doc.text('Paiements', 123, yBill);
    doc.text(`${item.status === 'success' ? item.amount.toFixed(2) : '0.00'}`, 150, yBill);

    // ✅ Trait entre Payments et Montant dû
    yBill += 5;
    doc.line(20, yBill, 190, yBill);

    // ✅ Montant dû
    yBill += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Montant dû (F CFA)', 100, yBill);
    doc.text(item.status === 'success' ? '0,00' : item.amount.toFixed(2), 150, yBill);

    // ✅ Note de paiement
    yBill += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (item.status === 'success') {
      const paidAmount = `${item.amount.toFixed(2)} F CFA`;
      const paidText = `${paidAmount} payé le ${formatDate(item.date)} via ${item.method}.`;
      const paidParts = paidText.split(paidAmount);
      doc.text(paidParts[0], 20, yBill);
      doc.setFont('helvetica', 'bold');
      const paidX = doc.getTextWidth(paidParts[0]) + 20;
      doc.text(paidAmount, paidX, yBill);
      doc.setFont('helvetica', 'normal');
      doc.text(paidParts[1].replace('        ', '  '), paidX + doc.getTextWidth(paidAmount), yBill);
    } else {
      doc.setTextColor(220, 53, 69);
      doc.text(`Transaction échouée le ${formatDate(item.date)}. Aucun montant n'a été débité.`, 20, yBill);
    }

    // ✅ Footer
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Merci pour votre confiance.', 60, 210);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text('Pour toute information, veuillez nous contacter au +2250575132586 ', 65, 215);
    doc.text('ou rendez-vous sur le site : sites.waretrack.online.', 74, 220);

    // ✅ Génération
    doc.save(`Facture_Retrait_${item.reference}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Erreur lors de la génération du PDF');
  }
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

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false;
  }, 1200);

  setTimeout(() => {
    isLoadingTable.value = false;
  }, 1200);
});
</script>

<template>
  <div class="wallet-container">
    <!-- Premium Banner -->
    <div v-if="isLoading">
      <SkeletonLoader type="card" />
    </div>
    <div v-else class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6 relative overflow-hidden animate-slide-in-up shadow-xl">
      <!-- Decorative Elements -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full -ml-24 -mb-24"></div>
      <div class="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-500/5 rounded-full"></div>
      
      <!-- Animated gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

      <div class="relative z-10">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-white/60 text-xs font-medium mb-0.5">Montant Net à Verser</h3>
                <p class="text-white/40 text-xs">Disponible pour retrait immédiat</p>
              </div>
            </div>
            <h2 class="text-5xl font-bold text-white mb-6 tracking-tight">${{ formatNumber(netAmount) }}</h2>
            <div class="flex items-center space-x-3">
              <button class="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold hover:scale-105 transform shadow-lg text-sm">
                <svg class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Effectuer un retrait</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
      <SkeletonLoader type="stat" v-for="i in 3" :key="i" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- Chiffre d'affaire -->
      <div class="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer animate-slide-in-up relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-12 -mt-12"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="px-2.5 py-1 bg-blue-50 rounded-full">
              <span class="text-blue-600 text-xs font-bold">+12.5%</span>
            </div>
          </div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Chiffre d'affaire</p>
          <h2 class="text-3xl font-bold text-gray-900 mb-0.5">${{ formatNumber(revenue) }}</h2>
          <p class="text-xs text-gray-400">vs mois dernier</p>
        </div>
      </div>

      <!-- Montant Retiré -->
      <div class="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer animate-slide-in-up animate-delay-100 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-transparent rounded-full -mr-12 -mt-12"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div class="px-2.5 py-1 bg-orange-50 rounded-full">
              <span class="text-orange-600 text-xs font-bold">+18.2%</span>
            </div>
          </div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Montant Retiré</p>
          <h2 class="text-3xl font-bold text-gray-900 mb-0.5">${{ formatNumber(withdrawnAmount) }}</h2>
          <p class="text-xs text-gray-400">Total des retraits</p>
        </div>
      </div>

      <!-- Montant Restant -->
      <div class="group bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer animate-slide-in-up animate-delay-200 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-full -mr-12 -mt-12"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div class="px-2.5 py-1 bg-purple-50 rounded-full">
              <span class="text-purple-600 text-xs font-bold">+24.7%</span>
            </div>
          </div>
          <p class="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Montant Restant</p>
          <h2 class="text-3xl font-bold text-gray-900 mb-0.5">${{ formatNumber(remainingAmount) }}</h2>
          <p class="text-xs text-gray-400">Solde disponible</p>
        </div>
      </div>
    </div>

    <!-- Historique des Retraits -->
    <div class="card mt-8">
      <div class="mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="mb-4 md:mb-0">
            <h3 class="text-lg font-bold text-gray-900">Historique des Retraits</h3>
            <p class="text-sm text-gray-500 mt-1">Liste de tous vos retraits effectués</p>
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

      <div v-if="isLoadingTable">
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
                <span class="text-sm font-semibold text-gray-900">${{ formatNumber(withdrawal.amount) }}</span>
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