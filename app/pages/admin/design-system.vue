<script setup lang="ts">
/**
 * Admin Design System page (#275)
 * Living reference of UI components, tokens, and patterns.
 */
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()

const _showConfirmModal = ref(false)
const toastMessage = ref('')

function _triggerToast() {
  toastMessage.value = 'Example toast notification'
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}
</script>

<template>
  <div class="ds-page">
    <h1 class="ds-title">{{ t('admin.nav.designSystem') }}</h1>
    <p class="ds-subtitle">{{ t('admin.designSystem.subtitle') }}</p>

    <!-- Colors -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.colors') }}</h2>
      <div class="ds-swatches">
        <div class="ds-swatch" style="background: var(--color-primary)">
          <span>--color-primary</span>
        </div>
        <div class="ds-swatch" style="background: var(--color-primary-light)">
          <span>--color-primary-light</span>
        </div>
        <div class="ds-swatch" style="background: var(--color-success)">
          <span>--color-success</span>
        </div>
        <div class="ds-swatch" style="background: var(--color-warning)">
          <span>--color-warning</span>
        </div>
        <div class="ds-swatch ds-swatch-light" style="background: var(--color-danger)">
          <span>--color-danger</span>
        </div>
        <div class="ds-swatch ds-swatch-dark" style="background: var(--bg-primary)">
          <span>--bg-primary</span>
        </div>
        <div class="ds-swatch ds-swatch-dark" style="background: var(--bg-secondary)">
          <span>--bg-secondary</span>
        </div>
      </div>
    </section>

    <!-- Typography -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.typography') }}</h2>
      <div class="ds-type-samples">
        <p class="ds-type-h1">Heading 1 — Inter 2rem</p>
        <p class="ds-type-h2">Heading 2 — Inter 1.5rem</p>
        <p class="ds-type-h3">Heading 3 — Inter 1.25rem</p>
        <p class="ds-type-body">Body — Inter 1rem (16px base)</p>
        <p class="ds-type-small">Small — Inter 0.875rem</p>
        <p class="ds-type-xs">Extra small — Inter 0.75rem</p>
      </div>
    </section>

    <!-- Spacing -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.spacing') }}</h2>
      <div class="ds-spacing-samples">
        <div v-for="size in [4, 8, 12, 16, 24, 32, 48, 64]" :key="size" class="ds-spacing-item">
          <div class="ds-spacing-box" :style="{ width: `${size}px`, height: `${size}px` }" />
          <span>{{ size }}px ({{ size / 16 }}rem)</span>
        </div>
      </div>
    </section>

    <!-- Buttons -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.buttons') }}</h2>
      <div class="ds-button-row">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-danger">Danger</button>
        <button class="btn btn-primary" disabled>Disabled</button>
        <button class="btn btn-primary btn-sm">Small</button>
      </div>
    </section>

    <!-- Form Fields -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.forms') }}</h2>
      <div class="ds-form-samples">
        <UiFormField :label="'Text input'" field-id="ds-text">
          <input id="ds-text" type="text" class="form-input" placeholder="Placeholder text" >
        </UiFormField>
        <UiFormField :label="'With error'" :error="'This field is required'" field-id="ds-error">
          <input id="ds-error" type="text" class="form-input form-input-error" value="Invalid" >
        </UiFormField>
        <UiFormField
          :label="'With hint'"
          :hint="'Must be at least 8 characters'"
          field-id="ds-hint"
        >
          <input id="ds-hint" type="password" class="form-input" placeholder="Password" >
        </UiFormField>
      </div>
    </section>

    <!-- Badges -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.badges') }}</h2>
      <div class="ds-badge-row">
        <span class="badge badge-success">Success</span>
        <span class="badge badge-warning">Warning</span>
        <span class="badge badge-danger">Danger</span>
        <span class="badge badge-info">Info</span>
        <SharedDealerTrustBadge tier="top" />
        <SharedDealerTrustBadge tier="verified" />
      </div>
    </section>

    <!-- Skeleton Loaders -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.skeletons') }}</h2>
      <div class="ds-skeleton-row">
        <UiSkeletonCard />
        <UiSkeletonCard />
      </div>
      <UiSkeletonTable :rows="3" :cols="4" style="margin-top: var(--spacing-4)" />
    </section>

    <!-- Breakpoints -->
    <section class="ds-section">
      <h2 class="ds-section-title">{{ t('admin.designSystem.breakpoints') }}</h2>
      <table class="ds-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Min-width</th>
            <th>Typical devices</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>xs</td>
            <td>0</td>
            <td>Mobile (360px base)</td>
          </tr>
          <tr>
            <td>sm</td>
            <td>480px (30em)</td>
            <td>Large phones</td>
          </tr>
          <tr>
            <td>md</td>
            <td>768px (48em)</td>
            <td>Tablets</td>
          </tr>
          <tr>
            <td>lg</td>
            <td>1024px (64em)</td>
            <td>Laptops</td>
          </tr>
          <tr>
            <td>xl</td>
            <td>1280px (80em)</td>
            <td>Desktops</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.ds-page {
  max-width: 64rem;
  padding: var(--spacing-4);
}

.ds-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-2);
}

.ds-subtitle {
  color: var(--text-auxiliary);
  margin-bottom: var(--spacing-8);
}

.ds-section {
  margin-bottom: var(--spacing-8);
  padding-bottom: var(--spacing-6);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.ds-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-4);
}

/* Color swatches */
.ds-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.ds-swatch {
  width: 7.5rem;
  height: 5rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: flex-end;
  padding: var(--spacing-2);
  color: var(--color-white);
  font-size: var(--font-size-2xs, 0.6875rem);
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ds-swatch-dark {
  color: var(--text-primary);
  border: 1px solid var(--border-color, #e5e7eb);
}

.ds-swatch-light {
  color: var(--color-white);
}

/* Typography */
.ds-type-samples {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.ds-type-h1 {
  font-size: 2rem;
  font-weight: 700;
}
.ds-type-h2 {
  font-size: 1.5rem;
  font-weight: 600;
}
.ds-type-h3 {
  font-size: 1.25rem;
  font-weight: 600;
}
.ds-type-body {
  font-size: 1rem;
}
.ds-type-small {
  font-size: 0.875rem;
  color: var(--text-auxiliary);
}
.ds-type-xs {
  font-size: 0.75rem;
  color: var(--text-auxiliary);
}

/* Spacing */
.ds-spacing-samples {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-4);
}

.ds-spacing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
}

.ds-spacing-box {
  background: var(--color-primary);
  border-radius: var(--border-radius-sm);
}

.ds-spacing-item span {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

/* Buttons */
.ds-button-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  align-items: center;
}

/* Badges */
.ds-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  align-items: center;
}

/* Form samples */
.ds-form-samples {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: var(--spacing-4);
}

/* Skeleton row */
.ds-skeleton-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: var(--spacing-4);
}

/* Table */
.ds-table {
  width: 100%;
  border-collapse: collapse;
}

.ds-table th,
.ds-table td {
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.ds-table th {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
}
</style>
