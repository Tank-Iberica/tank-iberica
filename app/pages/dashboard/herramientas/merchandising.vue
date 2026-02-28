<script setup lang="ts">
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

    <div v-if="pageLoading" class="loading-state">
      <div class="spinner" />
      <span>{{ $t('common.loading') }}...</span>
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
  max-width: 1024px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
  font-size: 0.95rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 768px) {
  .merch-page {
    padding: 24px;
  }
}
</style>
