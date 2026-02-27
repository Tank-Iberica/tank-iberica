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
  background: white;
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
  border-bottom: 1px solid #f1f5f9;
}

.section-hint {
  font-size: 0.8rem;
  color: #94a3b8;
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
  color: #64748b;
}

.input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
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
  color: #94a3b8;
  text-align: right;
}

.count-good {
  color: #22c55e;
}
.count-warning {
  color: #f59e0b;
}
.count-bad {
  color: #ef4444;
}
</style>
