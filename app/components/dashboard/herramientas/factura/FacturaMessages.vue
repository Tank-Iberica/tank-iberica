<script setup lang="ts">
defineProps<{
  errorMessage: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  (e: 'dismiss-error' | 'dismiss-success'): void
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
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.message--error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.message--success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.message__close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
