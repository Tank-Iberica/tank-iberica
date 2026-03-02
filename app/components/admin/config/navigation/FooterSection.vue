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
          />
        </div>
        <div class="lang-field">
          <span class="lang-badge">EN</span>
          <input
            type="text"
            :value="footerText.en"
            placeholder="Footer text"
            @input="emit('update-footer-text', 'en', ($event.target as HTMLInputElement).value)"
          />
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
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-subtitle {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.section-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group > label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.875rem;
}

.lang-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lang-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-badge {
  flex-shrink: 0;
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: #6b7280;
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 4px 0;
  text-transform: uppercase;
}

.lang-field input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.lang-field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.btn-add {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
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
  padding: 6px 12px;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  .lang-row {
    flex-direction: row;
  }

  .lang-field {
    flex: 1;
  }
}
</style>
