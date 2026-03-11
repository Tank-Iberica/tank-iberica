<script setup lang="ts">
import type { LinkItem, LinkField } from '~/composables/admin/useAdminNavigation'

defineProps<{
  footerText: Record<string, string>
  links: LinkItem[]
}>()

const emit = defineEmits<{
  (e: 'add-link'): void
  (e: 'move-link', index: number, direction: -1 | 1): void
  (e: 'remove-link', index: number): void
  (e: 'update-link-field', index: number, field: LinkField, value: string | boolean): void
  (e: 'update-footer-text', lang: string, value: string): void
}>()
</script>

<template>
  <div class="config-card">
    <h3 class="card-title">Footer</h3>
    <p class="card-subtitle">Texto del pie de pagina y enlaces adicionales</p>

    <div class="form-group">
      <label>Texto del footer</label>
      <div class="lang-row">
        <div class="lang-field">
          <span class="lang-badge">ES</span>
          <input
            type="text"
            :value="footerText.es"
            placeholder="Texto del pie de pagina"
            @input="emit('update-footer-text', 'es', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            type="text"
            :value="footerText.en"
            placeholder="Footer text"
            @input="emit('update-footer-text', 'en', ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </div>

    <!-- Footer links -->
    <div class="form-group">
      <div class="card-header-row">
        <label class="section-label">Enlaces del footer</label>
        <button class="btn-add btn-add-sm" @click="emit('add-link')">+ Anadir</button>
      </div>
    </div>

    <AdminConfigNavigationLinksList
      :links="links"
      placeholder-es="Aviso legal"
      placeholder-en="Legal notice"
      placeholder-url="/legal"
      empty-message="No hay enlaces de footer. Anade el primero."
      @move="(index, direction) => emit('move-link', index, direction)"
      @remove="(index) => emit('remove-link', index)"
      @update-field="(index, field, value) => emit('update-link-field', index, field, value)"
    />
  </div>
</template>

<style scoped>
.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--shadow-card);
}

.card-title {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-subtitle {
  margin: 0 0 1.25rem;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.section-label {
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.lang-row {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lang-badge {
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-gray-500);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  padding: 0.25rem 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-add {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--color-primary-dark);
}

.btn-add-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

@media (min-width: 48em) {
  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
