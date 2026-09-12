<script setup>
import { computed } from 'vue';
import { statusLabel, statusBadgeClass, statusDotClass } from '@/utils/format';

const props = defineProps({
  status: { type: String, default: '' },
  /** Libellé personnalisé (sinon déduit du statut). */
  label: { type: String, default: '' },
});

const text = computed(() => props.label || statusLabel(props.status));
const badgeClass = computed(() => statusBadgeClass(props.status));
const dotClass = computed(() => statusDotClass(props.status));
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
    :class="badgeClass"
  >
    <span class="w-1.5 h-1.5 mr-1.5 rounded-full" :class="dotClass"></span>
    {{ text }}
  </span>
</template>
