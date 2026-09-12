<script setup>
import { computed } from 'vue';
import { formatCompact, formatCurrency } from '@/utils/format';

/**
 * Affiche un montant en version compacte (« 12,5 M F ») et révèle la valeur
 * complète au survol, via une infobulle et l'attribut title natif.
 */
const props = defineProps({
  value: { type: [Number, String], default: null },
  currency: { type: String, default: 'XOF' },
  /** Balise de rendu : h2, h3, span… pour respecter la typographie du parent. */
  tag: { type: String, default: 'span' },
});

const compact = computed(() => formatCompact(props.value, props.currency));
const full = computed(() => formatCurrency(props.value, props.currency));

/** Inutile d'afficher l'infobulle si la valeur n'a pas été abrégée. */
const isAbbreviated = computed(() => compact.value !== full.value && compact.value !== '—');
</script>

<template>
  <component :is="tag" class="amount-compact" :class="{ 'is-abbreviated': isAbbreviated }" :title="isAbbreviated ? full : null">
    {{ compact }}
    <span v-if="isAbbreviated" class="amount-tooltip">{{ full }}</span>
  </component>
</template>

<style scoped>
.amount-compact {
  position: relative;
}

.is-abbreviated {
  cursor: help;
}

.amount-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #111827;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: normal;
  border-radius: 0.375rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease;
  pointer-events: none;
  z-index: 40;
}

.amount-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #111827;
}

.is-abbreviated:hover .amount-tooltip {
  opacity: 1;
  visibility: visible;
}
</style>
