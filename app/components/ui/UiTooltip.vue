<template>
  <span class="ui-tooltip-wrapper">
    <button
      type="button"
      class="ui-tooltip-trigger"
      :aria-label="label"
      :aria-describedby="tooltipId"
      @mouseenter="show = true"
      @mouseleave="show = false"
      @focus="show = true"
      @blur="show = false"
      @click.prevent="show = !show"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
    <Transition name="tooltip">
      <span v-if="show" :id="tooltipId" role="tooltip" class="ui-tooltip-content">
        <slot>{{ text }}</slot>
      </span>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const _props = defineProps<{
  text?: string
  label?: string
}>()

const show = ref(false)
const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 8)}`
</script>

<style scoped>
.ui-tooltip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ui-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-auxiliary);
  cursor: help;
  padding: 0.125rem;
  min-height: auto;
  min-width: auto;
  border-radius: 50%;
  transition: color var(--transition-fast);
}

.ui-tooltip-trigger:hover,
.ui-tooltip-trigger:focus-visible {
  color: var(--color-primary);
}

.ui-tooltip-content {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-near-black, #1a1a1a);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  padding: 0.375rem 0.625rem;
  border-radius: var(--border-radius);
  white-space: normal;
  width: max-content;
  max-width: 15rem;
  z-index: 50;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
</style>
