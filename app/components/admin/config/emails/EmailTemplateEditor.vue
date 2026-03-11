<script setup lang="ts">
import type {
  TemplateDefinition,
  TemplateData,
  TemplateStats,
} from '~/composables/admin/useAdminEmails'

const props = defineProps<{
  selectedDefinition: TemplateDefinition
  selectedTemplateKey: string
  currentTemplate: TemplateData
  activeLang: 'es' | 'en'
  currentStats: TemplateStats
  openRate: string
  clickRate: string
  sendingTest: boolean
  testSent: boolean
  actionLoading: boolean
}>()

const emit = defineEmits<{
  'update:activeLang': [lang: 'es' | 'en']
  'toggle-active': []
  'insert-variable': [varName: string]
  'reset-default': []
  'send-test': []
  'show-preview': []
  'update:subject': [value: string]
  'update:body': [value: string]
}>()

function onSubjectInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:subject', target.value)
}

function onBodyInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:body', target.value)
}
</script>

<template>
  <div class="editor-panel">
    <!-- Editor header -->
    <div class="editor-header">
      <div class="editor-header__title">
        <h3>{{ $t(`admin.emails.tpl.${selectedTemplateKey}`) }}</h3>
        <code class="editor-header__key">{{ selectedTemplateKey }}</code>
      </div>
      <div class="editor-header__actions">
        <button
          class="btn-icon"
          :class="{ 'btn-icon--off': !currentTemplate.active }"
          :title="
            currentTemplate.active ? $t('admin.emails.deactivate') : $t('admin.emails.activate')
          "
          @click="emit('toggle-active')"
        >
          <span class="toggle-icon">{{ currentTemplate.active ? 'ON' : 'OFF' }}</span>
        </button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-card__value">{{ currentStats.sent }}</span>
        <span class="stat-card__label">{{ $t('admin.emails.statsSent') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ openRate }}%</span>
        <span class="stat-card__label">{{ $t('admin.emails.statsOpenRate') }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">{{ clickRate }}%</span>
        <span class="stat-card__label">{{ $t('admin.emails.statsClickRate') }}</span>
      </div>
    </div>

    <!-- Variables -->
    <div class="variables-info">
      <p class="variables-label">{{ $t('admin.emails.availableVars') }}</p>
      <div class="variables-list">
        <button
          v-for="v in selectedDefinition.variables"
          :key="v"
          class="variable-tag"
          :title="$t('admin.emails.insertVar')"
          @click="emit('insert-variable', v)"
        >
          {{ v }}
        </button>
      </div>
    </div>

    <!-- Locale switcher -->
    <div class="locale-switcher">
      <button
        class="locale-btn"
        :class="{ 'locale-btn--active': props.activeLang === 'es' }"
        @click="emit('update:activeLang', 'es')"
      >
        ES
      </button>
      <button
        class="locale-btn"
        :class="{ 'locale-btn--active': props.activeLang === 'en' }"
        @click="emit('update:activeLang', 'en')"
      >
        EN
      </button>
    </div>

    <!-- Subject -->
    <div class="form-group">
      <label :for="`subject-${props.activeLang}`">
        {{ $t('admin.emails.subject') }} ({{ props.activeLang.toUpperCase() }})
      </label>
      <input
        :id="`subject-${props.activeLang}`"
        :value="currentTemplate.subject[props.activeLang]"
        type="text"
        :placeholder="$t('admin.emails.subjectPlaceholder')"
        @input="onSubjectInput"
      >
    </div>

    <!-- Body -->
    <div class="form-group">
      <label :for="`body-${props.activeLang}`">
        {{ $t('admin.emails.body') }} ({{ props.activeLang.toUpperCase() }})
        <span class="label-hint">{{ $t('admin.emails.markdownHint') }}</span>
      </label>
      <textarea
        :id="`body-${props.activeLang}`"
        :value="currentTemplate.body[props.activeLang]"
        rows="12"
        :placeholder="$t('admin.emails.bodyPlaceholder')"
        @input="onBodyInput"
      />
    </div>

    <!-- Action buttons -->
    <div class="editor-actions">
      <button class="btn-secondary" @click="emit('reset-default')">
        {{ $t('admin.emails.resetDefault') }}
      </button>
      <button class="btn-secondary" @click="emit('show-preview')">
        {{ $t('admin.emails.preview') }}
      </button>
      <button class="btn-secondary" :disabled="sendingTest" @click="emit('send-test')">
        {{ sendingTest ? $t('admin.emails.sending') : $t('admin.emails.sendTest') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-panel {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.25rem;
  box-shadow: var(--shadow-card);
}

.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 0.75rem;
}

.editor-header__title h3 {
  margin: 0 0 0.25rem;
  font-size: 1.15rem;
  color: var(--color-gray-800);
}

.editor-header__key {
  font-size: 0.75rem;
  color: var(--text-disabled);
  background: var(--bg-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.editor-header__actions {
  flex-shrink: 0;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--color-success);
  border-radius: var(--border-radius-sm);
  background: var(--color-success-bg, var(--color-success-bg));
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-success);
  transition: all 0.2s;
  min-height: 2.25rem;
}

.btn-icon--off {
  border-color: var(--border-color);
  background: var(--color-gray-50);
  color: var(--text-disabled);
}

.toggle-icon {
  font-family: monospace;
  letter-spacing: 0.05em;
}

/* -- Stats row -- */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--color-gray-50);
  border: 1px solid var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 0.75rem;
  text-align: center;
}

.stat-card__value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-800);
}

.stat-card__label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: 0.125rem;
}

/* -- Variables -- */
.variables-info {
  background: var(--color-sky-50);
  border: 1px solid var(--color-sky-200);
  border-radius: var(--border-radius);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
}

.variables-label {
  margin: 0 0 0.5rem;
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--color-sky-700);
}

.variables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.variable-tag {
  background: var(--bg-primary);
  border: 1px solid var(--color-sky-200);
  padding: 0.1875rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.78rem;
  color: var(--color-sky-900);
  white-space: nowrap;
  cursor: pointer;
  font-family: monospace;
  transition: all 0.15s;
  min-height: 1.75rem;
}

.variable-tag:hover {
  background: var(--color-sky-100);
  border-color: var(--color-sky-300);
}

/* -- Locale switcher -- */
.locale-switcher {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 0.25rem;
  width: fit-content;
}

.locale-btn {
  padding: 0.375rem 1rem;
  border: none;
  border-radius: var(--border-radius-sm);
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-500);
  transition: all 0.2s;
  min-height: 2.25rem;
}

.locale-btn--active {
  background: var(--bg-primary);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* -- Form groups -- */
.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
  font-size: 0.9rem;
}

.label-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-disabled);
}

.form-group input[type='text'],
.form-group textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 11.25rem;
  line-height: 1.6;
  font-family: 'Courier New', monospace;
  font-size: 0.88rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* -- Editor actions -- */
.editor-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  transition: all 0.2s;
  min-height: 2.5rem;
}

.btn-secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--text-disabled);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* -- Responsive -- */
@media (min-width: 48em) {
  .editor-panel {
    padding: 1.5rem;
  }

  .stats-row {
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-card__value {
    font-size: 1.5rem;
  }
}

@media (min-width: 64em) {
  .editor-panel {
    flex: 1;
    min-width: 0;
    padding: 1.75rem;
  }
}
</style>
