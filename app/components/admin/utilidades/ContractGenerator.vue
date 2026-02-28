<script setup lang="ts">
import type { VehicleOption } from '~/composables/admin/useContractGenerator'
import { useContractGenerator } from '~/composables/admin/useContractGenerator'

const props = defineProps<{
  vehicleOptions: VehicleOption[]
  loadingVehicles: boolean
}>()

const {
  contractType,
  contractDate,
  contractLocation,
  contractVehicle,
  lessorRepresentative,
  lessorRepresentativeNIF,
  lessorCompany,
  lessorCIF,
  lessorAddress,
  lesseeType,
  lesseeName,
  lesseeNIF,
  lesseeCompany,
  lesseeCIF,
  lesseeRepresentative,
  lesseeRepresentativeNIF,
  lesseeAddress,
  contractVehicleType,
  contractVehiclePlate,
  contractVehicleResidualValue,
  contractMonthlyRent,
  contractDeposit,
  contractDuration,
  contractDurationUnit,
  contractPaymentDays,
  contractHasPurchaseOption,
  contractPurchasePrice,
  contractPurchaseNotice,
  contractRentMonthsToDiscount,
  contractSalePrice,
  contractSalePaymentMethod,
  contractJurisdiction,
  onContractVehicleSelected,
  generateContractPDF,
  resetForm,
} = useContractGenerator(() => props.vehicleOptions)
</script>

<template>
  <div class="tool-content">
    <div class="tool-header">
      <h2>📝 Generador de Contratos</h2>
      <button class="btn btn-secondary btn-sm" @click="resetForm">🔄 Nuevo</button>
    </div>

    <div class="contract-form">
      <!-- Contract Type -->
      <div class="form-row">
        <div class="form-group" style="flex: 2">
          <label>Tipo de Contrato</label>
          <div class="radio-group-inline">
            <label class="radio-card" :class="{ active: contractType === 'arrendamiento' }">
              <input v-model="contractType" type="radio" value="arrendamiento" >
              <span class="radio-icon">🔄</span>
              <span class="radio-label">Arrendamiento</span>
            </label>
            <label class="radio-card" :class="{ active: contractType === 'venta' }">
              <input v-model="contractType" type="radio" value="venta" >
              <span class="radio-icon">💰</span>
              <span class="radio-label">Compraventa</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input v-model="contractDate" type="date" >
        </div>
        <div class="form-group">
          <label>Lugar</label>
          <input v-model="contractLocation" type="text" placeholder="León" >
        </div>
      </div>

      <!-- Vehicle Selection -->
      <div class="form-row">
        <div class="form-group" style="flex: 2">
          <label>Vehículo</label>
          <select
            v-model="contractVehicle"
            :disabled="loadingVehicles"
            @change="onContractVehicleSelected"
          >
            <option value="">-- Seleccionar del catálogo --</option>
            <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
              {{ veh.label }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de Vehículo</label>
          <input v-model="contractVehicleType" type="text" placeholder="semirremolque cisterna" >
        </div>
        <div class="form-group">
          <label>Matrícula</label>
          <input v-model="contractVehiclePlate" type="text" placeholder="S02999R" >
        </div>
      </div>

      <hr class="divider" >

      <!-- Lessor/Seller (Company) -->
      <details class="company-details" open>
        <summary>
          Datos del {{ contractType === 'arrendamiento' ? 'Arrendador' : 'Vendedor' }} (Empresa)
        </summary>
        <div class="form-grid-3">
          <div class="form-group">
            <label>Empresa</label>
            <input v-model="lessorCompany" type="text" >
          </div>
          <div class="form-group">
            <label>CIF</label>
            <input v-model="lessorCIF" type="text" >
          </div>
          <div class="form-group">
            <label>Domicilio</label>
            <input v-model="lessorAddress" type="text" >
          </div>
          <div class="form-group">
            <label>Representante</label>
            <input v-model="lessorRepresentative" type="text" >
          </div>
          <div class="form-group">
            <label>DNI Representante</label>
            <input v-model="lessorRepresentativeNIF" type="text" >
          </div>
        </div>
      </details>

      <hr class="divider" >

      <!-- Lessee/Buyer -->
      <h4 class="section-subtitle">
        {{ contractType === 'arrendamiento' ? 'Arrendatario' : 'Comprador' }}
      </h4>

      <div class="form-row">
        <div class="form-group">
          <label>Tipo</label>
          <div class="radio-group-inline compact">
            <label :class="{ active: lesseeType === 'persona' }">
              <input v-model="lesseeType" type="radio" value="persona" > Persona física
            </label>
            <label :class="{ active: lesseeType === 'empresa' }">
              <input v-model="lesseeType" type="radio" value="empresa" > Empresa
            </label>
          </div>
        </div>
      </div>

      <!-- Person fields -->
      <div v-if="lesseeType === 'persona'" class="form-grid-3">
        <div class="form-group">
          <label>Nombre completo</label>
          <input v-model="lesseeName" type="text" placeholder="JOSE MANUEL VAZQUEZ LEA" >
        </div>
        <div class="form-group">
          <label>NIF</label>
          <input v-model="lesseeNIF" type="text" placeholder="78813316K" >
        </div>
        <div class="form-group" style="grid-column: 1 / -1">
          <label>Domicilio</label>
          <input
            v-model="lesseeAddress"
            type="text"
            placeholder="Lugar San Cristovo, 12 15310 San Cristovo, A Coruña, España"
          >
        </div>
      </div>

      <!-- Company fields -->
      <div v-if="lesseeType === 'empresa'" class="form-grid-3">
        <div class="form-group">
          <label>Empresa</label>
          <input v-model="lesseeCompany" type="text" >
        </div>
        <div class="form-group">
          <label>CIF</label>
          <input v-model="lesseeCIF" type="text" >
        </div>
        <div class="form-group">
          <label>Representante</label>
          <input v-model="lesseeRepresentative" type="text" >
        </div>
        <div class="form-group">
          <label>NIF Representante</label>
          <input v-model="lesseeRepresentativeNIF" type="text" >
        </div>
        <div class="form-group" style="grid-column: span 2">
          <label>Domicilio</label>
          <input v-model="lesseeAddress" type="text" >
        </div>
      </div>

      <hr class="divider" >

      <!-- Rental Terms (only for arrendamiento) -->
      <div v-if="contractType === 'arrendamiento'">
        <h4 class="section-subtitle">Condiciones del Arrendamiento</h4>

        <div class="form-grid-3">
          <div class="form-group">
            <label>Renta mensual (€)</label>
            <input v-model.number="contractMonthlyRent" type="number" step="100" >
          </div>
          <div class="form-group">
            <label>Fianza (€)</label>
            <input v-model.number="contractDeposit" type="number" step="100" >
          </div>
          <div class="form-group">
            <label>Plazo pago (días)</label>
            <input v-model.number="contractPaymentDays" type="number" >
          </div>
          <div class="form-group">
            <label>Duración</label>
            <input v-model.number="contractDuration" type="number" >
          </div>
          <div class="form-group">
            <label>Unidad</label>
            <select v-model="contractDurationUnit">
              <option value="meses">Meses</option>
              <option value="años">Años</option>
            </select>
          </div>
          <div class="form-group">
            <label>Valor residual (€)</label>
            <input v-model.number="contractVehicleResidualValue" type="number" step="1000" >
          </div>
        </div>

        <!-- Purchase Option -->
        <div class="option-toggle">
          <label>
            <input v-model="contractHasPurchaseOption" type="checkbox" >
            <span>Incluir opción de compra</span>
          </label>
        </div>

        <div v-if="contractHasPurchaseOption" class="form-grid-3 purchase-options">
          <div class="form-group">
            <label>Precio de compra (€)</label>
            <input v-model.number="contractPurchasePrice" type="number" step="1000" >
          </div>
          <div class="form-group">
            <label>Preaviso (días)</label>
            <input v-model.number="contractPurchaseNotice" type="number" >
          </div>
          <div class="form-group">
            <label>Mensualidades a descontar</label>
            <input v-model.number="contractRentMonthsToDiscount" type="number" >
          </div>
        </div>
      </div>

      <!-- Sale Terms (only for venta) -->
      <div v-if="contractType === 'venta'">
        <h4 class="section-subtitle">Condiciones de la Compraventa</h4>

        <div class="form-grid-3">
          <div class="form-group">
            <label>Precio de venta (€)</label>
            <input v-model.number="contractSalePrice" type="number" step="1000" >
          </div>
          <div class="form-group">
            <label>Forma de pago</label>
            <select v-model="contractSalePaymentMethod">
              <option>Transferencia bancaria</option>
              <option>Efectivo</option>
              <option>Cheque</option>
              <option>Financiación</option>
            </select>
          </div>
        </div>
      </div>

      <hr class="divider" >

      <!-- Jurisdiction -->
      <div class="form-row">
        <div class="form-group" style="max-width: 300px">
          <label>Jurisdicción (Tribunales de)</label>
          <input v-model="contractJurisdiction" type="text" placeholder="León" >
        </div>
      </div>

      <!-- Generate Button -->
      <div class="form-actions">
        <button class="btn btn-primary btn-lg" @click="generateContractPDF">
          📝 Generar Contrato PDF
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-content {
  background: #fff;
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

.contract-form {
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
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
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

.radio-group-inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-group-inline.compact {
  gap: 16px;
}

.radio-group-inline.compact label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-group-inline.compact label.active {
  color: #23424a;
  font-weight: 500;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 180px;
}

.radio-card:hover {
  border-color: #23424a;
}

.radio-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}

.radio-card input {
  display: none;
}

.radio-icon {
  font-size: 1.5rem;
}

.radio-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.option-toggle {
  margin: 16px 0;
}

.option-toggle label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
}

.option-toggle input {
  width: 18px;
  height: 18px;
}

.purchase-options {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
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
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #1a3238;
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

  .radio-group-inline {
    flex-direction: column;
  }

  .radio-card {
    min-width: 100%;
  }

  .purchase-options {
    padding: 12px;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
