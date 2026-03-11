<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  descriptionEs: string
  descriptionEn: string
  generatingDesc: boolean
  videoUrl?: string | null
}>()

const emit = defineEmits<{
  (e: 'update', field: 'description_es' | 'description_en' | 'video_url', value: string): void
  (e: 'generate'): void
}>()

function onDescriptionInput(field: 'description_es' | 'description_en' | 'video_url', event: Event): void {
  const target = event.target as HTMLTextAreaElement | HTMLInputElement
  emit('update', field, target.value)
}
</script>

<template>
  <section class="form-section">
    <h2>{{ t('dashboard.vehicles.sectionDescription') }}</h2>
    <div class="form-group">
      <div class="label-row">
        <label for="description_es">{{ t('dashboard.vehicles.descriptionEs') }}</label>
        <button
          type="button"
          class="btn-ai"
          :disabled="props.generatingDesc"
          @click="emit('generate')"
        >
          {{
            props.generatingDesc
              ? t('dashboard.vehicles.generating')
              : t('dashboard.vehicles.generateAI')
          }}
        </button>
      </div>
      <textarea
        id="description_es"
        :value="props.descriptionEs"
        rows="6"
        @input="onDescriptionInput('description_es', $event)"
      />
    </div>
    <div class="form-group">
      <label for="description_en">{{ t('dashboard.vehicles.descriptionEn') }}</label>
      <textarea
        id="description_en"
        :value="props.descriptionEn"
        rows="4"
        @input="onDescriptionInput('description_en', $event)"
      />
    </div>

    <div class="form-group">
      <label for="video_url">{{ t('dashboard.vehicles.videoUrl') }}</label>
      <p class="form-help">{{ t('dashboard.vehicles.videoUrlHelp') }}</p>
      <input
        id="video_url"
        type="url"
        :value="props.videoUrl ?? ''"
        :placeholder="t('dashboard.vehicles.videoUrlPlaceholder')"
        autocomplete="off"
        @input="onDescriptionInput('video_url', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.form-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.form-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 6.25rem;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-ai {
  min-height: 2.25rem;
  padding: 0.375rem 0.875rem;
  background: var(--color-violet-800);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
