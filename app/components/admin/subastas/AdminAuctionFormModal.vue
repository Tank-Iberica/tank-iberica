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
    <div v-if="props.show" class="modal-overlay" @click.self="emit('close')">
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
  padding: 20px;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 720px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
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
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  position: sticky;
  bottom: 0;
}

/* ============================================
   FORM
   ============================================ */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
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
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  min-height: 44px;
}

/* ============================================
   RESPONSIVE — Mobile-first
   ============================================ */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
