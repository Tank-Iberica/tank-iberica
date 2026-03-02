<template>
  <div ref="wrapperRef" class="a11y-fab-wrapper">
    <!-- Panel de opciones -->
    <Transition name="a11y-panel">
      <div
        v-if="isOpen"
        class="a11y-panel"
        role="dialog"
        :aria-label="$t('a11y.panelTitle')"
        aria-modal="true"
      >
        <div class="a11y-panel__header">
          <span class="a11y-panel__title">{{ $t('a11y.panelTitle') }}</span>
          <button
            class="a11y-panel__close"
            :aria-label="$t('common.close')"
            @click="isOpen = false"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <!-- Sección: Apariencia -->
        <section class="a11y-panel__section">
          <h3 class="a11y-panel__section-title">{{ $t('a11y.appearance') }}</h3>
          <div class="a11y-chips" role="radiogroup" :aria-label="$t('a11y.appearance')">
            <button
              v-for="mode in themeModes"
              :key="mode.value"
              class="a11y-chip"
              :class="{ 'a11y-chip--active': colorMode.preference === mode.value }"
              role="radio"
              :aria-checked="colorMode.preference === mode.value"
              @click="setTheme(mode.value)"
            >
              <span class="a11y-chip__icon" aria-hidden="true">{{ mode.icon }}</span>
              <span class="a11y-chip__label">{{ $t(mode.labelKey) }}</span>
            </button>
          </div>
        </section>

        <!-- Sección: Tamaño de texto -->
        <section class="a11y-panel__section">
          <h3 class="a11y-panel__section-title">{{ $t('a11y.fontSize') }}</h3>
          <div class="a11y-sizes" role="radiogroup" :aria-label="$t('a11y.fontSize')">
            <button
              v-for="size in fontSizes"
              :key="size.value"
              class="a11y-size"
              :class="{ 'a11y-size--active': fontSize === size.value }"
              role="radio"
              :aria-checked="fontSize === size.value"
              :aria-label="$t(size.labelKey)"
              :style="{ fontSize: size.displaySize }"
              @click="setFontSize(size.value)"
            >
              A
            </button>
          </div>
        </section>
      </div>
    </Transition>

    <!-- Botón flotante -->
    <button
      class="a11y-fab"
      :class="{ 'a11y-fab--open': isOpen }"
      :aria-label="$t('a11y.fabLabel')"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      @click="isOpen = !isOpen"
    >
      <span aria-hidden="true" v-html="currentIcon" />
    </button>
  </div>
</template>

<script setup lang="ts">
const { colorMode, fontSize, setFontSize } = useAccessibility()
const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)

const themeModes = [
  { value: 'system', icon: '⊙', labelKey: 'a11y.themeAuto' },
  { value: 'light', icon: '☀', labelKey: 'a11y.themeLight' },
  { value: 'dark', icon: '☽', labelKey: 'a11y.themeDark' },
  { value: 'high-contrast', icon: '◑', labelKey: 'a11y.themeContrast' },
]

const fontSizes = [
  { value: 'normal', displaySize: '14px', labelKey: 'a11y.fontNormal' },
  { value: 'large', displaySize: '18px', labelKey: 'a11y.fontLarge' },
  { value: 'xlarge', displaySize: '22px', labelKey: 'a11y.fontXLarge' },
]

const iconMap: Record<string, string> = {
  light:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  dark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  'high-contrast':
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/></svg>',
  system:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18V3z" fill="currentColor" stroke="none"/></svg>',
}

const currentIcon = computed(() => {
  const pref = colorMode.preference
  if (pref === 'system') {
    return colorMode.value === 'dark' ? iconMap.dark : iconMap.light
  }
  return iconMap[pref] ?? iconMap.system
})

function setTheme(value: string) {
  colorMode.preference = value
}

function onDocumentClick(e: MouseEvent) {
  if (isOpen.value && wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* ---- Wrapper ---- */
.a11y-fab-wrapper {
  position: fixed;
  bottom: 20px;
  left: 16px;
  z-index: var(--z-popover, 600);
}

/* ---- FAB button ---- */
.a11y-fab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--border-radius-full);
  background: color-mix(in srgb, var(--color-primary) 14%, white);
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

@media (hover: hover) {
  .a11y-fab:hover {
    background: color-mix(in srgb, var(--color-primary) 20%, white);
    transform: scale(1.06);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
  }
}

.a11y-fab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.a11y-fab--open {
  background: color-mix(in srgb, var(--color-primary) 20%, white);
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
}

/* Dark mode */
html.dark-mode .a11y-fab {
  background: var(--color-primary-light);
  border-color: color-mix(in srgb, var(--color-primary-light) 60%, transparent);
  color: var(--text-on-dark-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (hover: hover) {
  html.dark-mode .a11y-fab:hover {
    background: color-mix(in srgb, var(--color-primary-light) 80%, white);
  }
}

/* High contrast */
html.high-contrast-mode .a11y-fab {
  background: var(--color-primary-hc);
  border-color: var(--border-color);
  color: #0d0d0d;
}

html.high-contrast-mode .a11y-chip--active,
html.high-contrast-mode .a11y-size--active {
  border-color: var(--color-primary-hc);
  color: var(--color-primary-hc);
}

/* ---- Panel ---- */
.a11y-panel {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  width: 272px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.a11y-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.a11y-panel__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.a11y-panel__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: var(--border-radius);
  color: var(--text-auxiliary);
  padding: 0;
  cursor: pointer;
}

@media (hover: hover) {
  .a11y-panel__close:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}

/* ---- Sección ---- */
.a11y-panel__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.a11y-panel__section-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ---- Chips de tema ---- */
.a11y-chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.a11y-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  min-height: 54px;
  border-radius: var(--border-radius);
  border: 1.5px solid var(--border-color-light);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
}

.a11y-chip__icon {
  font-size: 16px;
  line-height: 1;
}

.a11y-chip__label {
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
}

@media (hover: hover) {
  .a11y-chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.a11y-chip--active {
  border-color: var(--color-primary);
  background: var(--bg-primary);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* ---- Tamaños de fuente ---- */
.a11y-sizes {
  display: flex;
  gap: 8px;
}

.a11y-size {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: var(--border-radius);
  border: 1.5px solid var(--border-color-light);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

@media (hover: hover) {
  .a11y-size:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.a11y-size--active {
  border-color: var(--color-primary);
  background: var(--bg-primary);
  color: var(--color-primary);
}

/* ---- Animación del panel ---- */
.a11y-panel-enter-active,
.a11y-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.a11y-panel-enter-from,
.a11y-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
