<script setup lang="ts">
import {
  useAdminArticleGenerate,
  type ArticleType,
} from '~/composables/admin/useAdminArticleGenerate'

const emit = defineEmits<{
  generated: [
    result: {
      title_es: string
      title_en: string
      meta_description_es: string
      meta_description_en: string
      content_es: string
      content_en: string
    },
  ]
}>()

const { generating, error, generateArticle } = useAdminArticleGenerate()

const showPanel = ref(false)
const topic = ref('')
const type = ref<ArticleType>('guide')
const catalogContext = ref('')

const ARTICLE_TYPES: Array<{ value: ArticleType; label: string }> = [
  { value: 'guide', label: 'Guía de compra' },
  { value: 'news', label: 'Noticia del sector' },
  { value: 'comparison', label: 'Comparativa de vehículos' },
  { value: 'success-story', label: 'Caso de éxito' },
]

async function handleGenerate() {
  if (!topic.value.trim()) return
  const result = await generateArticle({
    topic: topic.value.trim(),
    type: type.value,
    catalogContext: catalogContext.value.trim() || undefined,
  })
  if (result) {
    emit('generated', result)
    showPanel.value = false
    topic.value = ''
    catalogContext.value = ''
  }
}
</script>

<template>
  <div class="ai-generate">
    <button class="btn-ai" type="button" :disabled="generating" @click="showPanel = !showPanel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ai-icon">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      Generar con IA
    </button>

    <Transition name="slide">
      <div v-if="showPanel" class="ai-panel">
        <p class="ai-panel-hint">
          La IA generará un borrador completo (título, meta description y cuerpo) que podrás editar
          antes de publicar.
        </p>

        <div v-if="error" class="ai-error">{{ error }}</div>

        <div class="ai-field">
          <p class="ai-label" role="group">Tipo de artículo</p>
          <div class="type-grid" role="group" aria-label="Tipo de artículo">
            <button
              v-for="opt in ARTICLE_TYPES"
              :key="opt.value"
              type="button"
              class="type-btn"
              :class="{ 'type-btn--active': type === opt.value }"
              @click="type = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="ai-field">
          <label class="ai-label" for="ai-topic-input">Tema del artículo *</label>
          <input
            id="ai-topic-input"
            v-model="topic"
            type="text"
            class="ai-input"
            placeholder="ej. Cómo elegir un semirremolque refrigerado"
            maxlength="400"
            autocomplete="off"
          >
          <span class="ai-counter">{{ topic.length }}/400</span>
        </div>

        <div class="ai-field">
          <label class="ai-label" for="ai-context-input">
            Contexto del catálogo
            <span class="ai-optional">(opcional)</span>
          </label>
          <textarea
            id="ai-context-input"
            v-model="catalogContext"
            class="ai-textarea"
            placeholder="ej. Tenemos 15 semirremolques ATP disponibles, precios entre 18.000 y 45.000€"
            rows="2"
            maxlength="1000"
          />
        </div>

        <div class="ai-actions">
          <button class="btn-cancel" type="button" @click="showPanel = false">Cancelar</button>
          <button
            class="btn-generate"
            type="button"
            :disabled="generating || !topic.trim()"
            @click="handleGenerate"
          >
            <svg
              v-if="generating"
              class="spin-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
            {{ generating ? 'Generando…' : 'Generar borrador' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ai-generate {
  position: relative;
}

.btn-ai {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  border-radius: var(--border-radius);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  min-height: 2.5rem;
}

.btn-ai:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-color: var(--color-primary);
}

.btn-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ── Panel ── */
.ai-panel {
  margin-top: var(--spacing-4);
  padding: var(--spacing-5);
  background: var(--bg-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-radius: var(--border-radius-md);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.ai-panel-hint {
  font-size: 0.85rem;
  color: var(--color-gray-600);
  margin: 0 0 var(--spacing-4);
  line-height: 1.5;
}

.ai-error {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: var(--spacing-3);
  border-radius: var(--border-radius);
  font-size: 0.85rem;
  margin-bottom: var(--spacing-4);
}

.ai-field {
  margin-bottom: var(--spacing-4);
}

.ai-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: var(--spacing-2);
}

.ai-optional {
  font-weight: 400;
  color: var(--color-gray-500);
  font-size: 0.8rem;
  margin-left: var(--spacing-1);
}

.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.type-btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  color: var(--color-gray-700);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.15s;
  text-align: center;
  min-height: 2.5rem;
}

.type-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.type-btn--active {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}

.ai-input,
.ai-textarea {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-primary);
  color: var(--color-text);
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.ai-input:focus,
.ai-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.ai-textarea {
  resize: vertical;
}

.ai-counter {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: var(--color-gray-400);
  margin-top: 2px;
}

.ai-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-2);
}

.btn-cancel {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-secondary);
  color: var(--color-gray-600);
  cursor: pointer;
  font-size: 0.85rem;
  min-height: 2.5rem;
}

.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-5);
  border: none;
  border-radius: var(--border-radius);
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  min-height: 2.5rem;
  transition: background 0.2s;
}

.btn-generate:hover:not(:disabled) {
  background: var(--color-primary-dark, var(--color-primary));
  filter: brightness(1.1);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-icon {
  width: 0.9rem;
  height: 0.9rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ── Transitions ── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
