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
      <span>Descripcion (300 char)</span>
      <span>{{ open ? '&minus;' : '+' }}</span>
    </button>
    <div v-if="open" class="section-content">
      <div class="row-2">
        <div class="field">
          <label>Descripcion ES</label>
          <textarea
            :value="descriptionEs"
            rows="3"
            maxlength="300"
            placeholder="Descripcion en espanol..."
            @input="
              emit('update:descriptionEs', ($event.target as HTMLTextAreaElement).value || null)
            "
          />
          <span class="char-count">{{ (descriptionEs || '').length }}/300</span>
        </div>
        <div class="field">
          <label>Descripcion EN</label>
          <textarea
            :value="descriptionEn"
            rows="3"
            maxlength="300"
            placeholder="Description in English..."
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.collapsible {
  padding: 0;
}
.section-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
}
.section-toggle:hover {
  background: #f9fafb;
}
.section-content {
  padding: 0 16px 16px;
  border-top: 1px solid #f3f4f6;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}
.field textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
  resize: vertical;
}
.field textarea:focus {
  outline: none;
  border-color: #23424a;
}
.char-count {
  font-size: 0.65rem;
  color: #9ca3af;
  text-align: right;
}

@media (max-width: 768px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
