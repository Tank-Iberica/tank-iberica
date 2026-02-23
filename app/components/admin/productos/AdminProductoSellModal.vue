<script setup lang="ts">
interface SellData {
  sale_price: number
  buyer: string
  sale_date: string
  commission: number
  notes: string
}

interface Props {
  show: boolean
  vehicleBrand: string
  vehicleModel: string
  sellData: SellData
  totalCost: number
  finalProfit: number
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:sellData', value: SellData): void
  (e: 'sell'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function updateField(field: keyof SellData, value: string | number) {
  emit('update:sellData', { ...props.sellData, [field]: value })
}

function fmt(val: number | null | undefined): string {
  if (!val && val !== 0) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(val)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('update:show', false)">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span>💰 Registrar Venta</span>
          <button @click="emit('update:show', false)">×</button>
        </div>
        <div class="modal-body">
          <p>
            Vender <strong>{{ vehicleBrand }} {{ vehicleModel }}</strong>
          </p>
          <div class="row-2">
            <div class="field">
              <label>Precio venta final €</label>
              <input
                :value="sellData.sale_price"
                type="number"
                placeholder="0"
                @input="
                  updateField('sale_price', Number(($event.target as HTMLInputElement).value))
                "
              >
            </div>
            <div class="field">
              <label>Comisión %</label>
              <input
                :value="sellData.commission"
                type="number"
                placeholder="0"
                @input="
                  updateField('commission', Number(($event.target as HTMLInputElement).value))
                "
              >
            </div>
          </div>
          <div class="row-2">
            <div class="field">
              <label>Comprador</label>
              <input
                :value="sellData.buyer"
                type="text"
                placeholder="Nombre / Empresa"
                @input="updateField('buyer', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="field">
              <label>Fecha venta</label>
              <input
                :value="sellData.sale_date"
                type="date"
                @input="updateField('sale_date', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>
          <div class="field">
            <label>Notas</label>
            <textarea
              :value="sellData.notes"
              rows="2"
              placeholder="Notas adicionales..."
              @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <div class="profit-box">
            <div class="profit-row">
              <span>Precio venta</span><span>{{ fmt(sellData.sale_price) }}</span>
            </div>
            <div class="profit-row">
              <span>− Coste total</span><span>{{ fmt(totalCost) }}</span>
            </div>
            <div class="profit-row">
              <span>− Comisión ({{ sellData.commission }}%)</span>
              <span>{{ fmt((sellData.sale_price * sellData.commission) / 100) }}</span>
            </div>
            <div class="profit-row final" :class="finalProfit >= 0 ? 'pos' : 'neg'">
              <span>BENEFICIO FINAL</span>
              <span>{{ fmt(finalProfit) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('update:show', false)">Cancelar</button>
          <button class="btn btn-primary" @click="emit('sell')">Confirmar Venta</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-lg {
  max-width: 500px;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #9ca3af;
}
.modal-body {
  padding: 16px;
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field label {
  font-size: 0.85rem;
  font-weight: 500;
}
.field input,
.field textarea {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
  font-size: 0.85rem;
}
.profit-box {
  margin-top: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
}
.profit-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 4px 0;
}
.profit-row.final {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #d1d5db;
  font-weight: 700;
  font-size: 1rem;
}
.profit-row.final.pos {
  color: #16a34a;
}
.profit-row.final.neg {
  color: #dc2626;
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 10px 10px;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

@media (max-width: 768px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
