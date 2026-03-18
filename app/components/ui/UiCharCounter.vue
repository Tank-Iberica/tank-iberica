<template>
  <span
    class="char-counter"
    :class="{
      'char-counter--warning': pct >= 80 && pct < 100,
      'char-counter--limit': pct >= 100,
    }"
    aria-live="polite"
  >
    {{ current }}/{{ max }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
}>()

const pct = computed(() => (props.max > 0 ? (props.current / props.max) * 100 : 0))
</script>

<style scoped>
.char-counter {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-align: right;
  display: block;
  margin-top: 0.25rem;
}

.char-counter--warning {
  color: var(--color-warning-text, var(--color-warning));
}

.char-counter--limit {
  color: var(--color-error);
  font-weight: 600;
}
</style>
