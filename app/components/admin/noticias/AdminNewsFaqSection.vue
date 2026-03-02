<script setup lang="ts">
const props = defineProps<{
  faqSchema: Array<{ question: string; answer: string }> | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  add: []
  remove: [index: number]
  'update:faqSchema': [schema: Array<{ question: string; answer: string }> | null]
}>()

function updateQuestion(index: number, value: string) {
  const current = [...(props.faqSchema ?? [])]
  const item = current[index]
  if (!item) return
  current[index] = { question: value, answer: item.answer }
  emit('update:faqSchema', current)
}

function updateAnswer(index: number, value: string) {
  const current = [...(props.faqSchema ?? [])]
  const item = current[index]
  if (!item) return
  current[index] = { question: item.question, answer: value }
  emit('update:faqSchema', current)
}
</script>

<template>
  <div class="section">
    <button class="section-toggle" @click="$emit('update:open', !open)">
      <span>FAQ Schema (Rich Snippets)</span>
      <span class="toggle-icon">{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="section-body">
      <p class="section-hint" style="margin: 0 0 8px">
        Anade 3+ preguntas frecuentes para activar los featured snippets de Google.
      </p>
      <div v-for="(faq, index) in faqSchema || []" :key="index" class="faq-item">
        <div class="faq-item-header">
          <span class="faq-item-number">{{ index + 1 }}</span>
          <button
            class="btn-icon faq-remove"
            title="Eliminar pregunta"
            @click="$emit('remove', index)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="field">
          <label>Pregunta</label>
          <input
            :value="faq.question"
            type="text"
            class="input"
            placeholder="Ej: Que es un vehiculo industrial?"
            @input="updateQuestion(index, ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label>Respuesta</label>
          <textarea
            :value="faq.answer"
            rows="3"
            class="input textarea"
            placeholder="Respuesta clara y concisa..."
            @input="updateAnswer(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
      <button class="btn btn-sm" @click="$emit('add')">+ Anadir pregunta</button>
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

.section-hint {
  font-size: 0.8rem;
  color: var(--text-disabled);
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-sm {
  padding: 4px 12px;
  font-size: 0.8rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  color: var(--text-auxiliary);
  transition: all 0.15s;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-icon:hover {
  background: var(--bg-secondary);
  color: #1a1a1a;
}

.btn-icon svg {
  width: 20px;
  height: 20px;
}

/* FAQ items */
.faq-item {
  background: var(--bg-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-item-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-disabled);
  background: var(--bg-tertiary);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.faq-remove {
  width: 28px;
  height: 28px;
  color: var(--text-disabled);
}

.faq-remove:hover {
  color: var(--color-error);
  background: var(--color-error-bg, #fef2f2);
}
</style>
