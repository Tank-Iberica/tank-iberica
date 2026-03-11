<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: ['auth'] })

const { t } = useI18n()
const user = useSupabaseUser()
const supabase = useSupabaseClient()

usePageSeo({
  title: t('demo.widgetTitle'),
  description: t('demo.widgetSubtitle'),
  path: '/widget',
})

const dealerId = ref('')
const theme = ref<'light' | 'dark'>('light')
const layout = ref<'grid' | 'list'>('grid')
const vehicleCount = ref(6)
const copied = ref(false)

// Load dealer ID for the current user
onMounted(async () => {
  if (user.value) {
    const { data } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.value.id)
      .maybeSingle()

    if (data) {
      dealerId.value = data.id
    }
  }
})

const siteUrl = computed(() => {
  const config = useRuntimeConfig()
  return (config.public?.siteUrl as string) || 'https://tracciona.com'
})

const widgetUrl = computed(() => {
  if (!dealerId.value) return ''
  const params = new URLSearchParams({
    theme: theme.value,
    layout: layout.value,
    limit: String(vehicleCount.value),
  })
  return `${siteUrl.value}/api/widget/${dealerId.value}?${params.toString()}`
})

const snippetCode = computed(() => {
  if (!widgetUrl.value) return ''
  return `<iframe src="${widgetUrl.value}" style="width:100%;min-height:400px;border:none;" loading="lazy" title="Vehicles"></iframe>`
})

async function copySnippet() {
  if (!snippetCode.value) return
  await navigator.clipboard.writeText(snippetCode.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <div class="widget-page">
    <h1>{{ $t('demo.widgetTitle') }}</h1>
    <p class="subtitle">{{ $t('demo.widgetSubtitle') }}</p>

    <div v-if="!dealerId" class="no-dealer">
      <p>{{ $t('dealer.noDealerAccount') }}</p>
    </div>

    <template v-else>
      <div class="widget-controls">
        <div class="control-group">
          <label>{{ $t('demo.widgetTheme') }}</label>
          <div class="radio-group">
            <label>
              <input v-model="theme" type="radio" value="light" />
              {{ $t('demo.widgetLight') }}
            </label>
            <label>
              <input v-model="theme" type="radio" value="dark" />
              {{ $t('demo.widgetDark') }}
            </label>
          </div>
        </div>

        <div class="control-group">
          <label>Layout</label>
          <div class="radio-group">
            <label>
              <input v-model="layout" type="radio" value="grid" />
              Grid
            </label>
            <label>
              <input v-model="layout" type="radio" value="list" />
              List
            </label>
          </div>
        </div>

        <div class="control-group">
          <label for="vehicle-count">{{ $t('demo.widgetVehicles') }}</label>
          <select id="vehicle-count" v-model.number="vehicleCount">
            <option :value="3">3</option>
            <option :value="6">6</option>
            <option :value="9">9</option>
            <option :value="12">12</option>
          </select>
        </div>
      </div>

      <div class="snippet-section">
        <label>{{ $t('demo.widgetCopy') }}</label>
        <div class="snippet-box">
          <code>{{ snippetCode }}</code>
        </div>
        <button class="copy-btn" @click="copySnippet">
          {{ copied ? $t('demo.widgetCopied') : $t('demo.widgetCopy') }}
        </button>
      </div>

      <div class="preview-section">
        <h2>{{ $t('demo.widgetPreview') }}</h2>
        <div class="preview-frame">
          <iframe
            v-if="widgetUrl"
            :src="widgetUrl"
            class="widget-iframe"
            loading="lazy"
            title="Widget preview"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.widget-page {
  max-width: 50rem;
  margin: 0 auto;
  padding: var(--spacing-6) var(--spacing-4);
}

.widget-page h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, var(--color-primary));
  margin-bottom: var(--spacing-2);
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-6);
}

.no-dealer {
  padding: var(--spacing-6);
  text-align: center;
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
}

.widget-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  padding: var(--spacing-4);
  background: var(--color-gray-50);
  border-radius: var(--border-radius);
}

.control-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--text-primary);
}

.radio-group {
  display: flex;
  gap: var(--spacing-4);
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-weight: 400;
  cursor: pointer;
}

select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
}

.snippet-section {
  margin-bottom: var(--spacing-6);
}

.snippet-section > label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--text-primary);
}

.snippet-box {
  padding: var(--spacing-3);
  background: #1a1a2e;
  border-radius: var(--border-radius);
  overflow-x: auto;
  margin-bottom: var(--spacing-2);
}

.snippet-box code {
  color: var(--color-sky-400);
  font-size: 0.8rem;
  word-break: break-all;
}

.copy-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--primary, var(--color-primary));
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.preview-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-3);
  color: var(--text-primary);
}

.preview-frame {
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.widget-iframe {
  width: 100%;
  min-height: 25rem;
  border: none;
}

@media (max-width: 30em) {
  .widget-controls {
    flex-direction: column;
    gap: var(--spacing-4);
  }
}
</style>
