<script setup lang="ts">
const { locale } = useI18n()

interface CreditPack {
  id: string
  slug: string
  name_es: string
  name_en: string
  credits: number
  price_cents: number
}

const packs = ref<CreditPack[]>([])
const loading = ref(false)
const buyingSlug = ref<string | null>(null)
const error = ref<string | null>(null)

const { $supabase } = useNuxtApp()

async function loadPacks() {
  const { data } = await ($supabase as ReturnType<typeof useSupabaseClient>)
    .from('credit_packs')
    .select('id,slug,name_es,name_en,credits,price_cents')
    .eq('is_active', true)
    .order('sort_order')
  packs.value = (data as CreditPack[]) ?? []
}

function packName(pack: CreditPack) {
  return locale.value === 'es' ? pack.name_es : pack.name_en
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',')
}

async function handleBuy(pack: CreditPack) {
  if (loading.value) return
  loading.value = true
  buyingSlug.value = pack.slug
  error.value = null

  try {
    const siteUrl = window.location.origin
    const { data } = await useFetch('/api/stripe/checkout-credits', {
      method: 'POST',
      body: {
        packSlug: pack.slug,
        successUrl: `${siteUrl}/dashboard/creditos?success=1`,
        cancelUrl: `${siteUrl}/precios#creditos`,
      },
    })
    const url = (data.value as { url?: string })?.url
    if (url) {
      window.location.href = url
    }
  } catch {
    error.value = 'Error al procesar el pago. Inténtalo de nuevo.'
  } finally {
    loading.value = false
    buyingSlug.value = null
  }
}

onMounted(loadPacks)
</script>

<template>
  <section id="creditos" class="credits-section">
    <div class="credits-header">
      <h2 class="credits-title">{{ $t('pricing.credits.title') }}</h2>
      <p class="credits-subtitle">{{ $t('pricing.credits.subtitle') }}</p>
    </div>

    <p v-if="error" class="credits-error">{{ error }}</p>

    <div v-if="packs.length" class="credits-grid">
      <div
        v-for="pack in packs"
        :key="pack.slug"
        class="credit-card"
        :class="{ 'credit-card--featured': pack.slug === 'pro' }"
      >
        <span v-if="pack.slug === 'pro'" class="featured-badge">
          {{ $t('pricing.credits.bestValue') }}
        </span>

        <h3 class="credit-name">{{ packName(pack) }}</h3>

        <div class="credit-price">
          <span class="credit-price-amount">{{ formatPrice(pack.price_cents) }}</span>
          <span class="credit-price-currency">&euro;</span>
        </div>

        <div class="credit-quantity">
          <span class="credit-qty-number">{{ pack.credits }}</span>
          <span class="credit-qty-label">{{ $t('pricing.credits.credits', pack.credits) }}</span>
        </div>

        <p class="credit-per-unit">
          {{ formatPrice(((pack.price_cents / pack.credits) * 100) / 100) }}&euro;
          {{ $t('pricing.credits.perCredit') }}
        </p>

        <button
          class="credit-cta"
          :class="{ 'credit-cta--featured': pack.slug === 'pro' }"
          :disabled="loading"
          :aria-label="`${$t('pricing.credits.buy')} ${packName(pack)}`"
          @click="handleBuy(pack)"
        >
          <span v-if="buyingSlug === pack.slug">{{ $t('pricing.loadingCheckout') }}</span>
          <span v-else>{{ $t('pricing.credits.buy') }}</span>
        </button>
      </div>
    </div>

    <p v-else-if="!packs.length" class="credits-loading">
      {{ $t('pricing.loadingCheckout') }}
    </p>

    <p class="credits-note">{{ $t('pricing.credits.note') }}</p>
  </section>
</template>

<style scoped>
.credits-section {
  margin-top: var(--spacing-16);
  padding-top: var(--spacing-12);
  border-top: 1px solid var(--border-color);
}

.credits-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.credits-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.credits-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.credits-error {
  text-align: center;
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.credits-loading {
  text-align: center;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

/* ---- Grid ---- */
.credits-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

@media (min-width: 480px) {
  .credits-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .credits-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* ---- Card ---- */
.credit-card {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-3);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

@media (hover: hover) {
  .credit-card:hover {
    box-shadow: var(--shadow-md);
  }
}

.credit-card--featured {
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

/* ---- Featured badge ---- */
.featured-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  white-space: nowrap;
}

/* ---- Name ---- */
.credit-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* ---- Price ---- */
.credit-price {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.credit-price-amount {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--text-primary);
  line-height: 1;
}

.credit-price-currency {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

/* ---- Credits qty ---- */
.credit-quantity {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-1);
}

.credit-qty-number {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

.credit-qty-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* ---- Per-credit price ---- */
.credit-per-unit {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* ---- CTA ---- */
.credit-cta {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  min-height: 44px;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  margin-top: auto;
}

@media (hover: hover) {
  .credit-cta:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-white);
  }
}

.credit-cta--featured {
  background: var(--color-primary);
  color: var(--color-white);
}

@media (hover: hover) {
  .credit-cta--featured:hover:not(:disabled) {
    background: var(--color-primary-dark);
    border-color: var(--color-primary-dark);
  }
}

.credit-cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---- Footer note ---- */
.credits-note {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin-top: var(--spacing-4);
}
</style>
