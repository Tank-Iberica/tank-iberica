<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span>{{ editingId ? '&#x270F;&#xFE0F; Editar' : '&#x2795; Nueva' }} Transaccion</span>
          <button @click="$emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Tipo -->
          <div class="tipo-selector">
            <label :class="{ active: formData.tipo === 'ingreso' }">
              <input v-model="formData.tipo" type="radio" value="ingreso" >
              <span class="tipo-card ingreso">&uarr; Ingreso</span>
            </label>
            <label :class="{ active: formData.tipo === 'gasto' }">
              <input v-model="formData.tipo" type="radio" value="gasto" >
              <span class="tipo-card gasto">&darr; Gasto</span>
            </label>
          </div>

          <div class="row-3">
            <div class="field">
              <label for="form-fecha">Fecha *</label>
              <input id="form-fecha" v-model="formData.fecha" type="date" >
            </div>
            <div class="field">
              <label for="form-razon">Razon *</label>
              <select id="form-razon" v-model="formData.razon">
                <option v-for="[key, label] in reasonOptions" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="form-estado">Estado *</label>
              <select id="form-estado" v-model="formData.estado">
                <option v-for="[key, label] in statusOptions" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <div class="row-2">
            <div class="field">
              <label for="form-importe">Importe &euro; *</label>
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
              <label for="form-coste">Coste asociado &euro; (para % beneficio)</label>
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
            <label for="form-vehicle">Vehiculo relacionado</label>
            <select id="form-vehicle" v-model="formData.vehicle_id" class="vehicle-select">
              <option :value="null">&mdash; Sin vehiculo &mdash;</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.brand }} {{ v.model }} ({{ v.year }}) {{ v.plate ? `- ${v.plate}` : '' }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="form-detalle">Detalle</label>
            <input
              id="form-detalle"
              v-model="formData.detalle"
              type="text"
              placeholder="Ej: Cisterna MAN 1234ABC (2020)"
            >
          </div>

          <div class="row-2">
            <div class="field">
              <label for="form-type">Tipo</label>
              <select id="form-type" v-model="typeId">
                <option :value="null">&mdash; Sin tipo &mdash;</option>
                <option v-for="s in types" :key="s.id" :value="s.id">
                  {{ localizedName(s, locale) }}
                </option>
              </select>
            </div>
            <div class="field">
              <label for="form-factura-url">URL Factura/Recibo</label>
              <input
                id="form-factura-url"
                v-model="formData.factura_url"
                type="url"
                placeholder="https://..."
              >
            </div>
          </div>

          <div class="field">
            <label for="form-notas">Notas</label>
            <textarea
              id="form-notas"
              v-model="formData.notas"
              rows="2"
              placeholder="Notas adicionales..."
            />
          </div>

          <!-- Profit preview -->
          <div
            v-if="formData.tipo === 'ingreso' && formData.coste_asociado && formData.importe"
            class="profit-preview"
          >
            <span>Beneficio estimado:</span>
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
          <button class="btn" @click="$emit('close')">Cancelar</button>
          <button class="btn btn-primary" :disabled="saving" @click="$emit('save')">
            {{ saving ? 'Guardando...' : 'Guardar' }}
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
  get: () => (formData.value as Record<string, unknown>).type_id as string | null,
  set: (v: string | null) => {
    ;(formData.value as Record<string, unknown>).type_id = v
  },
})

defineProps<{
  show: boolean
  editingId: string | null
  saving: boolean
  reasonOptions: [BalanceReason, string][]
  statusOptions: [BalanceStatus, string][]
  vehicles: Array<Record<string, unknown>>
  types: Array<Record<string, unknown>>
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
