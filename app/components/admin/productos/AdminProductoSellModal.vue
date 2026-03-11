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
          <span>{{ $t('admin.productos.registerSale') }}</span>
          <button :aria-label="$t('common.close')" @click="emit('update:show', false)">×</button>
        </div>
        <div class="modal-body">
          <p v-html="$t('admin.productos.sellVehicle', { name: `<strong>${vehicleBrand} ${vehicleModel}</strong>` })" />
          <div class="row-2">
            <div class="field">
              <label>{{ $t('admin.productos.finalSalePrice') }}</label>
              <input
                :value="sellData.sale_price"
                type="number"
                placeholder="0"
                @input="
                  updateField('sale_price', Number(($event.target as HTMLInputElement).value))
                "
              />
            </div>
            <div class="field">
              <label>{{ $t('admin.productos.commissionPercent') }}</label>
              <input
                :value="sellData.commission"
                type="number"
                placeholder="0"
                @input="
                  updateField('commission', Number(($event.target as HTMLInputElement).value))
                "
              />
            </div>
          </div>
          <div class="row-2">
            <div class="field">
              <label>{{ $t('admin.productos.buyer') }}</label>
              <input
                :value="sellData.buyer"
                type="text"
                :placeholder="$t('admin.productos.buyerPlaceholder')"
                @input="updateField('buyer', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="field">
              <label>{{ $t('admin.productos.saleDate') }}</label>
              <input
                :value="sellData.sale_date"
                type="date"
                @input="updateField('sale_date', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="field">
            <label>{{ $t('common.notes') }}</label>
            <textarea
              :value="sellData.notes"
              rows="2"
              :placeholder="$t('admin.productos.additionalNotesPlaceholder')"
              @input="updateField('notes', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
          <div class="profit-box">
            <div class="profit-row">
              <span>{{ $t('admin.productos.salePriceLabel') }}</span><span>{{ fmt(sellData.sale_price) }}</span>
            </div>
            <div class="profit-row">
              <span>{{ $t('admin.productos.totalCostLabel') }}</span><span>{{ fmt(totalCost) }}</span>
            </div>
            <div class="profit-row">
              <span>{{ $t('admin.productos.commissionLabel', { percent: sellData.commission }) }}</span>
              <span>{{ fmt((sellData.sale_price * sellData.commission) / 100) }}</span>
            </div>
            <div class="profit-row final" :class="finalProfit >= 0 ? 'pos' : 'neg'">
              <span>{{ $t('admin.productos.finalProfit') }}</span>
              <span>{{ fmt(finalProfit) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('update:show', false)">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="emit('sell')">{{ $t('admin.productos.confirmSale') }}</button>
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
  padding: var(--spacing-4);
}
.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}
.modal-lg {
  max-width: 31.25rem;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
}
.modal-head button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-disabled);
}
.modal-body {
  padding: var(--spacing-4);
}
.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
.field label {
  font-size: 0.85rem;
  font-weight: 500;
}
.field input,
.field textarea {
  padding: var(--spacing-2) 0.625rem;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
}
.profit-box {
  margin-top: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
}
.profit-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  padding: var(--spacing-1) 0;
}
.profit-row.final {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-gray-300);
  font-weight: 700;
  font-size: 1rem;
}
.profit-row.final.pos {
  color: var(--color-success);
}
.profit-row.final.neg {
  color: var(--color-error);
}
.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 10px 10px;
}
.btn {
  padding: var(--spacing-2) var(--spacing-4);
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
}

@media (max-width: 48em) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>
