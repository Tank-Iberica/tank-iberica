<script setup lang="ts">
interface TurnstileWidgetProps {
  siteKey?: string
  action?: string
  theme?: 'light' | 'dark' | 'auto'
}

interface TurnstileRenderParams {
  sitekey: string
  callback: (token: string) => void
  'error-callback': () => void
  theme: 'light' | 'dark' | 'auto'
  action?: string
}

interface TurnstileInstance {
  render: (container: HTMLElement, params: TurnstileRenderParams) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  var turnstile: TurnstileInstance | undefined
}

const props = withDefaults(defineProps<TurnstileWidgetProps>(), {
  siteKey: '',
  action: undefined,
  theme: 'auto',
})

const emit = defineEmits<{
  verified: [token: string]
  error: []
}>()

const config = useRuntimeConfig()
const containerRef = ref<HTMLElement | null>(null)
const widgetId = ref<string | null>(null)
const scriptLoaded = ref(false)

const resolvedSiteKey = computed(() => props.siteKey || (config.public.turnstileSiteKey as string))

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (globalThis.turnstile) {
      scriptLoaded.value = true
      resolve()
      return
    }

    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
    if (existing) {
      existing.addEventListener('load', () => {
        scriptLoaded.value = true
        resolve()
      })
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true

    script.onload = () => {
      scriptLoaded.value = true
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Failed to load Turnstile script'))
    }

    document.head.appendChild(script)
  })
}

function renderWidget() {
  if (!globalThis.turnstile || !containerRef.value || !resolvedSiteKey.value) return

  // Clean up existing widget
  if (widgetId.value !== null) {
    try {
      globalThis.turnstile.remove(widgetId.value)
    } catch {
      // Widget may already be removed
    }
    widgetId.value = null
  }

  const params: TurnstileRenderParams = {
    sitekey: resolvedSiteKey.value,
    callback: (token: string) => {
      emit('verified', token)
    },
    'error-callback': () => {
      emit('error')
    },
    theme: props.theme,
  }

  if (props.action) {
    params.action = props.action
  }

  widgetId.value = globalThis.turnstile.render(containerRef.value, params)
}

function reset() {
  if (globalThis.turnstile && widgetId.value !== null) {
    globalThis.turnstile.reset(widgetId.value)
  }
}

onMounted(async () => {
  try {
    await loadScript()
    await nextTick()
    renderWidget()
  } catch {
    emit('error')
  }
})

onBeforeUnmount(() => {
  if (globalThis.turnstile && widgetId.value !== null) {
    try {
      globalThis.turnstile.remove(widgetId.value)
    } catch {
      // Widget may already be removed
    }
    widgetId.value = null
  }
})

defineExpose({ reset })
</script>

<template>
  <div ref="containerRef" class="turnstile-widget" />
</template>

<style scoped>
.turnstile-widget {
  min-height: 65px;
}
</style>
