<script setup lang="ts">
interface Props {
  open: boolean
  descriptionEs: string | null
  descriptionEn: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:descriptionEs': [value: string | null]
  'update:descriptionEn': [value: string | null]
}>()
</script>

<template>
  <div class="section collapsible">
    <button class="section-toggle" @click="emit('update:open', !open)">
      <span>{{ $t('admin.productos.descriptionSection') }}</span>
      <span>{{ open ? '&minus;' : '+' }}</span>
    </button>
    <div v-if="open" class="section-content">
      <div class="row-2">
        <div class="field">
          <label>{{ $t('admin.productos.descriptionEs') }}</label>
          <textarea
            :value="descriptionEs"
            rows="3"
            maxlength="300"
            :placeholder="$t('admin.productos.descriptionEsPlaceholder')"
            @input="
              emit('update:descriptionEs', ($event.target as HTMLTextAreaElement).value || null)
            "
          />
          <span class="char-count">{{ (descriptionEs || '').length }}/300</span>
        </div>
        <div class="field">
          <label>{{ $t('admin.productos.descriptionEn') }}</label>
          <textarea
            :value="descriptionEn"
            rows="3"
            maxlength="300"
            :placeholder="$t('admin.productos.descriptionEnPlaceholder')"
            @input="
              emit('update:descriptionEn', ($event.target as HTMLTextAreaElement).value || null)
            "
          />
          <span class="char-count">{{ (descriptionEn || '').length }}/300</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-gray-700);
  text-transform: uppercase;
}
.section-toggle:hover {
  background: var(--color-gray-50);
}
.section-content {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
}
.field textarea {
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  resize: vertical;
}
.field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
.char-count {
  font-size: 0.65rem;
  color: var(--text-disabled);
  text-align: right;
}

@media (max-width: 48em) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
