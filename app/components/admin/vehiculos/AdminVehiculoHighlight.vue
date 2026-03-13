<template>
  <div class="highlight-section">
    <h3 class="section-title">{{ $t('vehicle.highlightStyle') }}</h3>
    <p class="section-desc">{{ $t('vehicle.highlightStyleDesc') }}</p>

    <div class="style-grid">
      <button
        v-for="option in STYLE_OPTIONS"
        :key="option.value"
        :class="[
          'style-option',
          `style-${option.value}`,
          { active: currentStyle === option.value },
        ]"
        :disabled="applying"
        @click="applyStyle(option.value)"
      >
        <span class="style-icon">{{ option.icon }}</span>
        <span class="style-name">{{ $t(`vehicle.highlight.${option.value}`) }}</span>
        <span class="style-cost">{{ $t('vehicle.highlightCost', { n: COST }) }}</span>
      </button>

      <!-- Remove option (if currently highlighted) -->
      <button
        v-if="currentStyle"
        :class="['style-option', 'style-remove']"
        :disabled="applying"
        @click="removeStyle"
      >
        <span class="style-icon">✕</span>
        <span class="style-name">{{ $t('vehicle.highlightRemove') }}</span>
        <span class="style-cost">{{ $t('vehicle.highlightRemoveFree') }}</span>
      </button>
    </div>

    <p v-if="currentStyle" class="active-label">
      {{ $t('vehicle.highlightActive', { style: $t(`vehicle.highlight.${currentStyle}`) }) }}
    </p>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const COST = 2

const STYLE_OPTIONS = [
  { value: 'gold', icon: '✦' },
  { value: 'premium', icon: '◈' },
  { value: 'spotlight', icon: '✧' },
  { value: 'urgent', icon: '!' },
] as const

const props = defineProps<{
  vehicleId: string
  initialStyle: string | null
}>()

const emit = defineEmits<{
  (e: 'updated', style: string | null): void
}>()

const currentStyle = ref<string | null>(props.initialStyle)
const applying = ref(false)
const error = ref<string | null>(null)
const { $csrfFetch } = useNuxtApp()

async function applyStyle(style: string) {
  if (applying.value) return
  error.value = null

  // Same style — idempotent, skip
  if (currentStyle.value === style) return

  applying.value = true
  try {
    const res = await $csrfFetch<{
      highlighted?: boolean
      style?: string
      alreadyApplied?: boolean
    }>('/api/credits/highlight-vehicle', {
      method: 'POST',
      body: { vehicleId: props.vehicleId, style },
    })
    currentStyle.value = res.style ?? style
    emit('updated', currentStyle.value)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message ?? e?.message ?? 'Error al aplicar estilo'
  } finally {
    applying.value = false
  }
}

async function removeStyle() {
  if (applying.value) return
  error.value = null
  applying.value = true
  try {
    await $csrfFetch(`/api/vehicles/${props.vehicleId}`, {
      method: 'PATCH',
      body: { highlight_style: null },
    })
    currentStyle.value = null
    emit('updated', null)
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    error.value = e?.data?.message ?? e?.message ?? 'Error al eliminar estilo'
  } finally {
    applying.value = false
  }
}
</script>

<style scoped>
.highlight-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-primary);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 30em) {
  .style-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem 0.75rem;
  border-radius: var(--border-radius-md);
  border: 2px solid transparent;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 5.5rem;
}

.style-option:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.style-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.style-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary);
}

.style-cost {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Per-style accent borders */
.style-gold {
  border-color: #d4af37;
}
.style-gold.active,
.style-gold:hover:not(:disabled) {
  background: rgba(212, 175, 55, 0.12);
}

.style-premium {
  border-color: var(--color-primary);
}
.style-premium.active,
.style-premium:hover:not(:disabled) {
  background: rgba(35, 66, 74, 0.1);
}

.style-spotlight {
  border-color: var(--color-gray-400, #9ca3af);
}
.style-spotlight.active,
.style-spotlight:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.8);
}

.style-urgent {
  border-color: var(--color-danger, #dc2626);
}
.style-urgent.active,
.style-urgent:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.08);
}

.style-remove {
  border-color: var(--color-gray-300, #d1d5db);
  grid-column: span 1;
}
.style-remove:hover:not(:disabled) {
  background: var(--bg-primary);
}

.active-label {
  font-size: var(--font-size-sm);
  color: var(--color-success-dark, #166534);
  font-weight: 500;
}

.error-msg {
  font-size: var(--font-size-sm);
  color: var(--color-danger, #dc2626);
}
</style>
