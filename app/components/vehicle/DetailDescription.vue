<template>
  <div class="vehicle-description-section">
    <!-- Description -->
    <div v-if="description" class="vehicle-description">
      <h2>{{ $t('vehicle.description') }}</h2>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="vehicle-description-body" v-html="renderedDescription" />
      <div class="vehicle-description-badges">
        <UiAiDisclosureBadge v-if="isAiGenerated" type="generated" />
        <UiAiDisclosureBadge v-if="locale !== 'es'" type="translated" />
      </div>
    </div>

    <!-- Price History -->
    <div v-if="vehicleId" class="vehicle-price-history">
      <h2>{{ $t('priceHistory.title') }}</h2>
      <LazyVehiclePriceHistoryChart :vehicle-id="vehicleId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { markdownToSafeHtml } from '~/utils/markdownToHtml'

const props = defineProps<{
  description: string | null
  vehicleId: string
  locale: string
  isAiGenerated: boolean
}>()

const renderedDescription = computed(() =>
  props.description ? markdownToSafeHtml(props.description) : '',
)
</script>

<style scoped>
.vehicle-description {
  margin-bottom: var(--spacing-6);
}

.vehicle-description h2 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.vehicle-description-body {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 65ch;
}

.vehicle-description-body :deep(p) {
  margin-bottom: var(--spacing-3);
}

.vehicle-description-body :deep(p:last-child) {
  margin-bottom: 0;
}

.vehicle-description-body :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.vehicle-description-body :deep(a:hover) {
  opacity: 0.8;
}

.vehicle-description-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: var(--spacing-3);
}

.vehicle-price-history {
  margin-bottom: var(--spacing-6);
}

.vehicle-price-history h2 {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (min-width: 64em) {
  .vehicle-description {
    margin-bottom: var(--spacing-4);
  }
}
</style>
