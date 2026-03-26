<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  section: string
  status: string
  category: string
  publishedAt: string | null
  scheduledAt: string | null
}>()

const emit = defineEmits<{
  'update:section': [value: string]
  'update:status': [value: string]
  'update:category': [value: string]
  'update:publishedAt': [value: string | null]
  'update:scheduledAt': [value: string | null]
}>()

function onSectionChange(value: string) {
  emit('update:section', value)
}

function onStatusChange(value: string) {
  emit('update:status', value)
}
</script>

<template>
  <div class="section">
    <div class="section-title">{{ t('admin.newsForm.publication') }}</div>
    <div class="field" style="margin-bottom: var(--spacing-3)">
      <label>{{ t('admin.newsForm.section') }}</label>
      <div class="estado-row">
        <label class="estado-opt" :class="{ active: section === 'noticias' }">
          <input
            type="radio"
            :checked="section === 'noticias'"
            value="noticias"
            @change="onSectionChange('noticias')"
          >
          {{ t('news.title') }}
        </label>
        <label class="estado-opt" :class="{ active: section === 'guia' }">
          <input
            type="radio"
            :checked="section === 'guia'"
            value="guia"
            @change="onSectionChange('guia')"
          >
          {{ t('guide.title') }}
        </label>
      </div>
    </div>
    <div class="row-2">
      <div class="field">
        <label>{{ $t('common.status') }}</label>
        <div class="estado-row">
          <label class="estado-opt" :class="{ active: status === 'draft' }">
            <input
              type="radio"
              :checked="status === 'draft'"
              value="draft"
              @change="onStatusChange('draft')"
            >
            {{ $t('common.draft') }}
          </label>
          <label class="estado-opt" :class="{ active: status === 'published' }">
            <input
              type="radio"
              :checked="status === 'published'"
              value="published"
              @change="onStatusChange('published')"
            >
            {{ $t('common.published') }}
          </label>
          <label class="estado-opt" :class="{ active: status === 'scheduled' }">
            <input
              type="radio"
              :checked="status === 'scheduled'"
              value="scheduled"
              @change="onStatusChange('scheduled')"
            >
            {{ $t('common.scheduled') }}
          </label>
          <label class="estado-opt" :class="{ active: status === 'archived' }">
            <input
              type="radio"
              :checked="status === 'archived'"
              value="archived"
              @change="onStatusChange('archived')"
            >
            {{ t('common.archived') }}
          </label>
        </div>
      </div>
      <div class="field">
        <label>{{ t('common.category') }}</label>
        <select
          class="input"
          :value="category"
          @change="$emit('update:category', ($event.target as HTMLSelectElement).value)"
        >
          <option value="prensa">{{ t('news.prensa') }}</option>
          <option value="eventos">{{ t('news.eventos') }}</option>
          <option value="destacados">{{ t('news.destacados') }}</option>
          <option value="general">{{ t('news.general') }}</option>
        </select>
      </div>
    </div>
    <div v-if="status === 'published'" class="field">
      <label>{{ t('admin.newsForm.publishDate') }}</label>
      <input
        type="datetime-local"
        class="input"
        :value="publishedAt"
        @input="$emit('update:publishedAt', ($event.target as HTMLInputElement).value || null)"
      >
    </div>
    <div v-if="status === 'scheduled'" class="field">
      <label>{{ t('admin.newsForm.scheduledPublishDate') }}</label>
      <input
        type="datetime-local"
        class="input"
        :value="scheduledAt"
        @input="$emit('update:scheduledAt', ($event.target as HTMLInputElement).value || null)"
      >
      <span class="char-count">{{ t('admin.newsForm.autoPublishHint') }}</span>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-gray-700);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 37.5em) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}

.estado-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.estado-opt {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.estado-opt input {
  display: none;
}

.estado-opt.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.char-count {
  font-size: 0.7rem;
  color: var(--text-disabled);
  text-align: right;
}
</style>
