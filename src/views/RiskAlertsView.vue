<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SkeletonLoader from '../components/common/SkeletonLoader.vue';
import { getRiskAlerts, resolveRiskAlert } from '@/services/bankPortal';
import { extractErrorMessage } from '@/services/http';
import { formatDateLong, riskLabel, riskIconClass, normalizeRiskLevel, RISK_LEVELS } from '@/utils/format';

const router = useRouter();

const isLoading = ref(true);
const errorMessage = ref('');
const alerts = ref([]);
const statusFilter = ref('unresolved');
const levelFilter = ref('all');
const resolvingId = ref(null);

const levels = [
  { key: 'all', label: 'Tous niveaux' },
  { key: 'CRITICAL', label: 'Critique' },
  { key: 'HIGH', label: 'Élevé' },
  { key: 'MEDIUM', label: 'Moyen' },
  { key: 'LOW', label: 'Faible' },
];

const counts = computed(() => ({
  critical: alerts.value.filter((a) => a.level === 'CRITICAL').length,
  high: alerts.value.filter((a) => a.level === 'HIGH').length,
  medium: alerts.value.filter((a) => a.level === 'MEDIUM').length,
  low: alerts.value.filter((a) => a.level === 'LOW').length,
}));

const totalAlerts = computed(() => alerts.value.length);

/**
 * Alertes dont le niveau n'a pas pu être rattaché à l'un des quatre paliers.
 * Sans ce garde-fou, elles disparaîtraient silencieusement de la répartition
 * alors qu'elles sont bien listées plus bas.
 */
const unclassified = computed(() => alerts.value.filter((a) => !RISK_LEVELS.includes(a.level)));

const filteredAlerts = computed(() => {
  let list = alerts.value;
  if (levelFilter.value !== 'all') list = list.filter((a) => a.level === levelFilter.value);

  // Les alertes les plus graves et les plus récentes en tête.
  const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return [...list].sort((a, b) => {
    const pa = priority[a.level] ?? 9;
    const pb = priority[b.level] ?? 9;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
});

async function load() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const page = await getRiskAlerts({
      resolved: statusFilter.value === 'resolved',
      size: 100,
    });
    // Le niveau est normalisé une seule fois ici : comptage, filtre, tri et
    // badges s'appuient ensuite tous sur la même valeur.
    alerts.value = (page.content || []).map((alert) => ({
      ...alert,
      level: normalizeRiskLevel(alert),
    }));

    if (unclassified.value.length > 0) {
      console.warn(
        `${unclassified.value.length} alerte(s) au niveau de risque non reconnu.`,
        'Exemple de charge utile reçue :',
        page.content.find((a) => !RISK_LEVELS.includes(normalizeRiskLevel(a)))
      );
    }
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
    alerts.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function handleResolve(alert) {
  resolvingId.value = alert.id;
  errorMessage.value = '';

  try {
    await resolveRiskAlert(alert.id);
    // Une alerte résolue quitte la vue « en cours ».
    if (statusFilter.value === 'unresolved') {
      alerts.value = alerts.value.filter((a) => a.id !== alert.id);
    } else {
      await load();
    }
  } catch (error) {
    errorMessage.value = extractErrorMessage(error);
  } finally {
    resolvingId.value = null;
  }
}

function changeStatus(status) {
  statusFilter.value = status;
  load();
}

function openClient(alert) {
  router.push(`/detailpme/${alert.organizationId}`);
}

onMounted(load);
</script>

<template>
  <div class="alerts-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Alertes de Risque</h1>
          <p class="text-gray-500 mt-1">
            Surveillez les signaux faibles sur votre portefeuille
            <span v-if="!isLoading && totalAlerts > 0" class="text-gray-400">
              · {{ totalAlerts }} alerte(s)
            </span>
          </p>
        </div>
        <div class="mt-4 md:mt-0 flex items-center space-x-2">
          <button
            @click="changeStatus('unresolved')"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              statusFilter === 'unresolved' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            ]"
          >
            En cours
          </button>
          <button
            @click="changeStatus('resolved')"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              statusFilter === 'resolved' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            ]"
          >
            Résolues
          </button>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
      {{ errorMessage }}
    </div>

    <!-- Répartition par niveau -->
    <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <SkeletonLoader type="stat" v-for="i in 4" :key="i" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div
        v-for="item in [
          { key: 'CRITICAL', label: 'Critiques', value: counts.critical, icon: 'text-red-500' },
          { key: 'HIGH', label: 'Élevées', value: counts.high, icon: 'text-orange-400' },
          { key: 'MEDIUM', label: 'Moyennes', value: counts.medium, icon: 'text-yellow-400' },
          { key: 'LOW', label: 'Faibles', value: counts.low, icon: 'text-blue-400' }
        ]"
        :key="item.key"
        class="card card-hover animate-slide-in-up cursor-pointer"
        :class="{ 'ring-2 ring-gray-900': levelFilter === item.key }"
        @click="levelFilter = levelFilter === item.key ? 'all' : item.key"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 mb-1">{{ item.label }}</p>
            <h3 class="text-3xl font-bold text-gray-900">{{ item.value }}</h3>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
            <svg class="w-6 h-6" :class="item.icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Alertes hors paliers : évite qu'elles disparaissent de la répartition -->
    <div
      v-if="!isLoading && unclassified.length > 0"
      class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
    >
      <p class="text-sm text-gray-700">
        {{ unclassified.length }} alerte(s) portent un niveau de risque non reconnu et ne sont donc
        comptées dans aucun palier ci-dessus. Elles restent visibles dans la liste.
      </p>
      <p class="text-xs text-gray-500 mt-1">
        Valeur(s) reçue(s) :
        <span class="font-mono">{{ [...new Set(unclassified.map((a) => a.level ?? 'absent'))].join(', ') }}</span>
      </p>
    </div>

    <!-- Filtre par niveau -->
    <div class="flex items-center gap-2 mb-6 flex-wrap">
      <span class="text-sm text-gray-600 mr-1">Niveau :</span>
      <button
        v-for="level in levels"
        :key="level.key"
        @click="levelFilter = level.key"
        :class="[
          'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
          levelFilter === level.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ level.label }}
      </button>
    </div>

    <!-- Liste -->
    <div v-if="isLoading" class="space-y-4">
      <SkeletonLoader type="card" v-for="i in 4" :key="i" />
    </div>

    <div v-else-if="filteredAlerts.length === 0" class="card text-center py-16">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black mb-4">
        <svg class="h-7 w-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-1">
        {{ statusFilter === 'unresolved' ? 'Tout va bien' : 'Aucune alerte résolue' }}
      </h3>
      <p class="text-sm text-gray-500">
        {{ statusFilter === 'unresolved'
          ? 'Aucune alerte en cours sur votre portefeuille.'
          : 'Les alertes que vous traitez apparaîtront ici.' }}
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="alert in filteredAlerts"
        :key="alert.id"
        class="card card-hover animate-slide-in-up"
      >
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex items-start gap-4 min-w-0 flex-1">
            <div class="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-black">
              <svg class="w-6 h-6" :class="riskIconClass(alert.level)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <h3 class="text-base font-bold text-gray-900">{{ alert.title }}</h3>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-900 text-white"
                >
                  {{ riskLabel(alert.level) }}
                </span>
                <span
                  v-if="alert.alertType"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                >
                  {{ alert.alertType }}
                </span>
              </div>

              <button
                @click="openClient(alert)"
                class="text-sm font-medium text-primary-600 hover:underline mb-2"
              >
                {{ alert.organizationName }}
              </button>

              <p class="text-sm text-gray-600 leading-relaxed">{{ alert.description }}</p>

              <p class="text-xs text-gray-400 mt-2">
                Détectée le {{ formatDateLong(alert.createdAt) }}
                <span v-if="alert.isResolved && alert.resolvedAt">
                  · résolue le {{ formatDateLong(alert.resolvedAt) }}
                  <span v-if="alert.resolvedBy">par {{ alert.resolvedBy }}</span>
                </span>
              </p>

              <p v-if="alert.resolutionNotes" class="text-xs text-gray-500 mt-1 italic">
                {{ alert.resolutionNotes }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="openClient(alert)"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Voir la PME
            </button>
            <button
              v-if="!alert.isResolved"
              @click="handleResolve(alert)"
              :disabled="resolvingId === alert.id"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {{ resolvingId === alert.id ? 'Traitement…' : 'Marquer résolue' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>