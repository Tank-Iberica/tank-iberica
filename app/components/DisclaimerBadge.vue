<template>
  <span class="disclaimer-badge" @click="showTooltip = !showTooltip">
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="info-icon"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
    <Transition name="tooltip">
      <div v-if="showTooltip" class="badge-tooltip" @click.stop>
        <strong>{{ $t('disclaimer.badgeTitle') }}</strong>
        <p>{{ $t('disclaimer.badgeText') }}</p>
      </div>
    </Transition>
  </span>
</template>

<script setup lang="ts">
const showTooltip = ref(false)

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.disclaimer-badge')) {
    showTooltip.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.disclaimer-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-left: var(--spacing-1);
  vertical-align: middle;
}

.info-icon {
  color: var(--text-secondary, var(--color-gray-500));
  opacity: 0.6;
  transition: opacity 0.2s;
}

.disclaimer-badge:hover .info-icon {
  opacity: 1;
}

.badge-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-xs);
  line-height: 1.5;
  width: 17.5rem;
  max-width: 90vw;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.badge-tooltip strong {
  display: block;
  margin-bottom: var(--spacing-1);
  font-size: 0.8125rem;
}

.badge-tooltip p {
  margin: 0;
  opacity: 0.9;
}

.badge-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--color-primary);
}

.tooltip-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.tooltip-leave-active {
  transition: opacity 0.1s ease;
}
.tooltip-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}
.tooltip-leave-to {
  opacity: 0;
}

@media (min-width: 48em) {
  .badge-tooltip {
    width: 20rem;
  }
}
</style>
