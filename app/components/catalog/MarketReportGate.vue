<template>
  <div class="mrgm-card" :class="{ 'mrgm-card--compact': compact }">
    <div class="mrgm-card__inner">
      <!-- Header -->
      <div class="mrgm-header">
        <span class="mrgm-badge">{{ $t('catalog.marketReport.badge') }}</span>
        <h2 class="mrgm-title">{{ $t('catalog.marketReport.title') }}</h2>
        <p class="mrgm-subtitle">{{ $t('catalog.marketReport.subtitle') }}</p>
      </div>

      <!-- Live stats (shown when report metadata available) -->
      <div v-if="reportMeta?.available && !compact" class="mrgm-stats">
        <div v-if="reportMeta.reportData?.totalListings" class="mrgm-stat">
          <span class="mrgm-stat__value">{{
            formatNumber(reportMeta.reportData.totalListings as number)
          }}</span>
          <span class="mrgm-stat__label">{{ $t('catalog.marketReport.statsListings') }}</span>
        </div>
        <div v-if="reportMeta.reportData?.avgPrice" class="mrgm-stat">
          <span class="mrgm-stat__value">{{
            formatEUR(reportMeta.reportData.avgPrice as number)
          }}</span>
          <span class="mrgm-stat__label">{{ $t('catalog.marketReport.statsAvgPrice') }}</span>
        </div>
        <div v-if="reportMeta.quarter" class="mrgm-stat">
          <span class="mrgm-stat__value">{{ reportMeta.quarter }}</span>
          <span class="mrgm-stat__label">{{ $t('catalog.marketReport.statsQuarter') }}</span>
        </div>
      </div>

      <!-- What's inside -->
      <ul v-if="!compact" class="mrgm-features">
        <li
          v-for="item in $tm('catalog.marketReport.features')"
          :key="item as string"
          class="mrgm-feature"
        >
          <span class="mrgm-feature__icon" aria-hidden="true">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>

      <!-- Success state -->
      <div v-if="state === 'success'" class="mrgm-success" role="status">
        <p class="mrgm-success__msg">{{ $t('catalog.marketReport.successMsg') }}</p>
        <a
          v-if="downloadUrl"
          :href="downloadUrl"
          class="mrgm-btn mrgm-btn--primary"
          :download="downloadFilename"
          @click="onManualDownload"
        >
          {{ $t('catalog.marketReport.downloadBtn') }}
        </a>
        <p class="mrgm-success__hint">{{ $t('catalog.marketReport.printHint') }}</p>
      </div>

      <!-- Form (default state) -->
      <form v-else class="mrgm-form" novalidate @submit.prevent="onSubmit">
        <div class="mrgm-field">
          <label for="mrgm-email" class="mrgm-label">
            {{ $t('catalog.marketReport.emailLabel') }}
            <input
              id="mrgm-email"
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              :placeholder="$t('catalog.marketReport.emailPlaceholder')"
              :disabled="state === 'loading'"
              class="mrgm-input"
              :class="{ 'mrgm-input--error': fieldError }"
              :aria-invalid="!!fieldError"
              :aria-describedby="fieldError ? 'mrgm-email-error' : undefined"
              required
            >
          </label>
          <p v-if="fieldError" id="mrgm-email-error" class="mrgm-error" role="alert">
            {{ fieldError }}
          </p>
        </div>

        <button
          type="submit"
          class="mrgm-btn mrgm-btn--primary"
          :disabled="state === 'loading'"
          :aria-busy="state === 'loading'"
        >
          <span v-if="state === 'loading'" class="mrgm-btn__spinner" aria-hidden="true" />
          {{
            state === 'loading'
              ? $t('catalog.marketReport.loadingBtn')
              : $t('catalog.marketReport.submitBtn')
          }}
        </button>

        <p class="mrgm-privacy">{{ $t('catalog.marketReport.privacy') }}</p>
      </form>

      <!-- Generic error -->
      <p v-if="generalError" class="mrgm-error mrgm-error--general" role="alert">
        {{ generalError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ReportMeta {
  available: boolean
  quarter: string | null
  generatedAt: string | null
  reportData: Record<string, unknown>
}

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const { locale } = useI18n()

const email = ref('')
const state = ref<'idle' | 'loading' | 'success'>('idle')
const fieldError = ref('')
const generalError = ref('')
const downloadUrl = ref('')
const downloadFilename = ref('')

// Fetch latest report metadata for stats display
const { data: reportMeta } = await useFetch<ReportMeta>('/api/market-report/latest', {
  query: computed(() => ({ locale: locale.value })),
  lazy: true,
  default: () => ({ available: false, quarter: null, generatedAt: null, reportData: {} }),
})

function validateEmail(val: string): string {
  if (!val) return 'El email es requerido'
  const at = val.indexOf('@')
  const dot = val.lastIndexOf('.')
  if (at < 1 || dot <= at + 1 || dot >= val.length - 1 || val.includes(' ')) return 'Email inválido'
  return ''
}

async function onSubmit() {
  fieldError.value = validateEmail(email.value)
  if (fieldError.value) return

  state.value = 'loading'
  generalError.value = ''

  try {
    const res = await $fetch<
      { ok: boolean; url?: string; filename?: string; type?: string } | string
    >('/api/market-report/download', {
      method: 'POST',
      body: { email: email.value, locale: locale.value },
    })

    if (typeof res === 'string') {
      // On-the-fly HTML returned — trigger download via blob
      const blob = new Blob([res], { type: 'text/html' })
      const objUrl = URL.createObjectURL(blob)
      downloadUrl.value = objUrl
      downloadFilename.value = `informe-mercado-${locale.value}.html`
      triggerDownload(objUrl, downloadFilename.value)
    } else if (res?.url) {
      downloadUrl.value = res.url
      downloadFilename.value = res.filename ?? `informe-mercado-${locale.value}.html`
      triggerDownload(res.url, downloadFilename.value)
    }

    state.value = 'success'
  } catch (err: unknown) {
    state.value = 'idle'
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('429')) {
      generalError.value = 'Demasiadas solicitudes. Inténtalo más tarde.'
    } else if (msg.includes('Email')) {
      fieldError.value = msg
    } else {
      generalError.value = 'Error al procesar la solicitud. Inténtalo de nuevo.'
    }
  }
}

function triggerDownload(url: string, filename: string) {
  if (globalThis.window === undefined) return
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function onManualDownload() {
  // Manual button — download URL is already set
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-ES')
}

function formatEUR(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
</script>

<style scoped>
.mrgm-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  container-type: inline-size;
}

.mrgm-card__inner {
  padding: var(--space-6);
}

.mrgm-card--compact .mrgm-card__inner {
  padding: var(--space-4);
}

/* Header */
.mrgm-header {
  margin-bottom: var(--space-5);
}

.mrgm-badge {
  display: inline-block;
  background: #23424a;
  color: #ffffff;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
}

.mrgm-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--space-2);
  line-height: 1.3;
}

.mrgm-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* Stats grid */
.mrgm-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  background: color-mix(in srgb, #23424a 8%, transparent);
  border-radius: var(--radius-md);
}

@container (max-width: 360px) {
  .mrgm-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mrgm-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mrgm-stat__value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #23424a;
}

.mrgm-stat__label {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

/* Features list */
.mrgm-features {
  list-style: none;
  margin-bottom: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mrgm-feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.mrgm-feature__icon {
  color: #23424a;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

/* Form */
.mrgm-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mrgm-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.mrgm-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.mrgm-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  color: var(--color-text);
  background: var(--color-bg);
  min-height: 2.75rem;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.mrgm-input:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 3px color-mix(in srgb, #23424a 20%, transparent);
}

.mrgm-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mrgm-input--error {
  border-color: var(--color-error, #dc2626);
}

/* Button */
.mrgm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 2.75rem;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;
  text-decoration: none;
}

.mrgm-btn--primary {
  background: #23424a;
  color: #ffffff;
  width: 100%;
}

.mrgm-btn--primary:hover:not(:disabled) {
  background: color-mix(in srgb, #23424a 85%, #000);
}

.mrgm-btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mrgm-btn__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255 255 255 / 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: mrgm-spin 0.7s linear infinite;
}

@keyframes mrgm-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Privacy */
.mrgm-privacy {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}

/* Error */
.mrgm-error {
  font-size: 0.8125rem;
  color: var(--color-error, #dc2626);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.mrgm-error--general {
  margin-top: var(--space-2);
}

/* Success state */
.mrgm-success {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;
}

.mrgm-success__msg {
  font-size: 1rem;
  color: var(--color-text);
  font-weight: 500;
}

.mrgm-success__hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .mrgm-stats {
    background: color-mix(in srgb, #ffffff 6%, transparent);
  }

  .mrgm-stat__value {
    color: color-mix(in srgb, #23424a 60%, #ffffff);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mrgm-btn__spinner {
    animation: none;
    opacity: 0.6;
  }
}
</style>
