<script setup lang="ts">
defineProps<{
  contentEs: string
  contentWordCount: number
  wordCountClass: string
}>()

defineEmits<{
  'update:contentEs': [value: string]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Contenido (ES) *</div>
    <div class="field">
      <textarea
        rows="14"
        class="input textarea"
        placeholder="Escribe el contenido de la noticia...&#10;&#10;Separa los parrafos con lineas en blanco para mejorar la estructura SEO."
        :value="contentEs"
        @input="$emit('update:contentEs', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="count-row">
        <span class="char-count"> {{ contentEs.length }} caracteres </span>
        <span class="char-count word-count" :class="wordCountClass">
          {{ contentWordCount }} palabras
          <span v-if="contentWordCount > 0 && contentWordCount < 300" class="word-target"
            >/ 300 recomendadas</span
          >
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

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.word-count {
  font-weight: 500;
}

.word-target {
  color: #94a3b8;
  font-weight: 400;
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
