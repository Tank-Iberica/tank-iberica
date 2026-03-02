<script setup lang="ts">
import type { VehicleOption } from '~/composables/admin/useInvoiceGenerator'
import { useInvoiceGenerator } from '~/composables/admin/useInvoiceGenerator'

const props = defineProps<{
  vehicleOptions: VehicleOption[]
  loadingVehicles: boolean
}>()

const {
  invoiceDate,
  invoiceConditions,
  invoiceInEnglish,
  invoiceNumber,
  numVehicles,
  selectedVehicles,
  invoiceLines,
  clientName,
  clientAddress1,
  clientAddress2,
  clientAddress3,
  clientDocType,
  clientDocNumber,
  companyName,
  companyNIF,
  companyAddress1,
  companyAddress2,
  companyAddress3,
  companyPhone,
  companyEmail,
  companyWeb,
  companyLogoUrl,
  invoiceSubtotal,
  invoiceTotalIva,
  invoiceTotal,
  onNumVehiclesChange,
  onVehicleSelected,
  addInvoiceLine,
  removeInvoiceLine,
  getLineImporte,
  getLineSubtotal,
  generateInvoicePDF,
  resetForm,
} = useInvoiceGenerator(() => props.vehicleOptions)
</script>

<template>
  <div class="tool-content">
    <div class="tool-header">
      <h2>🧾 Generador de Facturas</h2>
      <button class="btn btn-secondary btn-sm" @click="resetForm">🔄 Nueva</button>
    </div>

    <div class="invoice-form">
      <!-- Row 1: Basic Info -->
      <div class="form-row">
        <div class="form-group">
          <label>Nº Vehículos</label>
          <input
            v-model.number="numVehicles"
            type="number"
            min="0"
            max="10"
            @change="onNumVehiclesChange"
          />
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input v-model="invoiceDate" type="date" />
        </div>
        <div class="form-group">
          <label>Condiciones</label>
          <input v-model="invoiceConditions" type="text" placeholder="Pago a 30 días" />
        </div>
        <div class="form-group checkbox-inline">
          <label><input v-model="invoiceInEnglish" type="checkbox" /> Emitir en Inglés</label>
        </div>
      </div>

      <!-- Vehicle Selectors -->
      <div v-if="numVehicles > 0" class="vehicles-grid">
        <div v-for="(_, idx) in selectedVehicles" :key="idx" class="form-group">
          <label>Vehículo {{ idx + 1 }}</label>
          <select
            v-model="selectedVehicles[idx]"
            :disabled="loadingVehicles"
            @change="onVehicleSelected(idx)"
          >
            <option value="">-- Seleccionar --</option>
            <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
              {{ veh.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Invoice Number -->
      <div class="form-row">
        <div class="form-group" style="max-width: 200px">
          <label>Nº Factura</label>
          <input v-model="invoiceNumber" type="text" readonly class="readonly-input" />
        </div>
      </div>

      <hr class="divider" />

      <!-- Client Data -->
      <h4 class="section-subtitle">Facturado a:</h4>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Nombre/Empresa</label>
          <input v-model="clientName" type="text" />
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input v-model="clientAddress1" type="text" />
        </div>
        <div class="form-group">
          <label>CP + Ciudad</label>
          <input v-model="clientAddress2" type="text" />
        </div>
        <div class="form-group">
          <label>Provincia + País</label>
          <input v-model="clientAddress3" type="text" />
        </div>
        <div class="form-group">
          <label>Tipo Doc</label>
          <select v-model="clientDocType">
            <option>NIF</option>
            <option>DNI</option>
            <option>Pasaporte</option>
            <option>CIF</option>
          </select>
        </div>
        <div class="form-group">
          <label>Número Doc</label>
          <input v-model="clientDocNumber" type="text" />
        </div>
      </div>

      <hr class="divider" />

      <!-- Invoice Lines -->
      <div class="lines-header">
        <h4 class="section-subtitle">Conceptos:</h4>
        <button class="btn btn-secondary btn-sm" @click="addInvoiceLine">+ Añadir línea</button>
      </div>

      <div class="lines-table">
        <div class="lines-head">
          <span>Tipo</span>
          <span>Concepto</span>
          <span class="right">Cant.</span>
          <span class="right">Precio/Ud</span>
          <span class="right">Importe</span>
          <span class="right">IVA%</span>
          <span class="right">Subtotal</span>
          <span />
        </div>
        <div v-for="line in invoiceLines" :key="line.id" class="line-row">
          <select v-model="line.tipo">
            <option>Venta</option>
            <option>Alquiler</option>
            <option>Servicio</option>
            <option>Reserva</option>
            <option>Otro</option>
          </select>
          <input v-model="line.concepto" type="text" placeholder="Concepto" />
          <input v-model.number="line.cantidad" type="number" min="1" class="right" />
          <input v-model.number="line.precioUd" type="number" step="0.01" class="right" />
          <input
            :value="getLineImporte(line).toFixed(2) + ' €'"
            type="text"
            readonly
            class="right readonly-input"
          />
          <input v-model.number="line.iva" type="number" class="right" />
          <input
            :value="getLineSubtotal(line).toFixed(2) + ' €'"
            type="text"
            readonly
            class="right readonly-input total-cell"
          />
          <button class="btn-delete" @click="removeInvoiceLine(line.id)">×</button>
        </div>
      </div>

      <hr class="divider" />

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-row">
          <span>Base Imponible:</span><span>{{ invoiceSubtotal.toFixed(2) }} €</span>
        </div>
        <div class="totals-row">
          <span>Total IVA:</span><span>{{ invoiceTotalIva.toFixed(2) }} €</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL:</span><span>{{ invoiceTotal.toFixed(2) }} €</span>
        </div>
      </div>

      <hr class="divider" />

      <!-- Company Data (collapsible) -->
      <details class="company-details">
        <summary>Datos de la empresa emisora</summary>
        <div class="form-grid-3">
          <div class="form-group">
            <label>Empresa</label>
            <input v-model="companyName" type="text" />
          </div>
          <div class="form-group">
            <label>NIF</label>
            <input v-model="companyNIF" type="text" />
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input v-model="companyAddress1" type="text" />
          </div>
          <div class="form-group">
            <label>CP + Ciudad</label>
            <input v-model="companyAddress2" type="text" />
          </div>
          <div class="form-group">
            <label>País</label>
            <input v-model="companyAddress3" type="text" />
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="companyPhone" type="text" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="companyEmail" type="text" />
          </div>
          <div class="form-group">
            <label>Web</label>
            <input v-model="companyWeb" type="text" />
          </div>
          <div class="form-group">
            <label>Logo (URL)</label>
            <input v-model="companyLogoUrl" type="text" placeholder="https://..." />
          </div>
        </div>
      </details>

      <!-- Generate Button -->
      <div class="form-actions">
        <button class="btn btn-primary btn-lg" @click="generateInvoicePDF">
          🧾 Generar Factura PDF
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.invoice-form {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.readonly-input {
  background: var(--bg-secondary) !important;
  cursor: default;
}

.checkbox-inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: auto;
}

.checkbox-inline label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.divider {
  border: none;
  border-top: 2px solid #0f2a2e;
  margin: 20px 0;
}

.section-subtitle {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f2a2e;
}

.lines-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.lines-header h4 {
  margin: 0;
}

.lines-table {
  margin-bottom: 16px;
}

.lines-head {
  display: grid;
  grid-template-columns: 90px 1fr 60px 90px 90px 60px 90px 32px;
  gap: 6px;
  padding: 8px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.lines-head .right {
  text-align: right;
}

.line-row {
  display: grid;
  grid-template-columns: 90px 1fr 60px 90px 90px 60px 90px 32px;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}

.line-row select,
.line-row input {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.85rem;
}

.line-row input.right {
  text-align: right;
}

.line-row .total-cell {
  background: #e8f5e9 !important;
  font-weight: 600;
}

.btn-delete {
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: var(--color-error);
}

.totals-section {
  max-width: 300px;
  margin-left: auto;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.9rem;
}

.totals-row.total {
  font-size: 1.1rem;
  font-weight: bold;
  background: #e8f5e9;
  padding: 10px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.company-details {
  margin-bottom: 20px;
}

.company-details summary {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  padding: 8px 0;
}

.company-details summary:hover {
  color: #374151;
}

.company-details[open] summary {
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.btn {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border: none;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .vehicles-grid {
    grid-template-columns: 1fr;
  }

  .lines-head {
    display: none;
  }

  .line-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .line-row select:first-child {
    grid-column: 1 / -1;
  }

  .line-row input[type='text'] {
    grid-column: 1 / -1;
  }

  .btn-delete {
    grid-column: 2;
    justify-self: end;
  }

  .totals-section {
    max-width: 100%;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
