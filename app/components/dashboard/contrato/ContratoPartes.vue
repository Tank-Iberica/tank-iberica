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
  margin-bottom: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 7.5rem;
}

.form-group label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-gray-700);
}

.form-group input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-ring);
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.divider {
  border: none;
  border-top: 0.125rem solid var(--color-primary-darker);
  margin: 1.25rem 0;
}

.section-subtitle {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary-darker);
}

.radio-group-inline {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.radio-group-inline.compact {
  gap: 1rem;
}

.radio-group-inline.compact label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.9rem;
  min-height: 2.75rem;
}

.radio-group-inline.compact label.active {
  color: var(--color-primary);
  font-weight: 500;
}

.company-details {
  margin-bottom: 1.25rem;
}

.company-details summary {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-gray-500);
  padding: 0.5rem 0;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
}

.company-details summary:hover {
  color: var(--color-gray-700);
}

.company-details[open] summary {
  margin-bottom: 0.75rem;
}

@media (max-width: 48em) {
  .form-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 48.0625em) and (max-width: 48.0625em) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
