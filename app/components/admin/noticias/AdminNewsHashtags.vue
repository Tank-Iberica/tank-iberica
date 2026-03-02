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
    <div v-if="hashtags.length > 0" class="hashtag-list">
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
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-gray-100);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--color-gray-200);
  background: var(--bg-primary);
  color: #374151;
  transition: all 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
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
  gap: 8px;
  margin-bottom: 8px;
}

.hashtag-input-row .input {
  flex: 1;
}

.hashtag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.hashtag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 16px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.chip-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
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
