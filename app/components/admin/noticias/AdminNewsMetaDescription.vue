<script setup lang="ts">
defineProps<{
  descriptionEs: string | null
  descLengthClass: string
}>()

defineEmits<{
  'update:descriptionEs': [value: string | null]
}>()

function getDescLengthLabel(len: number): string {
  if (len >= 120 && len <= 160) return 'Longitud ideal'
  if (len < 120) return 'Muy corta'
  return 'Larga'
}
</script>

<template>
  <div class="section">
    <div class="section-title">Meta Descripcion (SEO)</div>
    <p class="section-hint">
      Este texto aparece en los resultados de Google debajo del titulo. Debe ser un resumen
      atractivo que invite a hacer clic.
    </p>
    <div class="field">
      <label>Descripcion (ES)</label>
      <textarea
        rows="3"
        class="input textarea"
        maxlength="200"
        placeholder="Resumen atractivo de la noticia para Google (120-160 caracteres ideal)..."
        :value="descriptionEs || ''"
        @input="$emit('update:descriptionEs', ($event.target as HTMLTextAreaElement).value || null)"
      />
      <div class="count-row">
        <span class="char-count" :class="descLengthClass">
          {{ (descriptionEs || '').length }}/160 caracteres
        </span>
        <span v-if="(descriptionEs || '').length > 0" class="char-count" :class="descLengthClass">
          {{ getDescLengthLabel((descriptionEs || '').length) }}
        </span>
      </div>
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

.section-hint {
  font-size: 0.8rem;
  color: var(--text-disabled);
  margin: -8px 0 12px;
  line-height: 1.4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
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

.textarea {
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}

.count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
}

.char-count {
  font-size: 0.7rem;
  color: var(--text-disabled);
  text-align: right;
}

.count-good {
  color: var(--color-success);
}
.count-warning {
  color: var(--color-warning);
}
.count-bad {
  color: var(--color-error);
}
</style>
