<script setup lang="ts">
import { products } from '~/composables/dashboard/useDashboardMerchandising'
import type { MerchProduct } from '~/composables/dashboard/useDashboardMerchandising'

const { locale } = useI18n()

function getProductName(p: MerchProduct): string {
  return locale.value === 'en' ? p.name_en : p.name_es
}

function getProductDescription(p: MerchProduct): string {
  return locale.value === 'en' ? p.description_en : p.description_es
}

function getProductUnit(p: MerchProduct): string {
  return locale.value === 'en' ? p.unit_en : p.unit_es
}
</script>

<template>
  <section class="section">
    <h2 class="section-title">{{ $t('dashboard.tools.merchandising.catalogTitle') }}</h2>
    <p class="section-desc">{{ $t('dashboard.tools.merchandising.catalogDesc') }}</p>

    <div class="product-grid">
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card"
        :style="{ '--card-bg': product.color }"
      >
        <div class="product-icon-wrap">
          <span class="product-icon" aria-hidden="true">{{ product.icon }}</span>
        </div>
        <div class="product-body">
          <h3 class="product-name">{{ getProductName(product) }}</h3>
          <p class="product-desc">{{ getProductDescription(product) }}</p>
          <span class="product-unit">{{ getProductUnit(product) }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
}

.section-desc {
  margin: -8px 0 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.product-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
  padding: 16px;
  transition: box-shadow 0.15s;
  border: 1px solid #f1f5f9;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-icon-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: var(--card-bg, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.product-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.product-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.product-desc {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
  line-height: 1.4;
}

.product-unit {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

@media (min-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
