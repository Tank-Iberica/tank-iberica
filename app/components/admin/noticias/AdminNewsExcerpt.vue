<script setup lang="ts">
defineProps<{
  excerptEs: string | null
  excerptLengthClass: string
}>()

defineEmits<{
  'update:excerptEs': [value: string | null]
}>()

function getExcerptLengthLabel(len: number): string {
  if (len >= 120 && len <= 200) return 'Longitud ideal'
  if (len < 120) return 'Muy corto'
  return 'Largo'
}
</script>

<template>
  <div class="section">
    <div class="section-title">Extracto</div>
    <p class="section-hint">
      Resumen corto del articulo que aparece en listados y tarjetas. Recomendado: 120-200
      caracteres.
    </p>
    <div class="field">
      <label>Extracto (ES)</label>
      <textarea
        rows="3"
        class="input textarea"
        maxlength="300"
        placeholder="Resumen breve del articulo para listados (120-200 caracteres recomendado)..."
        :value="excerptEs || ''"
        @input="$emit('update:excerptEs', ($event.target as HTMLTextAreaElement).value || null)"
      />
      <div class="count-row">
        <span class="char-count" :class="excerptLengthClass">
          {{ (excerptEs || '').length }}/300 caracteres
        </span>
        <span v-if="(excerptEs || '').length > 0" class="char-count" :class="excerptLengthClass">
          {{ getExcerptLengthLabel((excerptEs || '').length) }}
        </span>
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

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
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

.count-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
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
