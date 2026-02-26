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
              <input v-model="theme" type="radio" value="light" >
              {{ $t('demo.widgetLight') }}
            </label>
            <label>
              <input v-model="theme" type="radio" value="dark" >
              {{ $t('demo.widgetDark') }}
            </label>
          </div>
        </div>

        <div class="control-group">
          <label>Layout</label>
          <div class="radio-group">
            <label>
              <input v-model="layout" type="radio" value="grid" >
              Grid
            </label>
            <label>
              <input v-model="layout" type="radio" value="list" >
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
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

.widget-page h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  margin-bottom: 24px;
}

.no-dealer {
  padding: 24px;
  text-align: center;
  background: #f9f9f9;
  border-radius: 8px;
  color: #666;
}

.widget-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.control-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  cursor: pointer;
}

select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.snippet-section {
  margin-bottom: 24px;
}

.snippet-section > label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.snippet-box {
  padding: 12px;
  background: #1a1a2e;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 8px;
}

.snippet-box code {
  color: #4fc3f7;
  font-size: 0.8rem;
  word-break: break-all;
}

.copy-btn {
  padding: 8px 16px;
  background: var(--primary, #23424a);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 44px;
}

.preview-section h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.preview-frame {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.widget-iframe {
  width: 100%;
  min-height: 400px;
  border: none;
}

@media (max-width: 480px) {
  .widget-controls {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
