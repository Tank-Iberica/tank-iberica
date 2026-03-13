<script setup lang="ts">
/**
 * PostSaleFlow — Post-sale actions modal triggered after a vehicle is marked as sold.
 *
 * Offers:
 * 1. Request buyer review (link to review form)
 * 2. Archive the listing
 * 3. Export sale record (PDF)
 * 4. Share the sale on social
 *
 * Shown after status transitions to 'sold' from VehicleLifecyclePanel.
 */
const props = defineProps<{
  vehicleId: string
  vehicleName: string
  salePrice?: number | null
  dealerId: string
}>()

const emit = defineEmits<{
  close: []
  archive: []
}>()

const { t } = useI18n()

const _loading = ref(false)
const reviewCopied = ref(false)
const reviewBaseUrl = computed(() => `/vehiculo/${props.vehicleId}?review=1`)

async function copyReviewLink() {
  try {
    await navigator.clipboard.writeText(window.location.origin + reviewBaseUrl.value)
    reviewCopied.value = true
    setTimeout(() => {
      reviewCopied.value = false
    }, 2000)
  } catch {
    // fallback — do nothing
  }
}

function handleArchive() {
  emit('archive')
  emit('close')
}

function handleClose() {
  emit('close')
}

const formattedPrice = computed(() => {
  if (!props.salePrice) return null
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    props.salePrice,
  )
})
</script>

<template>
  <div
    class="post-sale-overlay"
    role="dialog"
    :aria-label="t('lifecycle.postSale.title')"
    @click.self="handleClose"
  >
    <div class="post-sale-modal">
      <!-- Header -->
      <div class="modal-header">
        <div class="sale-confirmed">
          <span class="check-icon" aria-hidden="true">✓</span>
          <div>
            <h2>{{ t('lifecycle.postSale.title') }}</h2>
            <p class="sale-subtitle">
              {{ vehicleName }}
              <span v-if="formattedPrice" class="sale-price">— {{ formattedPrice }}</span>
            </p>
          </div>
        </div>
        <button class="close-btn" :aria-label="t('common.close')" @click="handleClose">✕</button>
      </div>

      <!-- Actions -->
      <div class="actions-grid">
        <!-- Review request -->
        <div class="action-card">
          <div class="action-icon" aria-hidden="true">⭐</div>
          <div class="action-content">
            <h3>{{ t('lifecycle.postSale.reviewTitle') }}</h3>
            <p>{{ t('lifecycle.postSale.reviewDesc') }}</p>
          </div>
          <button
            class="action-btn"
            :class="{ 'btn-success': reviewCopied }"
            @click="copyReviewLink"
          >
            {{
              reviewCopied ? t('lifecycle.postSale.linkCopied') : t('lifecycle.postSale.copyLink')
            }}
          </button>
        </div>

        <!-- Archive -->
        <div class="action-card">
          <div class="action-icon" aria-hidden="true">📦</div>
          <div class="action-content">
            <h3>{{ t('lifecycle.postSale.archiveTitle') }}</h3>
            <p>{{ t('lifecycle.postSale.archiveDesc') }}</p>
          </div>
          <button class="action-btn" @click="handleArchive">
            {{ t('lifecycle.postSale.archiveBtn') }}
          </button>
        </div>

        <!-- Share sale -->
        <div class="action-card">
          <div class="action-icon" aria-hidden="true">🎉</div>
          <div class="action-content">
            <h3>{{ t('lifecycle.postSale.shareTitle') }}</h3>
            <p>{{ t('lifecycle.postSale.shareDesc') }}</p>
          </div>
          <NuxtLink
            :to="`/dashboard/herramientas/exportar-anuncio?id=${vehicleId}&mode=sold`"
            class="action-btn"
          >
            {{ t('lifecycle.postSale.shareBtn') }}
          </NuxtLink>
        </div>
      </div>

      <button class="skip-btn" @click="handleClose">
        {{ t('lifecycle.postSale.skip') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.post-sale-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.post-sale-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg, 0.75rem);
  padding: 1.5rem;
  width: 100%;
  max-width: 32rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.sale-confirmed {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.check-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-success, #22c55e);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.sale-subtitle {
  margin: 0.25rem 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.sale-price {
  font-weight: 600;
  color: var(--color-success, #22c55e);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.actions-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.action-card {
  display: grid;
  grid-template-columns: 2.5rem 1fr auto;
  gap: 0.625rem;
  align-items: center;
  padding: 0.875rem;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background: var(--bg-secondary);
}

.action-icon {
  font-size: 1.5rem;
  text-align: center;
}

.action-content h3 {
  margin: 0 0 0.125rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.action-content p {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.action-btn {
  padding: 0.375rem 0.75rem;
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  white-space: nowrap;
  min-height: 2.75rem;
  line-height: 2;
  transition: opacity 0.15s;
}

.action-btn:hover {
  opacity: 0.85;
}

.action-btn.btn-success {
  background: var(--color-success, #22c55e);
}

.skip-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-align: center;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding: 0.25rem;
}

@media (min-width: 480px) {
  .action-card {
    gap: 0.875rem;
  }
}
</style>
