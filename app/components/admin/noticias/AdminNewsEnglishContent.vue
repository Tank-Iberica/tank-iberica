<script setup lang="ts">
defineProps<{
  titleEn: string | null
  descriptionEn: string | null
  contentEn: string | null
  open: boolean
}>()

defineEmits<{
  'update:open': [value: boolean]
  'update:titleEn': [value: string | null]
  'update:descriptionEn': [value: string | null]
  'update:contentEn': [value: string | null]
}>()
</script>

<template>
  <div class="section">
    <button class="section-toggle" @click="$emit('update:open', !open)">
      <span>Contenido en Ingles</span>
      <span class="toggle-icon">{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="section-body">
      <div class="field">
        <label>Titulo (EN)</label>
        <input
          type="text"
          class="input"
          placeholder="English title..."
          :value="titleEn || ''"
          @input="$emit('update:titleEn', ($event.target as HTMLInputElement).value || null)"
        />
      </div>
      <div class="field">
        <label>Meta Descripcion (EN)</label>
        <textarea
          rows="2"
          class="input textarea"
          maxlength="200"
          placeholder="English meta description (120-160 chars)..."
          :value="descriptionEn || ''"
          @input="
            $emit('update:descriptionEn', ($event.target as HTMLTextAreaElement).value || null)
          "
        />
      </div>
      <div class="field">
        <label>Contenido (EN)</label>
        <textarea
          rows="8"
          class="input textarea"
          placeholder="English content..."
          :value="contentEn || ''"
          @input="$emit('update:contentEn', ($event.target as HTMLTextAreaElement).value || null)"
        />
      </div>
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

.section-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
}

.toggle-icon {
  font-size: 1.2rem;
  color: var(--text-disabled);
}

.section-body {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
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

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}
</style>
