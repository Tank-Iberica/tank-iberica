<script setup lang="ts">
import type { AdminVehicle } from '~/composables/admin/useAdminVehicles'

const props = defineProps<{
  show: boolean
  vehicle: AdminVehicle | null
  transactionType: 'rent' | 'sell'
  rentFrom: string
  rentTo: string
  rentClient: string
  rentAmount: string
  sellDate: string
  sellBuyer: string
  sellPrice: string
}>()

const emit = defineEmits<{
  'update:transactionType': [type: 'rent' | 'sell']
  'update:rentFrom': [value: string]
  'update:rentTo': [value: string]
  'update:rentClient': [value: string]
  'update:rentAmount': [value: string]
  'update:sellDate': [value: string]
  'update:sellBuyer': [value: string]
  'update:sellPrice': [value: string]
  close: []
  confirm: []
}>()

const localTransactionType = computed({
  get: () => props.transactionType,
  set: (val) => emit('update:transactionType', val),
})

const localRentFrom = computed({
  get: () => props.rentFrom,
  set: (val) => emit('update:rentFrom', val),
})

const localRentTo = computed({
  get: () => props.rentTo,
  set: (val) => emit('update:rentTo', val),
})

const localRentClient = computed({
  get: () => props.rentClient,
  set: (val) => emit('update:rentClient', val),
})

const localRentAmount = computed({
  get: () => props.rentAmount,
  set: (val) => emit('update:rentAmount', val),
})

const localSellDate = computed({
  get: () => props.sellDate,
  set: (val) => emit('update:sellDate', val),
})

const localSellBuyer = computed({
  get: () => props.sellBuyer,
  set: (val) => emit('update:sellBuyer', val),
})

const localSellPrice = computed({
  get: () => props.sellPrice,
  set: (val) => emit('update:sellPrice', val),
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>
            {{ localTransactionType === 'rent' ? 'Registrar alquiler' : 'Registrar venta' }}
          </h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div class="vehicle-badge">
            <strong>{{ vehicle?.brand }} {{ vehicle?.model }}</strong>
            <span>{{ vehicle?.year }}</span>
          </div>

          <div class="tab-buttons">
            <button
              :class="{ active: localTransactionType === 'rent' }"
              @click="localTransactionType = 'rent'"
            >
              🔑 Alquilar
            </button>
            <button
              :class="{ active: localTransactionType === 'sell' }"
              @click="localTransactionType = 'sell'"
            >
              💰 Vender
            </button>
          </div>

          <div v-if="localTransactionType === 'rent'" class="form-grid">
            <div class="form-group half">
              <label>Fecha desde</label>
              <input v-model="localRentFrom" type="date" >
            </div>
            <div class="form-group half">
              <label>Fecha hasta</label>
              <input v-model="localRentTo" type="date" >
            </div>
            <div class="form-group">
              <label>Cliente</label>
              <input v-model="localRentClient" type="text" placeholder="Nombre del cliente" >
            </div>
            <div class="form-group">
              <label>Importe (€)</label>
              <input v-model="localRentAmount" type="number" step="0.01" placeholder="0.00" >
            </div>
          </div>

          <div v-else class="form-grid">
            <div class="form-group">
              <label>Fecha de venta</label>
              <input v-model="localSellDate" type="date" >
            </div>
            <div class="form-group">
              <label>Comprador</label>
              <input v-model="localSellBuyer" type="text" placeholder="Nombre del comprador" >
            </div>
            <div class="form-group">
              <label>Precio de venta (€)</label>
              <input v-model="localSellPrice" type="number" step="0.01" >
            </div>
            <div class="info-warning">
              ⚠️ Esto marcará el vehículo como vendido y lo moverá al histórico.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cancelar</button>
          <button class="btn-primary" @click="emit('confirm')">
            {{ localTransactionType === 'rent' ? 'Registrar alquiler' : 'Registrar venta' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow: auto;
  animation: modalSlide 0.2s ease-out;
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-md {
  width: 100%;
  max-width: 600px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #475569;
}

.modal-body {
  padding: 24px;
}

.vehicle-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.vehicle-badge strong {
  color: #1e293b;
  font-size: 16px;
}

.vehicle-badge span {
  color: #64748b;
  font-size: 14px;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-buttons button {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab-buttons button:hover {
  border-color: #cbd5e1;
}

.tab-buttons button.active {
  border-color: var(--color-primary, #23424a);
  background: var(--color-primary, #23424a);
  color: white;
}

.form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.form-group {
  flex: 1 1 100%;
}

.form-group.half {
  flex: 1 1 calc(50% - 8px);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #475569;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
}

.info-warning {
  padding: 12px;
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1a3238;
}
</style>
