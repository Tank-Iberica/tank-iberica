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
  margin-left: 4px;
  vertical-align: middle;
}

.info-icon {
  color: var(--text-secondary, #6b7280);
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
  background: var(--color-primary, #23424a);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  width: 280px;
  max-width: 90vw;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.badge-tooltip strong {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
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
  border-top-color: var(--color-primary, #23424a);
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

@media (min-width: 768px) {
  .badge-tooltip {
    width: 320px;
  }
}
</style>
