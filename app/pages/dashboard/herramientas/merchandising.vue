<script setup lang="ts">
import { useDashboardMerchandising } from '~/composables/dashboard/useDashboardMerchandising'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()

const {
  pageLoading,
  submitting,
  submitted,
  submitError,
  form,
  submitInterest,
  resetSubmitted,
  updateFormField,
  init,
} = useDashboardMerchandising()

useHead({ title: t('dashboard.tools.merchandising.title') })

onMounted(() => init())
</script>

<template>
  <div class="merch-page">
    <MerchHeroBanner />

    <div v-if="pageLoading" class="loading-state" aria-busy="true">
      <UiSkeletonCard v-for="n in 4" :key="n" :image="true" :lines="2" />
    </div>

    <template v-else>
      <MerchProductGrid />
      <MerchInterestForm
        :submitted="submitted"
        :submitting="submitting"
        :submit-error="submitError"
        :form="form"
        @submit="submitInterest"
        @reset="resetSubmitted"
        @update-field="updateFormField"
      />
    </template>
  </div>
</template>

<style scoped>
.merch-page {
  max-width: 64rem;
  margin: 0 auto;
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: 3.75rem var(--spacing-5);
  color: var(--text-auxiliary);
  font-size: 0.95rem;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 48em) {
  .merch-page {
    padding: var(--spacing-6);
  }
}
</style>
