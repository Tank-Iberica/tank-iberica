<template>
  <div class="success-checkmark" :class="{ visible: show }" role="img" :aria-label="label || $t('common.success')">
    <svg
      class="checkmark-svg"
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden="true"
    >
      <circle class="checkmark-circle" cx="26" cy="26" r="23" />
      <path class="checkmark-check" d="M14 26l8 8 16-16" />
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show?: boolean
  label?: string
}>()
</script>

<style scoped>
.success-checkmark {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.success-checkmark.visible {
  opacity: 1;
  transform: scale(1);
}

.checkmark-svg {
  width: 3.25rem;
  height: 3.25rem;
}

.checkmark-circle {
  stroke: var(--color-success, #16a34a);
  stroke-width: 2.5;
  stroke-dasharray: 145;
  stroke-dashoffset: 145;
  stroke-linecap: round;
  fill: none;
}

.success-checkmark.visible .checkmark-circle {
  animation: draw-circle 0.45s ease-out 0.05s forwards;
}

.checkmark-check {
  stroke: var(--color-success, #16a34a);
  stroke-width: 3;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.success-checkmark.visible .checkmark-check {
  animation: draw-check 0.3s ease-out 0.4s forwards;
}

@keyframes draw-circle {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .success-checkmark.visible .checkmark-circle,
  .success-checkmark.visible .checkmark-check {
    animation: none;
    stroke-dashoffset: 0;
  }

  .success-checkmark {
    transition: none;
  }
}
</style>
