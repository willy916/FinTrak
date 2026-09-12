<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '@/components/common/SkeletonLoader.vue';
import { getProfile, addProduct, updateProduct, deleteProduct } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import { formatCurrency, formatDate, formatKyc } from '@/utils/format';
import iconProduct from '@/assets/img/product.png';

const isLoading = ref(true);
const errorMessage = ref('');
const infoMessage = ref('');

const profile = ref(null);
const products = computed(() => profile.value?.products || []);

async function loadProfile() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    profile.value = await getProfile();
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}

/* ─────────────── Formulaire d'ajout / modification ─────────────── */
const showProductForm = ref(false);
const editingProductId = ref(null);
const savingProduct = ref(false);
const productError = ref('');
const deletingId = ref(null);

const emptyProduct = () => ({
  productType: 'LOAN',
  title: '',
  description: '',
  minScoreRequired: '',
  minMonthlyRevenue: '',
  minHistoryMonths: '',
  requiredKycLevel: '',
  legalFormAllowed: '',
  minBalanceRequired: '',
  minAmount: '',
  maxAmount: '',
  indicativeRateMin: '',
  indicativeRateMax: '',
  durationMonthsMin: '',
  durationMonthsMax: '',
  ctaLabel: '',
  ctaUrl: '',
  icon: '',
  validUntil: '',
  isActive: true,
  sortOrder: '',
});

const productForm = ref(emptyProduct());

const productTypes = [
  { value: 'LOAN', label: 'Prêt' },
  { value: 'LINE_OF_CREDIT', label: 'Ligne de crédit' },
  { value: 'LEASING', label: 'Leasing' },
  { value: 'OVERDRAFT', label: 'Découvert' },
  { value: 'SAVINGS', label: 'Épargne' },
  { value: 'OTHER', label: 'Autre' },
];

const kycLevels = ['', 'BASIC', 'STANDARD', 'FULL', 'ENHANCED'];

function openNewProduct() {
  editingProductId.value = null;
  productForm.value = emptyProduct();
  productError.value = '';
  showProductForm.value = true;
}

function openEditProduct(product) {
  editingProductId.value = product.id;
  productForm.value = {
    ...emptyProduct(),
    ...Object.fromEntries(Object.entries(product).map(([k, v]) => [k, v ?? ''])),
    validUntil: product.validUntil ? String(product.validUntil).split('T')[0] : '',
  };
  productError.value = '';
  showProductForm.value = true;
}

/** Convertit les champs vides en undefined pour ne pas envoyer de chaînes vides au backend. */
function buildProductPayload() {
  const f = productForm.value;
  const num = (v) => (v === '' || v === null ? undefined : Number(v));
  const str = (v) => (v === '' || v === null ? undefined : v);

  return {
    productType: f.productType,
    title: f.title,
    description: str(f.description),
    minScoreRequired: num(f.minScoreRequired),
    minMonthlyRevenue: num(f.minMonthlyRevenue),
    minHistoryMonths: num(f.minHistoryMonths),
    requiredKycLevel: str(f.requiredKycLevel),
    legalFormAllowed: str(f.legalFormAllowed),
    minBalanceRequired: num(f.minBalanceRequired),
    minAmount: num(f.minAmount),
    maxAmount: num(f.maxAmount),
    indicativeRateMin: num(f.indicativeRateMin),
    indicativeRateMax: num(f.indicativeRateMax),
    durationMonthsMin: num(f.durationMonthsMin),
    durationMonthsMax: num(f.durationMonthsMax),
    ctaLabel: str(f.ctaLabel),
    ctaUrl: str(f.ctaUrl),
    icon: str(f.icon),
    validUntil: str(f.validUntil),
    isActive: Boolean(f.isActive),
    sortOrder: num(f.sortOrder),
  };
}

/**
 * Applique la réponse du serveur à la liste locale sans dépendre de sa forme
 * exacte : certains endpoints renvoient le profil complet (avec `products`),
 * d'autres seulement l'entité créée ou modifiée. Dans les deux cas, le
 * produit doit apparaître dans la liste immédiatement, sans recharger la page.
 */
function applyProductResult(result, { payload, productId }) {
  if (result && Array.isArray(result.products)) {
    profile.value = result;
    return;
  }

  const merged = { ...payload, ...(result && typeof result === 'object' ? result : {}) };
  if (!merged.id) merged.id = productId || result?.id || `temp-${Date.now()}`;

  if (!profile.value) {
    profile.value = { products: [merged] };
    return;
  }

  const list = profile.value.products ? [...profile.value.products] : [];
  const index = list.findIndex((p) => p.id === merged.id);

  if (index > -1) list.splice(index, 1, { ...list[index], ...merged });
  else list.unshift(merged);

  profile.value = { ...profile.value, products: list };
}

async function saveProduct() {
  savingProduct.value = true;
  productError.value = '';

  try {
    const payload = buildProductPayload();
    const result = editingProductId.value
      ? await updateProduct(editingProductId.value, payload)
      : await addProduct(payload);

    applyProductResult(result, { payload, productId: editingProductId.value });

    showProductForm.value = false;
    infoMessage.value = editingProductId.value ? 'Produit mis à jour.' : 'Produit ajouté au catalogue.';
    editingProductId.value = null;
  } catch (error) {
    productError.value = extractErrorMessage(error);
  } finally {
    savingProduct.value = false;
  }
}

/* ─────────────── Suppression ─────────────── */
/** Produit ciblé par une suppression, tant que la popup de confirmation est ouverte. */
const productToDelete = ref(null);
const deleteError = ref('');

function askDeleteProduct(product) {
  productToDelete.value = product;
  deleteError.value = '';
}

function cancelDeleteProduct() {
  productToDelete.value = null;
  deleteError.value = '';
}

async function confirmDeleteProduct() {
  if (!productToDelete.value) return;

  const productId = productToDelete.value.id;
  deletingId.value = productId;
  deleteError.value = '';

  try {
    await deleteProduct(productId);
    // On retire l'entrée localement plutôt que de se fier à la réponse du
    // serveur : elle est parfois le profil complet, parfois vide.
    if (profile.value) {
      profile.value = {
        ...profile.value,
        products: (profile.value.products || []).filter((p) => p.id !== productId),
      };
    }
    infoMessage.value = 'Produit retiré du catalogue.';
    productToDelete.value = null;
  } catch (error) {
    deleteError.value = extractErrorMessage(error);
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadProfile);
</script>

<template>
  <div class="produits-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Produits</h1>
          <p class="text-gray-500 mt-1">
            Catalogue et critères d'éligibilité — déterminent quelles PME voient vos offres et peuvent y postuler.
          </p>
        </div>
        <button
          @click="openNewProduct"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium whitespace-nowrap"
        >
          + Nouveau produit
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {{ errorMessage }}
    </div>
    <div v-if="infoMessage" class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
      {{ infoMessage }}
    </div>

    <div v-if="isLoading" class="card">
      <SkeletonLoader type="card" />
    </div>

    <template v-else>
      <!-- Liste des produits -->
      <div v-if="products.length === 0" class="card text-center py-14">
        <svg class="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 class="text-base font-medium text-gray-900 mb-1">Aucun produit au catalogue</h3>
        <p class="text-sm text-gray-500 mb-5">
          Créez votre premier produit pour que les PME puissent vous adresser des demandes.
        </p>
        <button
          @click="openNewProduct"
          class="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Créer un produit
        </button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="product in products"
          :key="product.id"
          class="card card-hover animate-slide-in-up group flex flex-col"
        >
          <!-- En-tête -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="flex items-center space-x-3 min-w-0">
              <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
                <img :src="iconProduct" :alt="product.title" />
              </div>
              <div class="min-w-0">
                <h3 class="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  {{ product.title }}
                </h3>
                <p class="text-xs text-gray-500 truncate">
                  {{ productTypes.find((t) => t.value === product.productType)?.label || product.productType }}
                </p>
              </div>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0"
              :class="product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ product.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <!-- Description -->
          <p class="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
            {{ product.description || 'Aucune description.' }}
          </p>

          <!-- Chiffres -->
          <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
            <div>
              <p class="text-xs text-gray-500 mb-1">Montant</p>
              <p class="text-sm font-bold text-gray-900">
                {{ product.minAmount ? formatCurrency(product.minAmount) : '—' }}
                <span v-if="product.maxAmount"> → {{ formatCurrency(product.maxAmount) }}</span>
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Taux</p>
              <p class="text-sm font-semibold text-gray-900">
                {{ product.indicativeRateMin != null ? `${product.indicativeRateMin} %` : '—' }}
                <span v-if="product.indicativeRateMax != null"> → {{ product.indicativeRateMax }} %</span>
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Durée</p>
              <p class="text-sm font-semibold text-gray-900">
                {{ product.durationMonthsMin != null ? `${product.durationMonthsMin}` : '—' }}
                <span v-if="product.durationMonthsMax != null"> → {{ product.durationMonthsMax }}</span>
                mois
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Score minimum</p>
              <p class="text-sm font-semibold text-gray-900">{{ product.minScoreRequired ?? '—' }}</p>
            </div>
          </div>

          <!-- Indicateurs -->
          <div class="flex items-center gap-2 mb-4 flex-wrap">
            <span
              v-if="product.requiredKycLevel"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
            >
              KYC {{ formatKyc(product.requiredKycLevel) }}
            </span>
            <span
              v-if="product.minMonthlyRevenue"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            >
              CA min. {{ formatCurrency(product.minMonthlyRevenue) }}
            </span>
            <span
              v-if="product.minHistoryMonths"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            >
              Ancienneté {{ product.minHistoryMonths }} mois
            </span>
            <span
              v-if="product.validUntil"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
            >
              Valide jusqu'au {{ formatDate(product.validUntil) }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              @click="openEditProduct(product)"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Modifier
            </button>
            <button
              @click="askDeleteProduct(product)"
              :disabled="deletingId === product.id"
              class="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {{ deletingId === product.id ? 'Suppression…' : 'Supprimer' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Modale    </template>

    <!-- Modale d'ajout / modification -->
    <Teleport to="body">
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="showProductForm" class="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-gray-900 bg-opacity-75" @click="showProductForm = false"></div>

          <div class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full z-[10000] max-h-[90vh] overflow-y-auto">
            <div class="px-6 pt-6 pb-4">
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-lg font-bold text-gray-900">
                  {{ editingProductId ? 'Modifier le produit' : 'Nouveau produit' }}
                </h3>
                <button
                  @click="showProductForm = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-2 hover:bg-gray-100"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="text-sm text-gray-500 mb-5">Les champs vides ne sont pas transmis au serveur.</p>

              <div v-if="productError" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {{ productError }}
              </div>

              <form @submit.prevent="saveProduct" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Type de produit *</label>
                  <select v-model="productForm.productType" required class="field">
                    <option v-for="t in productTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input v-model="productForm.title" type="text" required placeholder="Crédit de trésorerie PME" class="field" />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea v-model="productForm.description" rows="2" class="field"></textarea>
                </div>

                <div class="md:col-span-2 pt-2">
                  <p class="text-sm font-semibold text-gray-900 mb-3">Critères d'éligibilité</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Score minimum requis</label>
                  <input v-model="productForm.minScoreRequired" type="number" min="0" placeholder="500" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">CA mensuel minimum (F CFA)</label>
                  <input v-model="productForm.minMonthlyRevenue" type="number" min="0" placeholder="500000" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Ancienneté minimum (mois)</label>
                  <input v-model="productForm.minHistoryMonths" type="number" min="0" placeholder="6" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Niveau KYC requis</label>
                  <select v-model="productForm.requiredKycLevel" class="field">
                    <option value="">Aucune exigence</option>
                    <option v-for="lvl in kycLevels.filter(Boolean)" :key="lvl" :value="lvl">{{ formatKyc(lvl) }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Forme juridique acceptée</label>
                  <input v-model="productForm.legalFormAllowed" type="text" placeholder="SARL, SA…" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Solde minimum requis (F CFA)</label>
                  <input v-model="productForm.minBalanceRequired" type="number" min="0" class="field" />
                </div>

                <div class="md:col-span-2 pt-2">
                  <p class="text-sm font-semibold text-gray-900 mb-3">Conditions financières</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Montant minimum (F CFA)</label>
                  <input v-model="productForm.minAmount" type="number" min="0" placeholder="100000" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Montant maximum (F CFA)</label>
                  <input v-model="productForm.maxAmount" type="number" min="0" placeholder="10000000" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Taux indicatif min. (%)</label>
                  <input v-model="productForm.indicativeRateMin" type="number" step="0.1" min="0" placeholder="8" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Taux indicatif max. (%)</label>
                  <input v-model="productForm.indicativeRateMax" type="number" step="0.1" min="0" placeholder="18" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Durée min. (mois)</label>
                  <input v-model="productForm.durationMonthsMin" type="number" min="1" placeholder="3" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Durée max. (mois)</label>
                  <input v-model="productForm.durationMonthsMax" type="number" min="1" placeholder="36" class="field" />
                </div>

                <div class="md:col-span-2 pt-2">
                  <p class="text-sm font-semibold text-gray-900 mb-3">Affichage</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Libellé du bouton</label>
                  <input v-model="productForm.ctaLabel" type="text" placeholder="Faire une demande" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Lien du bouton</label>
                  <input v-model="productForm.ctaUrl" type="url" placeholder="https://…" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Valide jusqu'au</label>
                  <input v-model="productForm.validUntil" type="date" class="field" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage</label>
                  <input v-model="productForm.sortOrder" type="number" min="0" class="field" />
                </div>

                <div class="md:col-span-2 flex items-center gap-2">
                  <input
                    id="productActive"
                    v-model="productForm.isActive"
                    type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label for="productActive" class="text-sm text-gray-700">Produit visible par les PME</label>
                </div>

                <div class="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    @click="showProductForm = false"
                    class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    :disabled="savingProduct"
                    class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {{ savingProduct ? 'Enregistrement…' : editingProductId ? 'Mettre à jour' : 'Créer le produit' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Confirmation de suppression -->
    <Teleport to="body">
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="productToDelete" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" @click="cancelDeleteProduct"></div>

          <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[10000] text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Supprimer ce produit ?</h3>
            <p class="text-gray-600 mb-1 text-sm">
              « {{ productToDelete?.title }} » sera retiré définitivement de votre catalogue.
            </p>
            <p class="text-gray-500 mb-6 text-sm">Cette action est irréversible.</p>

            <div v-if="deleteError" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-left">
              {{ deleteError }}
            </div>

            <div class="flex gap-3">
              <button
                @click="cancelDeleteProduct"
                class="flex-1 px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                @click="confirmDeleteProduct"
                :disabled="deletingId === productToDelete?.id"
                class="flex-1 px-5 py-3 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {{ deletingId === productToDelete?.id ? 'Suppression…' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.field {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.field:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}
</style>
