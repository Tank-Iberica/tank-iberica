<script setup lang="ts">
defineProps<{
  errorMessage: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  'dismiss-error': []
  'dismiss-success': []
}>()
</script>

<template>
  <div v-if="errorMessage" class="message message--error">
    {{ errorMessage }}
    <button class="message__close" @click="emit('dismiss-error')">&times;</button>
  </div>
  <div v-if="successMessage" class="message message--success">
    {{ successMessage }}
    <button class="message__close" @click="emit('dismiss-success')">&times;</button>
  </div>
</template>

<style scoped>
.message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  font-size: var(--font-size-sm);
}

.message--error {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
}

.message--success {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-green-700);
  border: 1px solid var(--color-success-border);
}

.message__close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: inherit;
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
