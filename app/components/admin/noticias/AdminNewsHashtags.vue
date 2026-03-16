<script setup lang="ts">
defineProps<{
  hashtags: string[]
  hashtagInput: string
}>()

defineEmits<{
  'update:hashtagInput': [value: string]
  addHashtag: []
  removeHashtag: [tag: string]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Etiquetas</div>
    <div class="hashtag-input-row">
      <input
        type="text"
        class="input"
        placeholder="Escribe y pulsa Enter"
        :value="hashtagInput"
        @input="$emit('update:hashtagInput', ($event.target as HTMLInputElement).value)"
        @keydown.enter.prevent="$emit('addHashtag')"
      >
      <button class="btn btn-sm" @click="$emit('addHashtag')">+ Anadir</button>
    </div>
    <div v-if="hashtags.length" class="hashtag-list">
      <span v-for="tag in hashtags" :key="tag" class="hashtag-chip">
        #{{ tag }}
        <button class="chip-remove" @click="$emit('removeHashtag', tag)">&times;</button>
      </span>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: var(--spacing-5);
  box-shadow: var(--shadow-card);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--color-gray-100);
}

.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: var(--color-gray-700);
  transition: all 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: 0.8rem;
}

.input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Hashtags */
.hashtag-input-row {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.hashtag-input-row .input {
  flex: 1;
}

.hashtag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.hashtag-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) 0.625rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--text-disabled);
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.chip-remove:hover {
  color: var(--color-error);
}
</style>
