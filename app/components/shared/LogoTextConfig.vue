<script lang="ts">
/**
 * Curated font list — commercially safe Google Fonts for B2B portals.
 * Each entry includes available weights to avoid requesting non-existent variants.
 */
export interface FontOption {
  value: string
  label: string
  weights: number[]
}

export interface LogoTextSettings {
  font_family: string
  font_weight: string
  letter_spacing: string
  italic: boolean
  uppercase: boolean
}

export const CURATED_FONTS: FontOption[] = [
  { value: 'Inter', label: 'Inter — moderno y legible', weights: [400, 500, 600, 700, 800] },
  { value: 'Barlow', label: 'Barlow — industrial y directo', weights: [400, 500, 600, 700, 800] },
  {
    value: 'Barlow Condensed',
    label: 'Barlow Condensed — compacto y fuerte',
    weights: [400, 500, 600, 700, 800],
  },
  {
    value: 'Montserrat',
    label: 'Montserrat — versátil y profesional',
    weights: [400, 500, 600, 700, 800],
  },
  {
    value: 'Oswald',
    label: 'Oswald — condensado y con autoridad',
    weights: [400, 500, 600, 700],
  },
  {
    value: 'Raleway',
    label: 'Raleway — elegante y limpio',
    weights: [400, 500, 600, 700, 800],
  },
  {
    value: 'Space Grotesk',
    label: 'Space Grotesk — técnico y geométrico',
    weights: [400, 500, 600, 700],
  },
  { value: 'DM Sans', label: 'DM Sans — neutro y funcional', weights: [400, 500, 600, 700] },
  {
    value: 'Outfit',
    label: 'Outfit — redondeado y accesible',
    weights: [400, 500, 600, 700, 800],
  },
  {
    value: 'Bebas Neue',
    label: 'Bebas Neue — impactante (solo mayúsculas)',
    weights: [400],
  },
]

export const LETTER_SPACING_OPTIONS = [
  { value: '-0.05em', label: 'Compacto' },
  { value: '0em', label: 'Normal' },
  { value: '0.05em', label: 'Amplio' },
  { value: '0.1em', label: 'Muy amplio' },
  { value: '0.25em', label: 'Extendido' },
]

export const WEIGHT_LABELS: Record<number, string> = {
  400: 'Regular',
  500: 'Medium',
  600: 'Semi-bold',
  700: 'Bold',
  800: 'Extra-bold',
}
</script>

<script setup lang="ts">
const props = defineProps<{
  /** The company/portal name to preview */
  previewName: string
  modelValue: LogoTextSettings
}>()

const emit = defineEmits<{
  'update:modelValue': [value: LogoTextSettings]
}>()

const settings = computed(() => props.modelValue)

function update(patch: Partial<LogoTextSettings>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const selectedFont = computed(
  () => CURATED_FONTS.find((f) => f.value === settings.value.font_family) ?? CURATED_FONTS[0],
)

const availableWeights = computed(() => selectedFont.value?.weights ?? [400, 700])

// Load Google Font dynamically when font changes
watch(
  () => settings.value.font_family,
  (font) => {
    if (!import.meta.client || !font) return
    const fontId = `gfont-${font.replaceAll(/\s+/g, '-').toLowerCase()}`
    if (document.getElementById(fontId)) return
    const f = CURATED_FONTS.find((x) => x.value === font)
    const weightsParam = (f?.weights ?? [400, 700]).join(';')
    const link = document.createElement('link')
    link.id = fontId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@${weightsParam}&display=swap`
    document.head.appendChild(link)
  },
  { immediate: true },
)

// Reset weight if not available in new font
watch(availableWeights, (weights) => {
  if (!weights.includes(Number(settings.value.font_weight))) {
    update({ font_weight: String(weights.at(-1)) })
  }
})

const previewStyle = computed(() => ({
  fontFamily: `'${settings.value.font_family}', sans-serif`,
  fontWeight: settings.value.font_weight,
  letterSpacing: settings.value.letter_spacing,
  fontStyle: settings.value.italic ? 'italic' : 'normal',
  textTransform: settings.value.uppercase ? 'uppercase' : 'none',
}))

const { t } = useI18n()

const displayName = computed(() => props.previewName || t('shared.logoText.previewFallback'))
</script>

<template>
  <div class="logo-text-config">
    <p class="ltc-hint">{{ t('shared.logoText.hint') }}</p>

    <!-- Live preview -->
    <div class="ltc-preview" :aria-label="t('shared.logoText.previewAriaLabel')">
      <span class="ltc-preview-text" :style="previewStyle">{{ displayName }}</span>
    </div>

    <!-- Font family -->
    <div class="ltc-field">
      <label class="ltc-label">{{ t('shared.logoText.fontFamily') }}</label>
      <select
        :value="settings.font_family"
        class="ltc-select"
        @change="update({ font_family: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="font in CURATED_FONTS" :key="font.value" :value="font.value">
          {{ font.label }}
        </option>
      </select>
    </div>

    <!-- Font weight -->
    <div class="ltc-field">
      <label class="ltc-label">{{ t('shared.logoText.fontWeight') }}</label>
      <div class="ltc-weight-row">
        <button
          v-for="w in availableWeights"
          :key="w"
          type="button"
          class="ltc-weight-btn"
          :class="{ active: settings.font_weight === String(w) }"
          :style="{ fontWeight: w }"
          @click="update({ font_weight: String(w) })"
        >
          {{ WEIGHT_LABELS[w] ?? w }}
        </button>
      </div>
    </div>

    <!-- Letter spacing -->
    <div class="ltc-field">
      <label class="ltc-label">{{ t('shared.logoText.letterSpacing') }}</label>
      <div class="ltc-spacing-row">
        <button
          v-for="opt in LETTER_SPACING_OPTIONS"
          :key="opt.value"
          type="button"
          class="ltc-spacing-btn"
          :class="{ active: settings.letter_spacing === opt.value }"
          @click="update({ letter_spacing: opt.value })"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Toggles: italic, uppercase -->
    <div class="ltc-toggles">
      <button
        type="button"
        class="ltc-toggle-btn"
        :class="{ active: settings.italic }"
        :style="{ fontStyle: 'italic' }"
        :aria-pressed="settings.italic"
        @click="update({ italic: !settings.italic })"
      >
        <em>It</em> {{ t('shared.logoText.italic') }}
      </button>
      <button
        type="button"
        class="ltc-toggle-btn"
        :class="{ active: settings.uppercase }"
        :aria-pressed="settings.uppercase"
        @click="update({ uppercase: !settings.uppercase })"
      >
        AA {{ t('shared.logoText.uppercase') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.logo-text-config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ltc-hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}

/* Preview */
.ltc-preview {
  padding: 1.25rem 1rem;
  background: var(--bg-secondary);
  border: 1px dashed var(--color-gray-300);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 4.5rem;
  overflow: hidden;
}

.ltc-preview-text {
  font-size: clamp(1.2rem, 4vw, 1.75rem);
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Fields */
.ltc-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ltc-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ltc-select {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 2.75rem;
  cursor: pointer;
}

.ltc-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Weight buttons */
.ltc-weight-row,
.ltc-spacing-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.ltc-weight-btn,
.ltc-spacing-btn {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.25rem;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}

.ltc-weight-btn.active,
.ltc-spacing-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

@media (hover: hover) {
  .ltc-weight-btn:not(.active):hover,
  .ltc-spacing-btn:not(.active):hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

/* Toggles */
.ltc-toggles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ltc-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
  transition:
    border-color 0.15s,
    background 0.15s,
    color 0.15s;
}

.ltc-toggle-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

@media (hover: hover) {
  .ltc-toggle-btn:not(.active):hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}
</style>
