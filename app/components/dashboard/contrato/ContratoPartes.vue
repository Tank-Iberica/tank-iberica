<script setup lang="ts">
/**
 * Contract Parties Form Component
 * Displays lessor/seller and client/buyer information forms
 */

type ContractType = 'arrendamiento' | 'compraventa'
type ClientType = 'persona' | 'empresa'

interface Props {
  contractType: ContractType
  // Lessor/Seller
  lessorRepresentative: string
  lessorRepresentativeNIF: string
  lessorCompany: string
  lessorCIF: string
  lessorAddress: string
  // Client
  clientType: ClientType
  clientName: string
  clientNIF: string
  clientCompany: string
  clientCIF: string
  clientRepresentative: string
  clientRepresentativeNIF: string
  clientAddress: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:lessorRepresentative': [value: string]
  'update:lessorRepresentativeNIF': [value: string]
  'update:lessorCompany': [value: string]
  'update:lessorCIF': [value: string]
  'update:lessorAddress': [value: string]
  'update:clientType': [value: ClientType]
  'update:clientName': [value: string]
  'update:clientNIF': [value: string]
  'update:clientCompany': [value: string]
  'update:clientCIF': [value: string]
  'update:clientRepresentative': [value: string]
  'update:clientRepresentativeNIF': [value: string]
  'update:clientAddress': [value: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="contrato-partes">
    <!-- Lessor / Seller Data -->
    <details class="company-details" open>
      <summary>
        {{
          contractType === 'arrendamiento'
            ? t('dashboard.tools.contract.lessorData')
            : t('dashboard.tools.contract.sellerData')
        }}
      </summary>
      <div class="form-grid-3">
        <div class="form-group">
          <label>{{ t('dashboard.tools.contract.company') }}</label>
          <input
            :value="lessorCompany"
            type="text"
            @input="emit('update:lessorCompany', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="form-group">
          <label>CIF</label>
          <input
            :value="lessorCIF"
            type="text"
            @input="emit('update:lessorCIF', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="form-group">
          <label>{{ t('dashboard.tools.contract.address') }}</label>
          <input
            :value="lessorAddress"
            type="text"
            @input="emit('update:lessorAddress', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="form-group">
          <label>{{ t('dashboard.tools.contract.representative') }}</label>
          <input
            :value="lessorRepresentative"
            type="text"
            @input="emit('update:lessorRepresentative', ($event.target as HTMLInputElement).value)"
          >
        </div>
        <div class="form-group">
          <label>{{ t('dashboard.tools.contract.representativeNIF') }}</label>
          <input
            :value="lessorRepresentativeNIF"
            type="text"
            @input="
              emit('update:lessorRepresentativeNIF', ($event.target as HTMLInputElement).value)
            "
          >
        </div>
      </div>
    </details>

    <hr class="divider" >

    <!-- Client / Buyer Data -->
    <h4 class="section-subtitle">
      {{
        contractType === 'arrendamiento'
          ? t('dashboard.tools.contract.lesseeData')
          : t('dashboard.tools.contract.buyerData')
      }}
    </h4>

    <div class="form-row">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.clientTypeLabel') }}</label>
        <div class="radio-group-inline compact">
          <label :class="{ active: clientType === 'persona' }">
            <input
              :checked="clientType === 'persona'"
              type="radio"
              value="persona"
              @change="emit('update:clientType', 'persona')"
            >
            {{ t('dashboard.tools.contract.clientPerson') }}
          </label>
          <label :class="{ active: clientType === 'empresa' }">
            <input
              :checked="clientType === 'empresa'"
              type="radio"
              value="empresa"
              @change="emit('update:clientType', 'empresa')"
            >
            {{ t('dashboard.tools.contract.clientCompany') }}
          </label>
        </div>
      </div>
    </div>

    <!-- Person fields -->
    <div v-if="clientType === 'persona'" class="form-grid-3">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.fullName') }}</label>
        <input
          :value="clientName"
          type="text"
          @input="emit('update:clientName', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>NIF</label>
        <input
          :value="clientNIF"
          type="text"
          @input="emit('update:clientNIF', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group" style="grid-column: 1 / -1">
        <label>{{ t('dashboard.tools.contract.address') }}</label>
        <input
          :value="clientAddress"
          type="text"
          @input="emit('update:clientAddress', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <!-- Company fields -->
    <div v-if="clientType === 'empresa'" class="form-grid-3">
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.company') }}</label>
        <input
          :value="clientCompany"
          type="text"
          @input="emit('update:clientCompany', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>CIF</label>
        <input
          :value="clientCIF"
          type="text"
          @input="emit('update:clientCIF', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.representative') }}</label>
        <input
          :value="clientRepresentative"
          type="text"
          @input="emit('update:clientRepresentative', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group">
        <label>{{ t('dashboard.tools.contract.representativeNIF') }}</label>
        <input
          :value="clientRepresentativeNIF"
          type="text"
          @input="emit('update:clientRepresentativeNIF', ($event.target as HTMLInputElement).value)"
        >
      </div>
      <div class="form-group" style="grid-column: span 2">
        <label>{{ t('dashboard.tools.contract.address') }}</label>
        <input
          :value="clientAddress"
          type="text"
          @input="emit('update:clientAddress', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.contrato-partes {
  margin-bottom: 20px;
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

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus {
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
  min-height: 44px;
}

.radio-group-inline.compact label.active {
  color: #23424a;
  font-weight: 500;
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
  min-height: 44px;
  display: flex;
  align-items: center;
}

.company-details summary:hover {
  color: #374151;
}

.company-details[open] summary {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
