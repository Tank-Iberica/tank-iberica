<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span
            >{{
              editingId
                ? '&#x270F;&#xFE0F; ' + $t('admin.balance.editTransaction')
                : '&#x2795; ' + $t('admin.balance.newTransaction')
            }}
            {{ $t('admin.balance.transaction') }}</span
          >
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Tipo -->
          <div class="tipo-selector">
            <label :class="{ active: formData.tipo === 'ingreso' }">
              <input v-model="formData.tipo" type="radio" value="ingreso" >
              <span class="tipo-card ingreso">&uarr; {{ $t('admin.balance.incomeType') }}</span>
            </label>
            <label :class="{ active: formData.tipo === 'gasto' }">
              <input v-model="formData.tipo" type="radio" value="gasto" >
              <span class="tipo-card gasto">&darr; {{ $t('admin.balance.expenseType') }}</span>
            </label>
          </div>

          <div class="row-3">
            <div class="field">
              <label for="form-fecha">{{ $t('admin.balance.dateRequired') }}</label>
              <input id="form-fecha" v-model="formData.fecha" type="date" >
            </div>
            <div class="field">
              <label for="form-razon">{{ $t('admin.balance.reasonRequired') }}</label>
              <select id="form-razon" v-model="formData.razon">
                <option v-for="[key, label] in reasonOptions" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="form-estado">{{ $t('admin.balance.statusRequired') }}</label>
              <select id="form-estado" v-model="formData.estado">
                <option v-for="[key, label] in statusOptions" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div class="row-2">
            <div class="field">
              <label for="form-importe">{{ $t('admin.balance.amountEur') }}</label>
              <input
                id="form-importe"
                v-model.number="formData.importe"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              >
            </div>
            <div v-if="formData.tipo === 'ingreso'" class="field">
              <label for="form-coste">{{ $t('admin.balance.associatedCostEur') }}</label>
              <input
                id="form-coste"
                v-model.number="formData.coste_asociado"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              >
            </div>
            <div v-else class="field" />
          </div>

          <div class="field">
            <label for="form-vehicle">{{ $t('admin.balance.relatedVehicle') }}</label>
            <select id="form-vehicle" v-model="formData.vehicle_id" class="vehicle-select">
              <option :value="null">&mdash; {{ $t('admin.balance.noVehicle') }} &mdash;</option>
              <option v-for="v in vehicles" :key="String(v.id)" :value="v.id">
                {{ v.brand }} {{ v.model }} ({{ v.year }}) {{ v.plate ? `- ${v.plate}` : '' }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="form-detalle">{{ $t('admin.balance.detail') }}</label>
            <input
              id="form-detalle"
              v-model="formData.detalle"
              type="text"
              placeholder="Ej: Cisterna MAN 1234ABC (2020)"
            >
          </div>

          <div class="row-2">
            <div class="field">
              <label for="form-type">{{ $t('admin.balance.type') }}</label>
              <select id="form-type" v-model="typeId">
                <option :value="null">&mdash; {{ $t('admin.balance.noType') }} &mdash;</option>
                <option v-for="s in types" :key="s.id" :value="s.id">
                  {{ localizedName(s, locale) }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="form-factura-url">{{ $t('admin.balance.invoiceUrl') }}</label>
              <input
                id="form-factura-url"
                v-model="formData.factura_url"
                type="url"
                placeholder="https://..."
              >
            </div>
          </div>

          <div class="field">
            <label for="form-notas">{{ $t('admin.balance.notes') }}</label>
            <textarea
              id="form-notas"
              v-model="formData.notas"
              rows="2"
              :placeholder="$t('admin.balance.notesPlaceholder')"
            />
          </div>

          <!-- Profit preview -->
          <div
            v-if="formData.tipo === 'ingreso' && formData.coste_asociado && formData.importe"
            class="profit-preview"
          >
            <span>{{ $t('admin.balance.estimatedProfit') }}</span>
            <strong
              :class="
                calculateProfit(formData.importe, formData.coste_asociado)! >= 0
                  ? 'profit-pos'
                  : 'profit-neg'
              "
            >
              {{ fmtPercent(calculateProfit(formData.importe, formData.coste_asociado)) }}
            </strong>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="$emit('close')">{{ $t('admin.balance.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="$emit('save')">
            {{ saving ? $t('admin.balance.saving') : $t('admin.balance.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type {
  BalanceFormData,
  BalanceReason,
  BalanceStatus,
} from '~/composables/admin/useAdminBalance'
import { fmtPercent } from '~/composables/admin/useAdminBalanceUI'
import { localizedName } from '~/composables/useLocalized'

const formData = defineModel<BalanceFormData>('formData', { required: true })

const typeId = computed({
  get: () => formData.value.type_id ?? null,
  set: (v: string | null) => {
    formData.value.type_id = v
  },
})

defineProps<{
  show: boolean
  editingId: string | null
  saving: boolean
  reasonOptions: [BalanceReason, string][]
  statusOptions: [BalanceStatus, string][]
  vehicles: readonly Record<string, unknown>[]
  types: readonly {
    id: string
    name?: Record<string, string> | null
    name_es?: string
    name_en?: string | null
    [key: string]: unknown
  }[]
  locale: string
  calculateProfit: (importe: number, coste: number | null) => number | null
}>()

defineEmits<{
  close: []
  save: []
}>()
</script>

<style scoped>
@import './balance-shared.css';
</style>
