<script setup lang="ts">
import type { ValoracionFormData } from '~/composables/useValoracion'
import { useValoracion } from '~/composables/useValoracion'

definePageMeta({ layout: 'default' })

const { t } = useI18n()

usePageSeo({
  title: t('valuation.seoTitle'),
  description: t('valuation.seoDescription'),
  path: '/valoracion',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: t('valuation.seoTitle'),
    url: 'https://tracciona.com/valoracion',
    description: t('valuation.seoDescription'),
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  },
})

const {
  /* State */
  form,
  formErrors,
  loading,
  showResults,
  result,
  noData,
  subcategories,
  history,
  user,
  provinces,

  /* Actions */
  init,
  calculateValuation,
  resetForm,
  updateFormField,

  /* Display helpers */
  formatPrice,
  priceBarPosition,
  confidenceColor,
  trendIcon,
  trendLabel,
  confidenceLabel,
  subcategoryLabel,
  formatDate,
} = useValoracion()

function onUpdateField(field: keyof ValoracionFormData, value: string | number | null): void {
  updateFormField(field, value)
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="valuation-page">
    <ValoracionHero />

    <div class="valuation-container">
      <ValoracionForm
        v-if="!showResults"
        :form="form"
        :form-errors="formErrors"
        :loading="loading"
        :subcategories="subcategories"
        :provinces="provinces"
        :subcategory-label="subcategoryLabel"
        @submit="calculateValuation"
        @update:field="onUpdateField"
      />

      <ValoracionResults
        v-if="showResults"
        :result="result"
        :no-data="noData"
        :vehicle-brand="form.brand"
        :vehicle-model="form.model"
        :vehicle-year="form.year"
        :format-price="formatPrice"
        :price-bar-position="priceBarPosition"
        :confidence-color="confidenceColor"
        :trend-icon="trendIcon"
        :trend-label="trendLabel"
        :confidence-label="confidenceLabel"
        @reset="resetForm"
      />

      <ValoracionHistory
        v-if="user"
        :history="history"
        :show-results="showResults"
        :format-price="formatPrice"
        :format-date="formatDate"
        :confidence-color="confidenceColor"
      />
    </div>
  </div>
</template>

<style scoped>
.valuation-page {
  min-height: 60vh;
  background: var(--bg-secondary);
}

.valuation-container {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-16);
}

@media (min-width: 480px) {
  .valuation-container {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }
}
</style>
