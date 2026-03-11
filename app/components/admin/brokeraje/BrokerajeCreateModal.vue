<script setup lang="ts">
import type { DealMode } from '~/composables/admin/useAdminBrokerage'

const props = defineProps<{
  show: boolean
  saving: boolean
  error: string | null
}>()

defineEmits<{
  close: []
  create: [payload: Record<string, unknown>]
}>()

const vehicleSearch = ref('')
const vehicleResults = ref<Array<{ id: string; brand: string; model: string; year: number | null }>>([])
const selectedVehicle = ref<{ id: string; brand: string; model: string; year: number | null } | null>(null)
const searchingVehicles = ref(false)

const buyerPhone = ref('')
const buyerBudgetMin = ref<number | undefined>()
const buyerBudgetMax = ref<number | undefined>()
const buyerFinancing = ref(false)
const dealMode = ref<DealMode>('broker')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = useSupabaseClient() as any

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (vehicleSearch.value.length < 2) {
    vehicleResults.value = []
    return
  }
  searchTimeout = setTimeout(searchVehicles, 300)
}

async function searchVehicles() {
  searchingVehicles.value = true
  try {
    const { data } = await supabase
      .from('vehicles')
      .select('id, brand, model, year')
      .or(`brand.ilike.%${vehicleSearch.value}%,model.ilike.%${vehicleSearch.value}%`)
      .eq('status', 'published')
      .limit(10)
    vehicleResults.value = data || []
  } catch {
    vehicleResults.value = []
  } finally {
    searchingVehicles.value = false
  }
}

function selectVehicle(v: { id: string; brand: string; model: string; year: number | null }) {
  selectedVehicle.value = v
  vehicleSearch.value = [v.brand, v.model, v.year].filter(Boolean).join(' ')
  vehicleResults.value = []
}

function clearVehicle() {
  selectedVehicle.value = null
  vehicleSearch.value = ''
}

function resetForm() {
  selectedVehicle.value = null
  vehicleSearch.value = ''
  vehicleResults.value = []
  buyerPhone.value = ''
  buyerBudgetMin.value = undefined
  buyerBudgetMax.value = undefined
  buyerFinancing.value = false
  dealMode.value = 'broker'
}

watch(() => props.show, (val) => {
  if (!val) resetForm()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" role="dialog" aria-label="Nuevo Deal">
        <div class="modal-header">
          <h2>Nuevo Deal</h2>
          <button class="close-btn" aria-label="Cerrar" @click="$emit('close')">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Vehicle search -->
          <div class="form-group">
            <label class="form-label">Vehiculo</label>
            <div class="vehicle-search">
              <input
                v-model="vehicleSearch"
                type="text"
                class="form-input"
                placeholder="Buscar por marca o modelo..."
                autocomplete="off"
                @input="onSearchInput"
              >
              <button v-if="selectedVehicle" class="clear-btn" @click="clearVehicle">&times;</button>
            </div>
            <div v-if="vehicleResults.length > 0" class="search-results">
              <button
                v-for="v in vehicleResults"
                :key="v.id"
                class="result-item"
                @click="selectVehicle(v)"
              >
                {{ v.brand }} {{ v.model }} {{ v.year || '' }}
              </button>
            </div>
            <p v-if="searchingVehicles" class="search-hint">Buscando...</p>
          </div>

          <!-- Buyer phone -->
          <div class="form-group">
            <label class="form-label">Telefono comprador</label>
            <input
              v-model="buyerPhone"
              type="tel"
              class="form-input"
              placeholder="+34 600 000 000"
              autocomplete="tel"
            >
          </div>

          <!-- Budget -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Presupuesto min</label>
              <input
                v-model.number="buyerBudgetMin"
                type="number"
                class="form-input"
                placeholder="0"
                min="0"
              >
            </div>
            <div class="form-group">
              <label class="form-label">Presupuesto max</label>
              <input
                v-model.number="buyerBudgetMax"
                type="number"
                class="form-input"
                placeholder="0"
                min="0"
              >
            </div>
          </div>

          <!-- Financing -->
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="buyerFinancing" type="checkbox">
              Necesita financiacion
            </label>
          </div>

          <!-- Deal mode -->
          <div class="form-group">
            <label class="form-label">Modo</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="dealMode" type="radio" value="broker">
                Broker (Tracciona intermedia)
              </label>
              <label class="radio-label">
                <input v-model="dealMode" type="radio" value="tank">
                Tank (compra directa)
              </label>
            </div>
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="$emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="btn-primary"
            :disabled="saving"
            @click="$emit('create', {
              vehicle_id: selectedVehicle?.id,
              buyer_phone: buyerPhone || undefined,
              buyer_budget_min: buyerBudgetMin,
              buyer_budget_max: buyerBudgetMax,
              buyer_financing: buyerFinancing,
              deal_mode: dealMode,
            })"
          >
            {{ saving ? 'Creando...' : 'Crear Deal' }}
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
  z-index: var(--z-modal, 1000);
  padding: var(--spacing-4);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg, 0.75rem);
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.close-btn {
  font-size: 1.5rem;
  color: var(--text-secondary);
  line-height: 1;
  padding: var(--spacing-1);
}

.modal-body {
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--border-color);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.form-input {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.vehicle-search {
  position: relative;
}

.clear-btn {
  position: absolute;
  right: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1.25rem;
}

.search-results {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  max-height: 10rem;
  overflow-y: auto;
}

.result-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  transition: background var(--transition-fast);
}

.result-item:hover {
  background: var(--bg-secondary);
}

.search-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-height: 2.75rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.error-msg {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.btn-primary {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--text-on-dark-primary);
  border-radius: var(--border-radius);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  min-height: 2.75rem;
}
</style>
