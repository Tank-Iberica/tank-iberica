<script setup lang="ts">
interface Props {
  isOnline: boolean
  ownerName: string | null
  ownerContact: string | null
  ownerNotes: string | null
}

defineProps<Props>()

const emit = defineEmits<{
  'update:isOnline': [value: boolean]
  'update:ownerName': [value: string | null]
  'update:ownerContact': [value: string | null]
  'update:ownerNotes': [value: string | null]
}>()
</script>

<template>
  <div class="section">
    <div class="section-title">Visibilidad</div>
    <div class="row-2">
      <label class="radio-card" :class="{ active: isOnline }">
        <input type="radio" :checked="isOnline" @change="emit('update:isOnline', true)" >
        <div class="radio-content">
          <strong>Web (Publico)</strong>
          <span>Visible en la web publica</span>
        </div>
      </label>
      <label class="radio-card" :class="{ active: !isOnline }">
        <input type="radio" :checked="!isOnline" @change="emit('update:isOnline', false)" >
        <div class="radio-content">
          <strong>Intermediacion (Interno)</strong>
          <span>Solo visible para administradores</span>
        </div>
      </label>
    </div>
    <div v-if="!isOnline" class="owner-fields">
      <div class="row-3">
        <div class="field">
          <label>Propietario</label>
          <input
            :value="ownerName"
            type="text"
            placeholder="Nombre del propietario"
            @input="emit('update:ownerName', ($event.target as HTMLInputElement).value || null)"
          >
        </div>
        <div class="field">
          <label>Contacto</label>
          <input
            :value="ownerContact"
            type="text"
            placeholder="Tel / Email"
            @input="emit('update:ownerContact', ($event.target as HTMLInputElement).value || null)"
          >
        </div>
        <div class="field">
          <label>Notas internas</label>
          <input
            :value="ownerNotes"
            type="text"
            placeholder="Notas..."
            @input="emit('update:ownerNotes', ($event.target as HTMLInputElement).value || null)"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}
.radio-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.radio-card input {
  margin-top: 2px;
}
.radio-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}
.radio-content {
  display: flex;
  flex-direction: column;
}
.radio-content strong {
  font-size: 0.9rem;
}
.radio-content span {
  font-size: 0.75rem;
  color: #6b7280;
}
.owner-fields {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #f59e0b;
  background: #fffbeb;
  margin: 12px -16px -12px;
  padding: 12px 16px;
  border-radius: 0 0 8px 8px;
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
.field input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.field input:focus {
  outline: none;
  border-color: #23424a;
}

@media (max-width: 768px) {
  .row-2,
  .row-3 {
    grid-template-columns: 1fr;
  }
}
</style>
