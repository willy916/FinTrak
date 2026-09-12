<script setup>
import { ref, computed, onMounted } from 'vue';
import SkeletonLoader from '@/components/common/SkeletonLoader.vue';
import { useAuth } from '@/stores/auth';
import {
  getProfile,
  configurePayoutAccount,
  getPayoutAccount,
  updateProfile,
} from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import { formatCurrency } from '@/utils/format';

const { session, fullName, initials } = useAuth();

/* ─────────────── Icônes du menu ─────────────── */
const UserIcon = {
  template:
    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
};
const BuildingIcon = {
  template:
    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>',
};
const WalletIcon = {
  template:
    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>',
};

const generalMenu = [
  { id: 'account', label: 'Compte', icon: UserIcon },
  { id: 'organization', label: 'Établissement', icon: BuildingIcon },
];

const workspaceMenu = [{ id: 'payment', label: 'Compte de versement', icon: WalletIcon }];

const activeSection = ref('account');
const isLoading = ref(true);
const errorMessage = ref('');
const infoMessage = ref('');

const profile = ref(null);

const changeSection = (sectionId) => {
  activeSection.value = sectionId;
  infoMessage.value = '';
  errorMessage.value = '';
};

/* ─────────────── Chargement ─────────────── */
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

const products = computed(() => profile.value?.products || []);

/* ─────────────── Édition de l'établissement ─────────────── */
const isEditingProfile = ref(false);
const savingProfile = ref(false);
const profileError = ref('');

const profileForm = ref({
  name: '',
  shortPitch: '',
  description: '',
  logoUrl: '',
  primaryColor: '',
  website: '',
  phone: '',
  country: '',
});

function startEditProfile() {
  const p = profile.value || {};
  profileForm.value = {
    name: p.name || '',
    shortPitch: p.shortPitch || '',
    description: p.description || '',
    logoUrl: p.logoUrl || '',
    primaryColor: p.primaryColor || '',
    website: p.website || '',
    phone: p.phone || '',
    country: p.country || '',
  };
  profileError.value = '';
  isEditingProfile.value = true;
}

/** Les champs vides ne sont pas transmis : le serveur les distingue d'un effacement. */
function buildProfilePayload() {
  const f = profileForm.value;
  const str = (v) => {
    const t = String(v ?? '').trim();
    return t === '' ? undefined : t;
  };
  return {
    name: f.name.trim(),
    shortPitch: str(f.shortPitch),
    description: str(f.description),
    logoUrl: str(f.logoUrl),
    primaryColor: str(f.primaryColor),
    website: str(f.website),
    phone: str(f.phone),
    country: str(f.country)?.toUpperCase(),
  };
}

async function saveProfile() {
  const payload = buildProfilePayload();

  if (!payload.name) {
    profileError.value = "Le nom de l'établissement est obligatoire.";
    return;
  }
  if (payload.country && payload.country.length !== 2) {
    profileError.value = 'Le code pays doit contenir exactement 2 lettres (ex : CI).';
    return;
  }

  savingProfile.value = true;
  profileError.value = '';

  try {
    profile.value = await updateProfile(payload);
    isEditingProfile.value = false;
    infoMessage.value = 'Informations de l\'établissement mises à jour.';
  } catch (error) {
    profileError.value = extractErrorMessage(error);
  } finally {
    savingProfile.value = false;
  }
}
const activeProducts = computed(() => products.value.filter((p) => p.isActive));

/* ─────────────── Compte de versement ─────────────── */
const payoutForm = ref({
  payoutChannel: 'MOBILE_MONEY',
  providerCode: '',
  accountNumber: '',
  accountName: '',
});
const savingPayout = ref(false);
const payoutError = ref('');
const isLoadingPayout = ref(true);
/** État renvoyé par le serveur : compte configuré, destinataire Paystack créé. */
const payoutAccount = ref(null);

const providerOptions = {
  MOBILE_MONEY: [
    { code: 'ORANGEMONEY', label: 'Orange Money' },
    { code: 'MTN', label: 'MTN Mobile Money' },
    { code: 'MOOV', label: 'Moov Money' },
    { code: 'WAVE', label: 'Wave' },
  ],
  BANK_ACCOUNT: [{ code: 'BANK', label: 'Compte bancaire' }],
};

/** Pré-remplit le formulaire avec le compte déjà enregistré. */
async function loadPayoutAccount() {
  isLoadingPayout.value = true;
  try {
    const account = await getPayoutAccount();
    payoutAccount.value = account;

    if (account?.configured) {
      payoutForm.value = {
        payoutChannel: account.payoutChannel || 'MOBILE_MONEY',
        providerCode: account.providerCode || '',
        accountNumber: account.accountNumber || '',
        accountName: account.accountName || '',
      };
    }
  } catch (error) {
    console.warn('Compte de versement indisponible :', error);
    payoutAccount.value = null;
  } finally {
    isLoadingPayout.value = false;
  }
}

async function savePayoutAccount() {
  savingPayout.value = true;
  payoutError.value = '';
  infoMessage.value = '';

  try {
    await configurePayoutAccount({ ...payoutForm.value });
    infoMessage.value = 'Compte de versement enregistré.';
    await loadPayoutAccount();
  } catch (error) {
    payoutError.value = extractErrorMessage(error);
  } finally {
    savingPayout.value = false;
  }
}

onMounted(() => {
  loadProfile();
  loadPayoutAccount();
});
</script>

<template>
  <div class="settings-container">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Paramètres du Compte</h1>
      <p class="text-gray-500 mt-2">Gérez votre établissement et vos critères de financement</p>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {{ errorMessage }}
    </div>
    <div v-if="infoMessage" class="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
      {{ infoMessage }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Navigation latérale -->
      <div class="lg:col-span-1">
        <div class="card lg:sticky lg:top-6">
          <div class="mb-6">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Paramètres Généraux</p>
            <nav class="space-y-1">
              <button
                v-for="item in generalMenu"
                :key="item.id"
                @click="changeSection(item.id)"
                :class="[
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeSection === item.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span class="truncate">{{ item.label }}</span>
              </button>
            </nav>
          </div>

          <div class="pt-6 border-t border-gray-100">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Espace de Travail</p>
            <nav class="space-y-1">
              <button
                v-for="item in workspaceMenu"
                :key="item.id"
                @click="changeSection(item.id)"
                :class="[
                  'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeSection === item.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                ]"
              >
                <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
                <span class="truncate">{{ item.label }}</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Contenu -->
      <div class="lg:col-span-3">
        <!-- ── Compte ── -->
        <div v-if="activeSection === 'account'" class="card">
          <h2 class="text-lg font-bold text-gray-900 mb-6">Mon profil</h2>

          <div class="flex items-start space-x-6 mb-8 flex-wrap gap-4">
            <div
              class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <h3 class="text-xl font-bold text-gray-900">{{ fullName }}</h3>
              <p class="text-sm text-gray-500 mt-0.5">{{ session?.email }}</p>
              <span
                v-if="session?.role"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 mt-2"
              >
                {{ session.role }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
              <input
                :value="session?.firstName || ''"
                type="text"
                readonly
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
              <input
                :value="session?.lastName || ''"
                type="text"
                readonly
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Adresse e-mail</label>
              <input
                :value="session?.email || ''"
                type="email"
                readonly
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Établissement rattaché</label>
              <input
                :value="session?.organizationName || ''"
                type="text"
                readonly
                class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p class="text-sm text-blue-800">
              Ces informations proviennent de votre compte Djeli. Leur modification passe par votre administrateur :
              l'API du portail n'expose pas encore d'endpoint de mise à jour du profil utilisateur.
            </p>
          </div>
        </div>

        <!-- ── Établissement ── -->
        <div v-else-if="activeSection === 'organization'">
          <div v-if="isLoading" class="card">
            <SkeletonLoader type="card" />
          </div>

          <div v-else-if="!profile" class="card text-center py-14">
            <h3 class="text-base font-medium text-gray-900 mb-1">Profil indisponible</h3>
            <p class="text-sm text-gray-500">Impossible de récupérer les informations de l'établissement.</p>
          </div>

          <div v-else class="card">
            <div class="flex items-start justify-between gap-4 flex-wrap mb-6">
              <h2 class="text-lg font-bold text-gray-900">Informations de l'établissement</h2>
              <button
                v-if="!isEditingProfile"
                @click="startEditProfile"
                class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Modifier
              </button>
            </div>

            <div v-if="profileError" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {{ profileError }}
            </div>

            <!-- ── Mode lecture ── -->
            <template v-if="!isEditingProfile">
              <div class="flex items-start space-x-5 mb-8 flex-wrap gap-4">
                <div
                  v-if="profile.logoUrl"
                  class="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 flex-shrink-0"
                >
                  <img :src="profile.logoUrl" :alt="profile.name" class="w-full h-full object-cover" />
                </div>
                <div
                  v-else
                  class="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  :style="{ background: profile.primaryColor || '#10b981' }"
                >
                  {{ profile.name?.charAt(0).toUpperCase() }}
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-xl font-bold text-gray-900">{{ profile.name }}</h3>
                    <span
                      v-if="profile.isOfficial"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                    >
                      Partenaire officiel
                    </span>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="profile.isActive ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-600'"
                    >
                      {{ profile.isActive ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>
                  <p v-if="profile.shortPitch" class="text-sm text-gray-600 mt-1">{{ profile.shortPitch }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Identifiant</span>
                  <span class="text-sm font-medium text-gray-900 font-mono truncate">{{ profile.slug }}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Pays</span>
                  <span class="text-sm font-medium text-gray-900">{{ profile.country || '—' }}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Téléphone</span>
                  <span class="text-sm font-medium text-gray-900">{{ profile.phone || '—' }}</span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Site web</span>
                  <a
                    v-if="profile.website"
                    :href="profile.website"
                    target="_blank"
                    rel="noopener"
                    class="text-sm font-medium text-primary-600 hover:underline truncate"
                  >
                    {{ profile.website }}
                  </a>
                  <span v-else class="text-sm font-medium text-gray-900">—</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Produits actifs</span>
                  <span class="flex items-center gap-3">
                    <span class="text-sm font-medium text-gray-900">{{ activeProducts.length }} / {{ products.length }}</span>
                    <router-link to="/produits" class="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap">
                      Gérer →
                    </router-link>
                  </span>
                </div>
                <div class="flex justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <span class="text-sm text-gray-500">Couleur de marque</span>
                  <span class="flex items-center gap-2">
                    <span
                      class="w-4 h-4 rounded border border-gray-300"
                      :style="{ background: profile.primaryColor || '#10b981' }"
                    ></span>
                    <span class="text-sm font-medium text-gray-900">{{ profile.primaryColor || '—' }}</span>
                  </span>
                </div>
              </div>

              <div v-if="profile.description">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p class="text-sm text-gray-600 leading-relaxed p-4 bg-gray-50 rounded-lg">{{ profile.description }}</p>
              </div>

              <p class="mt-6 text-xs text-gray-500">
                L'identifiant, le statut officiel et l'activation sont gérés par votre administrateur Djeli
                et ne sont pas modifiables ici.
              </p>
            </template>

            <!-- ── Mode édition ── -->
            <form v-else @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom de l'établissement *</label>
                <input v-model="profileForm.name" type="text" required maxlength="120" class="field" />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Accroche</label>
                <input
                  v-model="profileForm.shortPitch"
                  type="text"
                  maxlength="200"
                  placeholder="Une phrase qui résume votre offre"
                  class="field"
                />
                <p class="text-xs text-gray-500 mt-1">{{ profileForm.shortPitch.length }} / 200 caractères</p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea v-model="profileForm.description" rows="4" class="field"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Logo (URL)</label>
                <input v-model="profileForm.logoUrl" type="url" placeholder="https://…" class="field" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Couleur de marque</label>
                <div class="flex items-center gap-2">
                  <input
                    v-model="profileForm.primaryColor"
                    type="color"
                    class="w-12 h-[42px] border border-gray-300 rounded-lg cursor-pointer p-1"
                  />
                  <input v-model="profileForm.primaryColor" type="text" maxlength="7" placeholder="#0A6E4F" class="field" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                <input v-model="profileForm.website" type="url" maxlength="255" placeholder="https://…" class="field" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input v-model="profileForm.phone" type="tel" maxlength="30" placeholder="+225…" class="field" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                <input
                  v-model="profileForm.country"
                  type="text"
                  maxlength="2"
                  placeholder="CI"
                  class="field uppercase"
                />
                <p class="text-xs text-gray-500 mt-1">Code à 2 lettres.</p>
              </div>

              <div class="md:col-span-2">
                <div v-if="profileForm.logoUrl" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    :src="profileForm.logoUrl"
                    alt="Aperçu du logo"
                    class="w-14 h-14 rounded-xl object-cover border border-gray-200"
                  />
                  <span class="text-xs text-gray-500">Aperçu du logo</span>
                </div>
              </div>

              <div class="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  @click="isEditingProfile = false"
                  class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  :disabled="savingProfile"
                  class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {{ savingProfile ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>


        <!-- ── Compte de versement ── -->
        <div v-else-if="activeSection === 'payment'" class="card">
          <h2 class="text-lg font-bold text-gray-900 mb-1">Compte de versement</h2>
          <p class="text-sm text-gray-500 mb-6">
            Compte sur lequel les remboursements collectés vous seront versés.
          </p>

          <div v-if="payoutError" class="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {{ payoutError }}
          </div>

          <div v-if="isLoadingPayout" class="mb-6">
            <SkeletonLoader type="card" />
          </div>

          <!-- État du compte enregistré -->
          <div
            v-else-if="payoutAccount?.configured"
            class="mb-6 p-4 rounded-lg border"
            :class="payoutAccount.recipientRegistered ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'"
          >
            <div class="flex items-start gap-3">
              <svg
                class="h-5 w-5 flex-shrink-0 mt-0.5"
                :class="payoutAccount.recipientRegistered ? 'text-green-600' : 'text-amber-600'"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="min-w-0">
                <p
                  class="text-sm font-semibold"
                  :class="payoutAccount.recipientRegistered ? 'text-green-800' : 'text-amber-800'"
                >
                  {{ payoutAccount.recipientRegistered
                    ? 'Compte vérifié — retrait immédiat possible'
                    : 'Compte enregistré — vérification en cours' }}
                </p>
                <p class="text-xs mt-1" :class="payoutAccount.recipientRegistered ? 'text-green-700' : 'text-amber-700'">
                  {{ payoutAccount.accountName }} · {{ payoutAccount.accountNumber }}
                  <span v-if="payoutAccount.providerCode"> · {{ payoutAccount.providerCode }}</span>
                </p>
              </div>
            </div>
          </div>

          <div v-else class="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p class="text-sm text-blue-800">
              Aucun compte de versement enregistré. Renseignez-le pour pouvoir effectuer des retraits.
            </p>
          </div>

          <form @submit.prevent="savePayoutAccount" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Canal *</label>
              <select v-model="payoutForm.payoutChannel" class="field">
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="BANK_ACCOUNT">Compte bancaire</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Opérateur *</label>
              <select v-model="payoutForm.providerCode" required class="field">
                <option value="" disabled>Sélectionner…</option>
                <option v-for="p in providerOptions[payoutForm.payoutChannel]" :key="p.code" :value="p.code">
                  {{ p.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Numéro de compte *</label>
              <input v-model="payoutForm.accountNumber" type="text" required placeholder="0707070707" class="field" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Titulaire du compte *</label>
              <input v-model="payoutForm.accountName" type="text" required placeholder="Nom de la microfinance" class="field" />
            </div>

            <div class="md:col-span-2 flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                :disabled="savingPayout"
                class="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {{ savingPayout ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>

          <p class="mt-6 text-xs text-gray-500">
            Enregistrer à nouveau remplace le compte existant. Le destinataire est recréé chez le
            prestataire de paiement, ce qui peut prendre quelques minutes avant le premier retrait.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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