<script setup lang="ts">
import { CATEGORIES, useAdminEmails } from '~/composables/admin/useAdminEmails'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const {
  // State
  activeCategory,
  selectedTemplateKey,
  activeLang,
  templates,
  showPreview,
  sendingTest,
  testSent,

  // From vertical config
  loading,
  saving,
  error,
  saved,

  // Computed
  filteredTemplates,
  selectedDefinition,
  currentTemplate,
  currentStats,
  openRate,
  clickRate,
  previewHtml,

  // Functions
  categoryCount,
  init,
  selectCategory,
  toggleTemplate,
  insertVariable,
  resetToDefault,
  handleSave,
  sendTest,
} = useAdminEmails()

// ── Handlers for child component events ──

function onSelectTemplate(key: string) {
  selectedTemplateKey.value = key
}

function onUpdateSubject(value: string) {
  const tpl = currentTemplate.value
  if (tpl) {
    tpl.subject[activeLang.value] = value
  }
}

function onUpdateBody(value: string) {
  const tpl = currentTemplate.value
  if (tpl) {
    tpl.body[activeLang.value] = value
  }
}

function onUpdateActiveLang(lang: 'es' | 'en') {
  activeLang.value = lang
}

// ── Lifecycle ──

onMounted(async () => {
  await init()
})
</script>

<template>
  <div class="admin-emails">
    <!-- Header -->
    <div class="section-header">
      <h2>{{ $t('admin.emails.title') }}</h2>
      <p class="section-subtitle">
        {{ $t('admin.emails.subtitle') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      {{ $t('admin.emails.loading') }}
    </div>

    <template v-else>
      <!-- Feedback banners -->
      <Transition name="fade">
        <div v-if="saved" class="success-banner">
          {{ $t('admin.emails.saved') }}
        </div>
      </Transition>
      <Transition name="fade">
        <div v-if="testSent" class="success-banner success-banner--test">
          {{ $t('admin.emails.testSent') }}
        </div>
      </Transition>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Category tabs -->
      <AdminConfigEmailsEmailCategoryTabs
        :active-category="activeCategory"
        :categories="CATEGORIES"
        :category-count="categoryCount"
        @select="selectCategory"
      />

      <!-- Template list + Editor layout -->
      <div class="emails-layout">
        <!-- Template list sidebar -->
        <AdminConfigEmailsEmailTemplateList
          :filtered-templates="filteredTemplates"
          :templates="templates"
          :selected-template-key="selectedTemplateKey"
          @select="onSelectTemplate"
        />

        <!-- Editor panel -->
        <AdminConfigEmailsEmailTemplateEditor
          v-if="currentTemplate && selectedDefinition"
          :selected-definition="selectedDefinition"
          :selected-template-key="selectedTemplateKey"
          :current-template="currentTemplate"
          :active-lang="activeLang"
          :current-stats="currentStats"
          :open-rate="openRate"
          :click-rate="clickRate"
          :sending-test="sendingTest"
          :test-sent="testSent"
          :action-loading="saving"
          @update:active-lang="onUpdateActiveLang"
          @toggle-active="toggleTemplate(selectedTemplateKey)"
          @insert-variable="insertVariable"
          @reset-default="resetToDefault"
          @send-test="sendTest"
          @show-preview="showPreview = true"
          @update:subject="onUpdateSubject"
          @update:body="onUpdateBody"
        />
      </div>

      <!-- Save button -->
      <div class="actions-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.emails.saving') : $t('admin.emails.save') }}
        </button>
      </div>
    </template>

    <!-- Preview Modal -->
    <AdminConfigEmailsEmailPreviewModal
      :show="showPreview"
      :preview-html="previewHtml"
      :sending-test="sendingTest"
      :test-sent="testSent"
      @close="showPreview = false"
      @send-test="sendTest"
    />
  </div>
</template>

<style scoped>
.admin-emails {
  padding: 0;
}

/* -- Header -- */
.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: var(--color-text, #1f2937);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

/* -- Loading -- */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* -- Banners -- */
.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.success-banner--test {
  background: #eff6ff;
  color: #2563eb;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

/* -- Layout: list + editor -- */
.emails-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* -- Buttons -- */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* -- Actions bar -- */
.actions-bar {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* -- Transitions -- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* -- Responsive -- */
@media (min-width: 768px) {
  .section-header h2 {
    font-size: 1.75rem;
  }
}

@media (min-width: 1024px) {
  .emails-layout {
    flex-direction: row;
    align-items: flex-start;
  }
}
</style>
