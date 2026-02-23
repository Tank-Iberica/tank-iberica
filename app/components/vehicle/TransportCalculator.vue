<template>
  <div class="transport-calculator">
    <!-- Header -->
    <div class="transport-header">
      <svg
        class="transport-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M1 3h15v13H1z" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
      <h3 class="transport-title">{{ $t('transport.title') }}</h3>
    </div>

    <!-- Origin (read-only) -->
    <div v-if="vehicle.location" class="transport-origin">
      <span class="origin-label">{{ $t('transport.from') }}:</span>
      <span class="origin-value">{{ vehicle.location }}</span>
    </div>

    <!-- Postal code input + calculate button -->
    <div class="transport-input-row">
      <input
        v-model="postalCode"
        type="text"
        class="transport-input"
        :placeholder="$t('transport.postalCodePlaceholder')"
        maxlength="10"
        inputmode="numeric"
        @keyup.enter="onCalculate"
      >
      <button
        class="transport-calc-btn"
        :disabled="calculating || !postalCode.trim()"
        @click="onCalculate"
      >
        <span v-if="calculating" class="spinner" />
        <span v-else>{{ $t('transport.calculate') }}</span>
      </button>
    </div>

    <!-- Error message -->
    <p v-if="transportError" class="transport-error">
      {{ transportError }}
    </p>

    <!-- Result section -->
    <div v-if="result && !submitted" class="transport-result">
      <!-- Standard zone with price -->
      <template v-if="result.zone && result.zoneSlug !== 'personalizado'">
        <div class="result-zone">
          <span class="result-zone-name">{{ result.zone.zone_name }}</span>
          <span v-if="result.isLocal" class="result-local-badge">
            {{ $t('transport.localDelivery') }}
          </span>
        </div>
        <div class="result-price">
          {{ formatCents(result.zone.price_cents) }}
        </div>
        <p class="result-includes">
          {{ $t('transport.includesNote') }}
        </p>
        <button class="transport-submit-btn" :disabled="loading" @click="onSubmit">
          <span v-if="loading" class="spinner" />
          <span v-else>{{ $t('transport.requestTransport') }}</span>
        </button>
      </template>

      <!-- Custom quote zone (islands, Ceuta, Melilla) -->
      <template v-else-if="result.zoneSlug === 'personalizado'">
        <div class="result-zone">
          <span class="result-zone-name">{{ $t('transport.customZone') }}</span>
        </div>
        <p class="result-custom-note">
          {{ $t('transport.customNote') }}
        </p>
        <button
          class="transport-submit-btn transport-submit-btn--outline"
          :disabled="loading"
          @click="onSubmit"
        >
          <span v-if="loading" class="spinner" />
          <span v-else>{{ $t('transport.requestQuote') }}</span>
        </button>
      </template>

      <!-- Zone not found -->
      <template v-else>
        <p class="result-not-found">
          {{ $t('transport.zoneNotFound') }}
        </p>
      </template>
    </div>

    <!-- Success message -->
    <div v-if="submitted" class="transport-success">
      <svg
        class="success-icon"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <p class="success-text">{{ $t('transport.requestSent') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTransport } from '~/composables/useTransport'
import { useUserLocation } from '~/composables/useUserLocation'
import type { CalculationResult } from '~/composables/useTransport'

const props = defineProps<{
  vehicle: {
    id: string
    location: string | null
    location_province: string | null
  }
}>()

const { t } = useI18n()

const {
  zones,
  loading,
  error: transportComposableError,
  fetchZones,
  calculatePrice,
  submitTransportRequest,
  resolveZoneFromPostalCode,
  formatCents,
} = useTransport()

const { detect: detectLocation } = useUserLocation()

const postalCode = ref('')
const result = ref<CalculationResult | null>(null)
const submitted = ref(false)
const calculating = ref(false)
const transportError = ref<string | null>(null)

onMounted(async () => {
  // Load transport zones
  await fetchZones()

  // Try to auto-detect user location for pre-filling postal code
  await detectLocation()
})

async function onCalculate() {
  const code = postalCode.value.trim()
  if (!code) return

  calculating.value = true
  transportError.value = null
  result.value = null
  submitted.value = false

  try {
    // Ensure zones are loaded
    if (zones.value.length === 0) {
      await fetchZones()
    }

    const zoneSlug = resolveZoneFromPostalCode(code)

    if (!zoneSlug) {
      transportError.value = t('transport.invalidPostalCode')
      return
    }

    result.value = calculatePrice(props.vehicle.location_province, code)

    // If we got a slug but no matching zone in DB (except personalizado)
    if (
      !result.value.zone &&
      result.value.zoneSlug !== 'personalizado' &&
      result.value.zoneSlug !== ''
    ) {
      transportError.value = t('transport.zoneNotFound')
      result.value = null
    }
  } catch {
    transportError.value = t('transport.calculationError')
  } finally {
    calculating.value = false
  }
}

async function onSubmit() {
  if (!result.value) return

  const vehicleProvince = props.vehicle.location_province
  let originZone = 'desconocido'

  if (vehicleProvince) {
    const region = (await import('~/utils/geoData')).PROVINCE_TO_REGION[vehicleProvince]
    if (region) {
      // Reuse the same mapping to get origin zone slug
      const regionToZone: Record<string, string> = {
        Galicia: 'zona-1',
        Asturias: 'zona-1',
        Cantabria: 'zona-1',
        'País Vasco': 'zona-1',
        Navarra: 'zona-1',
        Aragón: 'zona-1',
        Cataluña: 'zona-1',
        'Comunidad de Madrid': 'zona-2',
        'Castilla y León': 'zona-2',
        'Castilla-La Mancha': 'zona-2',
        Extremadura: 'zona-2',
        'La Rioja': 'zona-2',
        Andalucía: 'zona-3',
        'Región de Murcia': 'zona-3',
        'Comunidad Valenciana': 'zona-3',
        'Islas Baleares': 'personalizado',
        Canarias: 'personalizado',
        Ceuta: 'personalizado',
        Melilla: 'personalizado',
      }
      originZone = regionToZone[region] || 'desconocido'
    }
  }

  const estimatedPriceCents = result.value.zone?.price_cents ?? 0

  const request = await submitTransportRequest(
    props.vehicle.id,
    postalCode.value.trim(),
    estimatedPriceCents,
    originZone,
    result.value.zoneSlug,
  )

  if (request) {
    submitted.value = true
  } else if (transportComposableError.value) {
    transportError.value = transportComposableError.value
  }
}
</script>

<style scoped>
.transport-calculator {
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
}

/* Header */
.transport-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.transport-icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.transport-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

/* Origin */
.transport-origin {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.origin-label {
  font-weight: var(--font-weight-medium);
}

.origin-value {
  color: var(--text-primary);
}

/* Input row */
.transport-input-row {
  display: flex;
  gap: var(--spacing-2);
}

.transport-input {
  flex: 1;
  min-height: 44px;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: border-color var(--transition-fast);
}

.transport-input::placeholder {
  color: var(--text-auxiliary);
}

.transport-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.transport-calc-btn {
  min-height: 44px;
  min-width: 44px;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.transport-calc-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.transport-calc-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error */
.transport-error {
  font-size: var(--font-size-sm);
  color: var(--color-error);
  margin: 0;
}

/* Result */
.transport-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color-light);
}

.result-zone {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.result-zone-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.result-local-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  border-radius: var(--border-radius-full);
}

.result-price {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  line-height: var(--line-height-tight);
}

.result-includes {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  margin: 0;
}

.result-custom-note {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.result-not-found {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin: 0;
}

/* Submit button */
.transport-submit-btn {
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  width: 100%;
}

.transport-submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.transport-submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.transport-submit-btn--outline {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.transport-submit-btn--outline:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Success */
.transport-success {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--border-radius);
}

.success-icon {
  color: var(--color-success);
  flex-shrink: 0;
}

.success-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-success);
  margin: 0;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Desktop */
@media (min-width: 768px) {
  .transport-calculator {
    max-width: 400px;
  }
}
</style>
