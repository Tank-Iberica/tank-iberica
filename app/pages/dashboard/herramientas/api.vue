<script setup lang="ts">
/**
 * API Key Management page for dealers.
 * Allows generating, viewing (masked), and regenerating API keys
 * for the Tracciona Valuation API.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const { userId } = useAuth()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

const apiKey = ref<string | null>(null)
const maskedKey = ref<string | null>(null)
const hasKey = ref(false)
const usageToday = ref(0)
const rateLimit = ref(0)
const loading = ref(true)
const generating = ref(false)
const showFullKey = ref(false)
const copySuccess = ref(false)
const error = ref<string | null>(null)

async function loadApiKeyInfo() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<{
      apiKey: string | null
      hasKey: boolean
      usageToday: number
      rateLimit: number
    }>('/api/dealer/api-key')

    maskedKey.value = data.apiKey
    hasKey.value = data.hasKey
    usageToday.value = data.usageToday
    rateLimit.value = data.rateLimit
  } catch {
    error.value = t('dashboard.api.loadError')
  } finally {
    loading.value = false
  }
}

async function generateKey() {
  generating.value = true
  error.value = null
  showFullKey.value = false

  try {
    const data = await $fetch<{ apiKey: string; rateLimit: number }>('/api/dealer/api-key', {
      method: 'POST',
      headers: { 'x-requested-with': 'XMLHttpRequest' },
    })

    apiKey.value = data.apiKey
    showFullKey.value = true
    rateLimit.value = data.rateLimit
    hasKey.value = true
    usageToday.value = 0
  } catch {
    error.value = t('dashboard.api.generateError')
  } finally {
    generating.value = false
  }
}

async function copyKey() {
  const key = apiKey.value || maskedKey.value
  if (!key) return

  try {
    await navigator.clipboard.writeText(key)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    // Fallback: silent fail
  }
}

const isPaidPlan = computed(() => {
  return currentPlan.value !== 'free'
})

onMounted(async () => {
  await fetchSubscription()
  if (isPaidPlan.value) {
    await loadApiKeyInfo()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <div class="api-page">
    <header class="page-header">
      <h1>{{ t('dashboard.api.title') }}</h1>
      <p class="page-subtitle">{{ t('dashboard.api.subtitle') }}</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <!-- Plan gate -->
    <div v-else-if="!isPaidPlan" class="gate-card">
      <h2>{{ t('dashboard.api.requiresPlan') }}</h2>
      <p>{{ t('dashboard.api.requiresPlanDesc') }}</p>
      <NuxtLink to="/precios" class="btn-upgrade">
        {{ t('dashboard.api.upgradePlan') }}
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Error -->
      <p v-if="error" class="error-msg">{{ error }}</p>

      <!-- API Key display -->
      <div class="api-card">
        <h2 class="card-title">{{ t('dashboard.api.yourKey') }}</h2>

        <div v-if="hasKey || showFullKey" class="key-display">
          <code class="key-value">{{ showFullKey && apiKey ? apiKey : maskedKey }}</code>
          <button class="btn-copy" @click="copyKey">
            {{ copySuccess ? t('dashboard.api.copied') : t('dashboard.api.copy') }}
          </button>
        </div>

        <p v-if="showFullKey" class="key-warning">
          {{ t('dashboard.api.keyWarning') }}
        </p>

        <div class="key-actions">
          <button class="btn-generate" :disabled="generating" @click="generateKey">
            {{ hasKey ? t('dashboard.api.regenerate') : t('dashboard.api.generate') }}
          </button>
        </div>
      </div>

      <!-- Usage stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">{{ t('dashboard.api.usageToday') }}</span>
          <span class="stat-value">{{ usageToday }} / {{ rateLimit }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('dashboard.api.plan') }}</span>
          <span class="stat-value">{{ currentPlan }}</span>
        </div>
      </div>

      <!-- API documentation -->
      <div class="docs-card">
        <h2 class="card-title">{{ t('dashboard.api.docsTitle') }}</h2>
        <p class="docs-desc">{{ t('dashboard.api.docsDesc') }}</p>

        <div class="code-block">
          <pre><code>curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://tracciona.com/api/v1/valuation?brand=scania&amp;subcategory=tractora"</code></pre>
        </div>

        <h3 class="docs-subtitle">{{ t('dashboard.api.params') }}</h3>
        <ul class="params-list">
          <li><code>brand</code> — {{ t('dashboard.api.paramBrand') }}</li>
          <li><code>subcategory</code> — {{ t('dashboard.api.paramSubcategory') }}</li>
          <li><code>province</code> — {{ t('dashboard.api.paramProvince') }}</li>
          <li><code>year</code> — {{ t('dashboard.api.paramYear') }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.api-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-4);
}

.page-header {
  margin-bottom: var(--spacing-2);
}

.page-header h1 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-top: var(--spacing-1);
}

.gate-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-8);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.gate-card h2 {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.gate-card p {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.btn-upgrade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-6);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  min-height: 44px;
  line-height: var(--line-height-normal);
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.api-card,
.docs-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.key-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}

.key-value {
  flex: 1;
  font-size: var(--font-size-sm);
  word-break: break-all;
  color: var(--text-primary);
}

.btn-copy {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  white-space: nowrap;
  min-height: 36px;
}

.key-warning {
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  margin-bottom: var(--spacing-3);
}

.key-actions {
  display: flex;
  gap: var(--spacing-2);
}

.btn-generate {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  min-height: 44px;
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.docs-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-4);
}

.code-block {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-4);
  overflow-x: auto;
  margin-bottom: var(--spacing-4);
}

.code-block pre {
  margin: 0;
}

.code-block code {
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.docs-subtitle {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-2);
}

.params-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.params-list li {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.params-list code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-10);
}
</style>
