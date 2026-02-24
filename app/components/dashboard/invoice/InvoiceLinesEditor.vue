<script setup lang="ts">
import type { InvoiceLine } from '~/composables/dashboard/useInvoice'

defineProps<{
  lines: InvoiceLine[]
}>()

const emit = defineEmits<{
  'add-line': []
  'remove-line': [id: number]
}>()

const { t } = useI18n()

function getLineSubtotal(line: InvoiceLine): number {
  const importe = line.cantidad * line.precioUd
  return importe + (importe * line.iva) / 100
}
</script>

<template>
  <!-- Desktop table view -->
  <div class="lines-table-wrapper">
    <table class="lines-table">
      <thead>
        <tr>
          <th>{{ t('dashboard.tools.invoice.lineType') }}</th>
          <th>{{ t('dashboard.tools.invoice.lineConcept') }}</th>
          <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineQty') }}</th>
          <th class="lines-table__num">{{ t('dashboard.tools.invoice.linePrice') }}</th>
          <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineIVA') }}</th>
          <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineTotal') }}</th>
          <th class="lines-table__action" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="line in lines" :key="line.id">
          <td>
            <select v-model="line.tipo" class="form-field__select form-field__select--compact">
              <option value="Venta">{{ t('dashboard.tools.invoice.typeVenta') }}</option>
              <option value="Alquiler">
                {{ t('dashboard.tools.invoice.typeAlquiler') }}
              </option>
              <option value="Servicio">
                {{ t('dashboard.tools.invoice.typeServicio') }}
              </option>
              <option value="Transporte">
                {{ t('dashboard.tools.invoice.typeTransporte') }}
              </option>
              <option value="Transferencia">
                {{ t('dashboard.tools.invoice.typeTransferencia') }}
              </option>
            </select>
          </td>
          <td>
            <input
              v-model="line.concepto"
              type="text"
              class="form-field__input form-field__input--compact"
              :placeholder="t('dashboard.tools.invoice.conceptPlaceholder')"
            >
          </td>
          <td class="lines-table__num">
            <input
              v-model.number="line.cantidad"
              type="number"
              min="1"
              step="1"
              class="form-field__input form-field__input--compact form-field__input--num"
            >
          </td>
          <td class="lines-table__num">
            <input
              v-model.number="line.precioUd"
              type="number"
              min="0"
              step="0.01"
              class="form-field__input form-field__input--compact form-field__input--num"
            >
          </td>
          <td class="lines-table__num">
            <input
              v-model.number="line.iva"
              type="number"
              min="0"
              max="100"
              step="1"
              class="form-field__input form-field__input--compact form-field__input--num"
            >
          </td>
          <td class="lines-table__num lines-table__total">
            {{ getLineSubtotal(line).toFixed(2) }} &euro;
          </td>
          <td class="lines-table__action">
            <button
              class="btn-icon btn-icon--danger"
              type="button"
              :title="t('dashboard.tools.invoice.removeLine')"
              @click="emit('remove-line', line.id)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mobile card view for lines -->
  <div class="lines-mobile">
    <div v-for="line in lines" :key="'m-' + line.id" class="line-card">
      <div class="line-card__header">
        <select v-model="line.tipo" class="form-field__select form-field__select--compact">
          <option value="Venta">{{ t('dashboard.tools.invoice.typeVenta') }}</option>
          <option value="Alquiler">{{ t('dashboard.tools.invoice.typeAlquiler') }}</option>
          <option value="Servicio">{{ t('dashboard.tools.invoice.typeServicio') }}</option>
          <option value="Transporte">
            {{ t('dashboard.tools.invoice.typeTransporte') }}
          </option>
          <option value="Transferencia">
            {{ t('dashboard.tools.invoice.typeTransferencia') }}
          </option>
        </select>
        <button
          class="btn-icon btn-icon--danger"
          type="button"
          @click="emit('remove-line', line.id)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <input
        v-model="line.concepto"
        type="text"
        class="form-field__input"
        :placeholder="t('dashboard.tools.invoice.conceptPlaceholder')"
      >
      <div class="line-card__numbers">
        <div class="line-card__field">
          <label>{{ t('dashboard.tools.invoice.lineQty') }}</label>
          <input
            v-model.number="line.cantidad"
            type="number"
            min="1"
            step="1"
            class="form-field__input form-field__input--num"
          >
        </div>
        <div class="line-card__field">
          <label>{{ t('dashboard.tools.invoice.linePrice') }}</label>
          <input
            v-model.number="line.precioUd"
            type="number"
            min="0"
            step="0.01"
            class="form-field__input form-field__input--num"
          >
        </div>
        <div class="line-card__field">
          <label>{{ t('dashboard.tools.invoice.lineIVA') }} %</label>
          <input
            v-model.number="line.iva"
            type="number"
            min="0"
            max="100"
            step="1"
            class="form-field__input form-field__input--num"
          >
        </div>
      </div>
      <div class="line-card__total">
        {{ t('dashboard.tools.invoice.lineTotal') }}:
        <strong>{{ getLineSubtotal(line).toFixed(2) }} &euro;</strong>
      </div>
    </div>
  </div>

  <button class="btn btn--outline btn--add-line" type="button" @click="emit('add-line')">
    + {{ t('dashboard.tools.invoice.addLine') }}
  </button>
</template>

<style scoped>
/* ============ FORM FIELD INPUTS ============ */
.form-field__input,
.form-field__select {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
  width: 100%;
}

.form-field__input:focus,
.form-field__select:focus {
  outline: none;
  border-color: var(--primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.form-field__input--compact {
  min-height: 38px;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
}

.form-field__select--compact {
  min-height: 38px;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
}

.form-field__input--num {
  text-align: right;
  max-width: 100px;
}

/* ============ INVOICE LINES TABLE (Desktop) ============ */
.lines-table-wrapper {
  display: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.lines-table {
  width: 100%;
  border-collapse: collapse;
}

.lines-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.lines-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.lines-table__num {
  text-align: right;
  white-space: nowrap;
}

.lines-table__total {
  font-weight: 600;
  color: var(--primary, #23424a);
}

.lines-table__action {
  width: 44px;
  text-align: center;
}

/* ============ INVOICE LINES MOBILE CARDS ============ */
.lines-mobile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.line-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.line-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.line-card__header select {
  flex: 1;
}

.line-card__numbers {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.line-card__field {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.line-card__field label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.line-card__field .form-field__input--num {
  max-width: 100%;
}

.line-card__total {
  text-align: right;
  font-size: 0.9rem;
  color: var(--primary, #23424a);
}

/* ============ BUTTONS ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.btn--outline {
  background: transparent;
  color: var(--primary, #23424a);
  border: 1px dashed #94a3b8;
}

.btn--outline:hover {
  border-color: var(--primary, #23424a);
  background: rgba(35, 66, 74, 0.04);
}

.btn--add-line {
  margin-top: 1rem;
  width: 100%;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-icon--danger {
  color: #ef4444;
}

.btn-icon--danger:hover {
  background: #fef2f2;
}

/* ============ RESPONSIVE: TABLET+ (768px) ============ */
@media (min-width: 768px) {
  .lines-table-wrapper {
    display: block;
  }

  .lines-mobile {
    display: none;
  }

  .btn--add-line {
    width: auto;
  }
}
</style>
