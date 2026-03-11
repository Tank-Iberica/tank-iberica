<script setup lang="ts">
import type {
  AuctionWithVehicle,
  AuctionListVehicle,
  AuctionForm,
} from '~/composables/admin/useAdminAuctionList'

const props = defineProps<{
  show: boolean
  editing: AuctionWithVehicle | null
  form: AuctionForm
  vehicles: AuctionListVehicle[]
  vehiclesLoading: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  save: []
  close: []
  'update:form': [form: AuctionForm]
}>()

const { t } = useI18n()

// Local proxy so we can v-model form fields and emit updates
const localForm = computed({
  get: () => props.form,
  set: (val: AuctionForm) => emit('update:form', val),
})

function updateField<K extends keyof AuctionForm>(key: K, value: AuctionForm[K]) {
  emit('update:form', { ...props.form, [key]: value })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.show" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>
            {{ props.editing ? t('admin.subastas.editTitle') : t('admin.subastas.createTitle') }}
          </h3>
          <button class="modal-close" @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Vehicle -->
          <div class="form-group">
            <label for="auction-vehicle">{{ t('admin.subastas.form.vehicle') }} *</label>
            <select
              id="auction-vehicle"
              :value="localForm.vehicle_id"
              required
              @change="updateField('vehicle_id', ($event.target as HTMLSelectElement).value)"
            >
              <option value="" disabled>
                {{ t('admin.subastas.form.selectVehicle') }}
              </option>
              <option v-for="v in props.vehicles" :key="v.id" :value="v.id">
                {{ v.brand }} {{ v.model }} {{ v.year || '' }} ({{ v.slug }})
              </option>
            </select>
          </div>

          <!-- Title (optional) -->
          <div class="form-group">
            <label for="auction-title">{{ t('admin.subastas.form.title') }}</label>
            <input
              id="auction-title"
              :value="localForm.title"
              type="text"
              :placeholder="t('admin.subastas.form.titlePlaceholder')"
              @input="updateField('title', ($event.target as HTMLInputElement).value)"
            >
          </div>

          <!-- Prices -->
          <div class="form-row">
            <div class="form-group">
              <label for="auction-start-price"
                >{{ t('admin.subastas.form.startPrice') }} (&euro;) *</label
              >
              <input
                id="auction-start-price"
                :value="localForm.start_price_cents"
                type="number"
                min="0"
                step="100"
                required
                @input="
                  updateField(
                    'start_price_cents',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </div>
            <div class="form-group">
              <label for="auction-reserve-price"
                >{{ t('admin.subastas.form.reservePrice') }} (&euro;)</label
              >
              <input
                id="auction-reserve-price"
                :value="localForm.reserve_price_cents"
                type="number"
                min="0"
                step="100"
                @input="
                  updateField(
                    'reserve_price_cents',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="auction-bid-increment"
                >{{ t('admin.subastas.form.bidIncrement') }} (&euro;) *</label
              >
              <input
                id="auction-bid-increment"
                :value="localForm.bid_increment_cents"
                type="number"
                min="1"
                step="100"
                required
                @input="
                  updateField(
                    'bid_increment_cents',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </div>
            <div class="form-group">
              <label for="auction-deposit">{{ t('admin.subastas.form.deposit') }} (&euro;) *</label>
              <input
                id="auction-deposit"
                :value="localForm.deposit_cents"
                type="number"
                min="0"
                step="100"
                required
                @input="
                  updateField('deposit_cents', Number(($event.target as HTMLInputElement).value))
                "
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="auction-buyer-premium"
                >{{ t('admin.subastas.form.buyerPremium') }} (%) *</label
              >
              <input
                id="auction-buyer-premium"
                :value="localForm.buyer_premium_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                @input="
                  updateField(
                    'buyer_premium_pct',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </div>
            <div class="form-group">
              <label for="auction-anti-snipe"
                >{{ t('admin.subastas.form.antiSnipe') }} (seg) *</label
              >
              <input
                id="auction-anti-snipe"
                :value="localForm.anti_snipe_seconds"
                type="number"
                min="0"
                step="1"
                required
                @input="
                  updateField(
                    'anti_snipe_seconds',
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              >
            </div>
          </div>

          <!-- Dates -->
          <div class="form-row">
            <div class="form-group">
              <label for="auction-starts">{{ t('admin.subastas.form.startsAt') }} *</label>
              <input
                id="auction-starts"
                :value="localForm.starts_at"
                type="datetime-local"
                required
                @input="updateField('starts_at', ($event.target as HTMLInputElement).value)"
              >
            </div>
            <div class="form-group">
              <label for="auction-ends">{{ t('admin.subastas.form.endsAt') }} *</label>
              <input
                id="auction-ends"
                :value="localForm.ends_at"
                type="datetime-local"
                required
                @input="updateField('ends_at', ($event.target as HTMLInputElement).value)"
              >
            </div>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label for="auction-status">{{ t('admin.subastas.columns.status') }} *</label>
            <select
              id="auction-status"
              :value="localForm.status"
              required
              @change="
                updateField(
                  'status',
                  ($event.target as HTMLSelectElement).value as AuctionForm['status'],
                )
              "
            >
              <option value="draft">{{ t('admin.subastas.status.draft') }}</option>
              <option value="scheduled">{{ t('admin.subastas.status.scheduled') }}</option>
              <option value="active">{{ t('admin.subastas.status.active') }}</option>
              <option value="ended">{{ t('admin.subastas.status.ended') }}</option>
              <option value="adjudicated">{{ t('admin.subastas.status.adjudicated') }}</option>
              <option value="cancelled">{{ t('admin.subastas.status.cancelled') }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">
            {{ t('admin.subastas.form.cancel') }}
          </button>
          <button
            class="btn-primary"
            :disabled="props.saving || !localForm.vehicle_id"
            @click="emit('save')"
          >
            {{
              props.saving
                ? '...'
                : props.editing
                  ? t('admin.subastas.form.save')
                  : t('admin.subastas.form.create')
            }}
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
  z-index: 1000;
  padding: var(--spacing-5);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 45rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  cursor: pointer;
  color: var(--color-gray-500);
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: var(--spacing-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6);
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  position: sticky;
  bottom: 0;
}

/* ============================================
   FORM
   ============================================ */
.form-group {
  margin-bottom: var(--spacing-4);
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  box-sizing: border-box;
  min-height: 2.75rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  min-height: 2.75rem;
  font-size: 0.9rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--color-gray-700);
  border: none;
  padding: 0.625rem var(--spacing-5);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  min-height: 2.75rem;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 48em) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
