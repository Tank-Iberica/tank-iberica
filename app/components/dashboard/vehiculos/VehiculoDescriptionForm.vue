<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  descriptionEs: string
  descriptionEn: string
  generatingDesc: boolean
}>()

const emit = defineEmits<{
  (e: 'update', field: 'description_es' | 'description_en', value: string): void
  (e: 'generate'): void
}>()

function onDescriptionInput(field: 'description_es' | 'description_en', event: Event): void {
  const target = event.target as HTMLTextAreaElement
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
  </section>
</template>

<style scoped>
.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-ai {
  min-height: 36px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-ai:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
